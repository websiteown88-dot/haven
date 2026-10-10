import {allowedOrigin} from './cors.js';
import dashboardHtml from './dashboard-page.js';
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const sections=['home','haven','experience','space','move','membership','visit','location','other'];
const clicks=['hero_offer','nav_offer','mobile_offer','membership_offer','facebook','instagram','map','gallery','navigation','form_start','form_submit','form_success','form_error'];
const content=['service_open','service_pt','service_group','service_yoga','service_functional','photo_arrival','photo_training','photo_locker','photo_lounge'];
const fields=['name','contact','interest','time','note','consent'];
const devices=['mobile','tablet','desktop','unknown'];
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const owner=(req,env)=>!!env.ANALYTICS_OWNER_EMAIL&&req.headers.get('oai-authenticated-user-email')?.toLowerCase()===env.ANALYTICS_OWNER_EMAIL.toLowerCase();
function db(env){if(!env.DB)throw new Error('Analytics unavailable');return env.DB;}
export function validBatch(body){
 if(!body||!uuid.test(body.session)||!Array.isArray(body.events)||body.events.length>24)throw Error('invalid');
 if(!['direct','internal','facebook','instagram','google','bing','other'].includes(body.source)||!devices.includes(body.device))throw Error('invalid');
 return body.events.map(e=>{
  if(!e||!uuid.test(e.id)||!['page_view','section_view','section_step','dwell','scroll','action','content_view','content_dwell','content_click','field_focus','field_error','transition'].includes(e.kind))throw Error('invalid');
  const allowed=e.kind==='action'?clicks.includes(e.target):e.kind.startsWith('content_')?content.includes(e.target):e.kind.startsWith('field_')?fields.includes(e.target):e.kind==='transition'?(typeof e.target==='string'&&e.target.split('>').length===2&&e.target.split('>').every(t=>sections.includes(t))):sections.includes(e.target);
  if(!allowed)throw Error('invalid');
  if(e.seq!==undefined&&(!Number.isInteger(e.seq)||e.seq<1||e.seq>1000000000))throw Error('invalid');
  if(body.version!==undefined&&body.version!==2)throw Error('invalid');
  if(!Number.isInteger(e.seconds)||e.seconds<0||e.seconds>30||!Number.isInteger(e.depth)||![0,25,50,75,100].includes(e.depth))throw Error('invalid');
  if(!['dwell','content_dwell'].includes(e.kind)&&e.seconds!==0)throw Error('invalid');
  return e;
 });
}
export async function handleAnalytics(request,env,ctx){
 const url=new URL(request.url),path=url.pathname;
 if(path==='/analytics.html'||path==='/analytics'){
  if(!request.headers.get('oai-authenticated-user-id'))return Response.redirect(url.origin+'/signin-with-chatgpt?return_to=%2Fanalytics.html',302);
  if(!owner(request,env))return new Response('此分析後台僅限網站管理者查看。',{status:403,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
  return new Response(dashboardHtml,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store'}});
 }
 if(path==='/api/analytics/collect'){
  if(request.method!=='POST')return json({ok:false},405);
  if(!allowedOrigin(request))return json({ok:false},403);
  if(owner(request,env)||request.headers.get('sec-gpc')==='1'||request.headers.get('dnt')==='1')return json({ok:true,excluded:true});
  try{
   const raw=await request.text();if(raw.length>14000)return json({ok:false},413);
   const body=JSON.parse(raw),events=validBatch(body),now=Date.now();
   const database=db(env);
   const recent=await database.prepare('SELECT COUNT(*) AS n FROM analytics_events WHERE session=? AND created_at>?').bind(body.session,now-3600000).first();
   if(recent.n>=2000)return json({ok:false},429);
   if(events.length)await database.batch(events.map(e=>database.prepare('INSERT OR IGNORE INTO analytics_events (id,session,kind,target,seconds,depth,source,device,created_at,seq,version) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(e.id,body.session,e.kind,e.target,e.seconds,e.depth,body.source,body.device,now,e.seq||0,body.version||1)));
   // Bounded retention cleanup; no visitor inputs are used in the SQL text.
   ctx?.waitUntil(database.prepare('DELETE FROM analytics_events WHERE id IN (SELECT id FROM analytics_events WHERE created_at<? LIMIT 500)').bind(now-90*86400000).run().catch(()=>{}));
   return json({ok:true});
  }catch{return json({ok:false,message:'分析服務暫時不可用'},503)}
 }
 if(path==='/api/analytics/report'){
  if(!owner(request,env))return json({ok:false,message:'請使用網站擁有者帳號登入。'},403);
  if(request.method!=='GET')return json({ok:false},405);
  const days=Number(url.searchParams.get('days')||7);if(![1,7,30].includes(days))return json({ok:false},400);
  const device=url.searchParams.get('device')||'all';if(!['all',...devices].includes(device))return json({ok:false},400);
  const now=Date.now(),today=Math.floor((now+28800000)/86400000)*86400000-28800000,start=today-(days-1)*86400000;
  try{
   const database=db(env);
   const raw=async(sql,...args)=>(await database.prepare(sql).bind(...args).all()).results;
   const q=(sql,...args)=>raw(`WITH selected AS (SELECT * FROM analytics_events WHERE created_at>=? AND (?='all' OR device=?)) `+sql,start,device,device,...args);
   const [summary,sectionsData,actions,deviceMix,sources,daily,funnel,depth,deviceComparison,contentData,paths,lastSections,fieldData]=await Promise.all([
    q(`SELECT COUNT(DISTINCT session) sessions,SUM(CASE WHEN kind='page_view' THEN 1 ELSE 0 END) pageviews,COALESCE(SUM(CASE WHEN kind='dwell' THEN seconds ELSE 0 END),0) seconds,COUNT(DISTINCT CASE WHEN version=1 THEN session END) legacy FROM selected`),
    q(`SELECT target,COUNT(DISTINCT CASE WHEN kind='section_view' THEN session END) visitors,SUM(seconds) seconds FROM selected WHERE kind IN ('section_view','dwell') GROUP BY target`),
    q(`SELECT target,COUNT(*) total,COUNT(DISTINCT session) sessions FROM selected WHERE kind='action' GROUP BY target ORDER BY total DESC`),
    q(`SELECT device label,COUNT(DISTINCT session) total FROM selected GROUP BY device`),
    q(`SELECT source label,COUNT(DISTINCT session) total FROM selected GROUP BY source`),
    q(`SELECT date(created_at/1000,'unixepoch','+8 hours') day,COUNT(DISTINCT session) sessions FROM selected GROUP BY day ORDER BY day`),
    q(`SELECT COUNT(DISTINCT session) visitors,COUNT(DISTINCT CASE WHEN kind='action' AND target='form_start' THEN session END) starts,COUNT(DISTINCT CASE WHEN kind='action' AND target='form_submit' THEN session END) submits,COUNT(DISTINCT CASE WHEN kind='action' AND target='form_success' THEN session END) successes FROM selected`),
    q(`SELECT depth,COUNT(DISTINCT session) total FROM selected WHERE kind='scroll' GROUP BY depth ORDER BY depth`),
    raw(`WITH period AS (SELECT * FROM analytics_events WHERE created_at>=?) SELECT device,COUNT(DISTINCT session) sessions,SUM(CASE WHEN kind='dwell' THEN seconds ELSE 0 END) seconds,COUNT(DISTINCT CASE WHEN kind='action' AND target IN ('hero_offer','nav_offer','mobile_offer','membership_offer') THEN session END) offers,COUNT(DISTINCT CASE WHEN kind='action' AND target='form_start' THEN session END) starts,COUNT(DISTINCT CASE WHEN kind='action' AND target='form_success' THEN session END) successes,COUNT(DISTINCT CASE WHEN e.kind='action' AND e.target='form_success' AND EXISTS(SELECT 1 FROM period f WHERE f.session=e.session AND f.kind='action' AND f.target='form_start' AND ((f.seq>0 AND e.seq>f.seq) OR (f.seq=0 AND f.created_at<=e.created_at))) THEN e.session END) completedStarts FROM period e GROUP BY device`,start),
    q(`, per_content AS (SELECT session,target,MIN(CASE WHEN kind='content_view' THEN seq END) first_seq,MAX(CASE WHEN kind='content_view' THEN 1 ELSE 0 END) viewed,MAX(CASE WHEN kind='content_click' THEN 1 ELSE 0 END) clicked,SUM(CASE WHEN kind='content_click' THEN 1 ELSE 0 END) clicks,SUM(CASE WHEN kind='content_dwell' THEN seconds ELSE 0 END) seconds FROM selected WHERE kind IN ('content_view','content_click','content_dwell') GROUP BY session,target) SELECT v.target,COUNT(*) viewers,SUM(v.clicked) interacted,SUM(v.clicks) clicks,SUM(v.seconds) seconds,SUM(CASE WHEN EXISTS (SELECT 1 FROM selected c WHERE c.session=v.session AND c.kind='action' AND c.target='form_success' AND c.seq>v.first_seq) THEN 1 ELSE 0 END) converted FROM per_content v WHERE v.viewed=1 GROUP BY v.target ORDER BY viewers DESC`),
    q(`SELECT target,COUNT(*) total,COUNT(DISTINCT session) sessions FROM selected WHERE kind='transition' GROUP BY target ORDER BY sessions DESC,total DESC LIMIT 15`),
    q(`, ended AS (SELECT session FROM selected GROUP BY session HAVING MAX(created_at)<?), ranked AS (SELECT e.target,e.session,ROW_NUMBER() OVER(PARTITION BY e.session ORDER BY e.seq DESC,e.created_at DESC) rn FROM selected e JOIN ended ON ended.session=e.session WHERE e.kind='section_step') SELECT target,COUNT(*) sessions FROM ranked WHERE rn=1 GROUP BY target ORDER BY sessions DESC`,now-1800000),
    q(`, ended AS (SELECT session FROM selected GROUP BY session HAVING MAX(created_at)<?), last_fields AS (SELECT f.target,f.session,ROW_NUMBER() OVER(PARTITION BY f.session ORDER BY f.seq DESC) rn FROM selected f JOIN ended ON f.session=ended.session WHERE f.kind='field_focus' AND NOT EXISTS(SELECT 1 FROM selected c WHERE c.session=f.session AND c.kind='action' AND c.target='form_success')) SELECT target,COUNT(DISTINCT CASE WHEN kind='field_focus' THEN session END) focused,SUM(CASE WHEN kind='field_error' THEN 1 ELSE 0 END) errors,(SELECT COUNT(*) FROM last_fields l WHERE l.target=e.target AND rn=1) unfinished FROM selected e WHERE kind IN ('field_focus','field_error') GROUP BY target`,now-1800000)
   ]);
   return json({ok:true,generatedAt:now,days,start,device,summary:summary[0],sections:sectionsData,actions,devices:deviceMix,sources,daily,funnel:funnel[0],depth,deviceComparison,content:contentData,paths,lastSections,fields:fieldData});
  }catch{return json({ok:false,message:'暫時無法載入分析，請稍後重試。'},503)}
 }
 return null;
}
