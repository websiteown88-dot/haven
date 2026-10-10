import {detectDevice} from './device-category.js';
(()=>{
 'use strict';
 if(navigator.doNotTrack==='1'||navigator.globalPrivacyControl===true||!crypto.randomUUID)return;
 const key='haven_analytics_session_v2';let session=crypto.randomUUID(),source='direct',device=detectDevice(navigator),seq=0;
 try{
  const ref=document.referrer?new URL(document.referrer):null;if(ref){const h=ref.hostname;source=ref.origin===location.origin?'internal':/(^|\.)facebook\.com$|(^|\.)fb\.com$/.test(h)?'facebook':/(^|\.)instagram\.com$/.test(h)?'instagram':/(^|\.)google\.[a-z.]+$/.test(h)?'google':/(^|\.)bing\.com$/.test(h)?'bing':'other'}
  const cached=JSON.parse(sessionStorage.getItem(key)||'null');if(cached&&cached.id&&Date.now()-cached.last<1800000){session=cached.id;source=cached.source;device=cached.device;seq=cached.seq||0}
 }catch{}
 let queue=[],sending=false,excluded=false,lastTick=performance.now(),lastInteraction=Date.now(),started=false,lastSection=null,candidate=null,candidateSeconds=0,openPhoto=null;
 const dwell={},seenSections=new Set(),seenContent=new Set(),depths=new Set(),visibleSeconds=new Map();
 const sections=[...document.querySelectorAll('main section[id]')],cards=[...document.querySelectorAll('[data-analytics-content]')];
 function save(){try{sessionStorage.setItem(key,JSON.stringify({id:session,source,device,seq,last:lastInteraction}))}catch{}}
 function emit(kind,target,seconds=0,depth=0){if(excluded)return;queue.push({id:crypto.randomUUID(),kind,target,seconds,depth,seq:++seq});save();if(queue.length>192)queue.shift()}
 function viewContent(target){if(!seenContent.has(target)){seenContent.add(target);emit('content_view',target)}}
 function visible(node){const r=node.getBoundingClientRect();return r.width>0&&Math.max(0,Math.min(r.bottom,innerHeight)-Math.max(r.top,0))>=Math.min(r.height,innerHeight)*.5}
 function activeSection(){const y=innerHeight*.42;return sections.find(s=>{const r=s.getBoundingClientRect();return r.top<=y&&r.bottom>y})?.id||'other'}
 function accrue(kind,target,seconds){const key=kind+':'+target;dwell[key]=(dwell[key]||0)+seconds}
 function tick(){
  const now=performance.now(),seconds=Math.min(2,(now-lastTick)/1000);lastTick=now;
  if(document.visibilityState!=='visible'||!document.hasFocus()||Date.now()-lastInteraction>60000){visibleSeconds.clear();candidateSeconds=0;return}
  const section=openPhoto?'space':activeSection();
  if(!seenSections.has(section)){seenSections.add(section);emit('section_view',section)}
  if(candidate!==section){candidate=section;candidateSeconds=0}candidateSeconds+=seconds;
  if(candidateSeconds>=2&&lastSection!==section){emit('section_step',section);if(lastSection)emit('transition',lastSection+'>'+section);lastSection=section}
  accrue('dwell',section,seconds);
  if(openPhoto){accrue('content_dwell',openPhoto,seconds);return}
  for(const card of cards){const target=card.dataset.analyticsContent;
   if(visible(card)){const prior=visibleSeconds.get(target)||0,total=prior+seconds;visibleSeconds.set(target,total);if(total>=2){viewContent(target);accrue('content_dwell',target,prior<2?total:seconds)}}else visibleSeconds.delete(target);
  }
 }
 function pack(){for(const [key,value]of Object.entries(dwell)){const seconds=Math.min(30,Math.floor(value));if(seconds){const [kind,target]=key.split(':');emit(kind,target,seconds);dwell[key]=value-seconds}}}
 async function flush(beacon=false){tick();pack();if(excluded||!queue.length)return;
  const events=queue.slice(0,24),body=JSON.stringify({session,source,device,version:2,events});
  if(beacon&&navigator.sendBeacon){if(navigator.sendBeacon('https://haven-health-club.simon881.chatgpt.site/api/analytics/collect',new Blob([body],{type:'text/plain'})))queue=queue.filter(e=>!events.some(x=>x.id===e.id));return}
  if(sending)return;sending=true;try{const r=await fetch('https://haven-health-club.simon881.chatgpt.site/api/analytics/collect',{method:'POST',headers:{'Content-Type':'text/plain'},body,keepalive:true});const d=await r.json();if(r.ok&&d.ok){queue=queue.filter(e=>!events.some(x=>x.id===e.id));if(d.excluded){excluded=true;queue=[]}}}catch{}finally{sending=false}
  if(queue.length&&!excluded&&queue[0]?.id!==events[0]?.id)queueMicrotask(()=>flush());
 }
 function activity(){lastInteraction=Date.now();save()}
 ['pointerdown','keydown','scroll'].forEach(type=>addEventListener(type,activity,{passive:true}));
 addEventListener('scroll',()=>{const total=document.documentElement.scrollHeight-innerHeight;if(total<=0)return;for(const depth of [25,50,75,100])if(scrollY/total*100>=(depth===100?98:depth)&&!depths.has(depth)){depths.add(depth);emit('scroll','other',0,depth)}},{passive:true});
 document.addEventListener('click',e=>{
  const content=e.target.closest('[data-analytics-content]');if(content){const t=content.dataset.analyticsContent;viewContent(t);emit('content_click',t);if(content.matches('.gallery-item'))openPhoto=t}
  const a=e.target.closest('a,button');if(!a)return;let target=null;
  if(a.matches('.gallery-item'))target='gallery';else if(a.matches('.mobile-book'))target='mobile_offer';else if(a.matches('.nav-book'))target='nav_offer';else if(a.closest('.hero-actions')&&a.getAttribute('href')==='#visit')target='hero_offer';else if(a.closest('.membership')&&a.getAttribute('href')==='#visit')target='membership_offer';else if(a.tagName==='A'){try{const u=new URL(a.href);if(u.hostname==='www.facebook.com')target='facebook';else if(u.hostname==='www.instagram.com')target='instagram';else if(u.hostname==='www.google.com'&&u.pathname.startsWith('/maps'))target='map';else if(a.closest('#navigation'))target='navigation'}catch{}}if(target)emit('action',target);
 });
 document.querySelector('#lightbox')?.addEventListener('close',()=>{tick();openPhoto=null});
 const form=document.querySelector('#booking-form'),fields=['name','contact','interest','time','note','consent'];
 form?.addEventListener('focusin',e=>{if(!fields.includes(e.target.id))return;if(!started){started=true;emit('action','form_start')}emit('field_focus',e.target.id)});
 form?.addEventListener('invalid',e=>{if(fields.includes(e.target.id))emit('field_error',e.target.id)},true);
 addEventListener('haven:registration',e=>{if(['form_submit','form_success','form_error'].includes(e.detail)){emit('action',e.detail);flush()}});
 addEventListener('pagehide',()=>flush(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)flush(true);lastTick=performance.now()});
 emit('page_view','home');setInterval(tick,1000);setInterval(()=>flush(),10000);flush();
})();
