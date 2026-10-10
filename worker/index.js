import {allowedOrigin,corsResponse} from './cors.js';
import {handleAnalytics} from './analytics.js';
const ENDPOINT='https://script.google.com/macros/s/AKfycbwQjyQLYf0Oo28J_xFxJSZwq-edVJTHkEvd6nAkrpIJAtg28GtsIpaTCVLt7qvx0PZq/exec';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
export default {
 async fetch(request,env,ctx){
  const path=new URL(request.url).pathname;
  if(!['/api/register','/api/analytics/collect'].includes(path))return handleRequest(request,env,ctx);
  if(!allowedOrigin(request))return reply({ok:false,message:'請由網站表單送出。'},403);
  if(request.method==='OPTIONS')return corsResponse(request,new Response(null,{status:204}));
  return corsResponse(request,await handleRequest(request,env,ctx));
 }
};
async function handleRequest(request,env,ctx){
  const analytics=await handleAnalytics(request,env,ctx);if(analytics)return analytics;
  const url=new URL(request.url);
  if(url.pathname!=='/api/register')return env.ASSETS.fetch(request);
  if(request.method!=='POST')return reply({ok:false,message:'請透過表單送出。'},405);
  if(!allowedOrigin(request))return reply({ok:false,message:'請由網站表單送出。'},403);
  if(!request.headers.get('content-type')?.includes('application/json'))return reply({ok:false,message:'格式錯誤。'},415);
  let data;
  try{
   const raw=await request.text();if(raw.length>12000)throw Error();
   data=JSON.parse(raw);
   if(!data||typeof data!=='object'||data.website||data.consent!==true)throw Error();
   for(const [key,max]of Object.entries({name:60,contact:100,interest:30,time:40,note:1000,requestId:36})){
    if(typeof data[key]!=='string'||data[key].length>max||(key!=='note'&&!data[key].trim()))throw Error();
   }
   if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.requestId))throw Error();
  }catch{return reply({ok:false,message:'請確認必填資料與聯繫同意。'},400)}
  try{
   const upstream=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),redirect:'follow',signal:AbortSignal.timeout(25000)});
   const result=await upstream.json();
   if(upstream.ok&&result.ok===true&&result.requestId===data.requestId)return reply({ok:true,requestId:data.requestId});
   return reply({ok:false,message:result.code==='RATE_LIMITED'?'送出過於頻繁，請稍後再試。':'尚無法確認登記結果，資料已保留，請稍後重試。'},result.code==='RATE_LIMITED'?429:502);
  }catch{return reply({ok:false,message:'連線暫時中斷，資料已保留，請稍後重試。'},502)}
}
