'use strict';
const header=document.querySelector('#header');
const menu=document.querySelector('.menu-toggle');
const nav=document.querySelector('#navigation');
function setMenu(open){document.body.classList.toggle('menu-open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'關閉選單':'開啟選單');}
menu.addEventListener('click',()=>setMenu(menu.getAttribute('aria-expanded')!=='true'));
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('menu-open')){setMenu(false);menu.focus()}if(e.key==='Tab'&&document.body.classList.contains('menu-open')){const items=[menu,...nav.querySelectorAll('a')];const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
window.addEventListener('resize',()=>{if(innerWidth>760)setMenu(false)});
function onScroll(){header.classList.toggle('scrolled',scrollY>60)}onScroll();window.addEventListener('scroll',onScroll,{passive:true});
document.querySelector('#year').textContent=new Date().getFullYear();
const dialog=document.querySelector('#lightbox');let previousFocus;
document.querySelectorAll('.gallery-item').forEach(button=>button.addEventListener('click',()=>{previousFocus=button;document.querySelector('#lightbox-image').src='assets/'+button.dataset.photo+'-1600.webp';document.querySelector('#lightbox-image').alt=button.querySelector('img').alt;document.querySelector('#lightbox-title').textContent=button.dataset.title;dialog.showModal()}));
document.querySelector('.close-lightbox').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});dialog.addEventListener('close',()=>previousFocus?.focus());
if(window.gsap&&window.ScrollTrigger){gsap.registerPlugin(ScrollTrigger);const mm=gsap.matchMedia();mm.add('(prefers-reduced-motion: no-preference)',()=>{gsap.utils.toArray('.reveal').forEach(el=>gsap.from(el,{opacity:0,y:25,filter:'blur(4px)',duration:1.15,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 92%',once:true}}));gsap.utils.toArray('.mask').forEach(el=>gsap.from(el,{clipPath:'inset(12% 0 12% 0)',duration:1.4,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 85%',once:true}}));});mm.add('(min-width:1100px) and (prefers-reduced-motion: no-preference)',()=>{const section=document.querySelector('.pillars');if(!section)return;section.classList.add('has-scroll-story');const stories=gsap.utils.toArray('.pillar');gsap.set(stories.slice(1),{autoAlpha:0,y:25});const timeline=gsap.timeline({scrollTrigger:{trigger:section,start:'top top',end:'+=190%',pin:true,scrub:.9,invalidateOnRefresh:true}});timeline.to({}, {duration:.4});for(let i=1;i<stories.length;i++){timeline.to(stories[i-1],{autoAlpha:0,y:-20,duration:.4}).to(stories[i],{autoAlpha:1,y:0,duration:.7},'<.15').to({}, {duration:.6})}gsap.to('.wide-photo>img',{yPercent:7,scale:1.1,ease:'none',scrollTrigger:{trigger:'.wide-photo',start:'top bottom',end:'bottom top',scrub:1}});return()=>section.classList.remove('has-scroll-story')});window.addEventListener('load',()=>ScrollTrigger.refresh());}

const form=document.querySelector('#booking-form');
if(form){
 let pendingId=null,pendingPayload=null,busy=false,completed=false;
 const submit=document.querySelector('#submit-registration');
 const result=document.querySelector('#form-result');
 const successDialog=document.querySelector('#registration-success');
 successDialog.querySelectorAll('.success-close,.success-confirm').forEach(button=>button.addEventListener('click',()=>successDialog.close()));
 successDialog.addEventListener('close',()=>{document.body.classList.remove('registration-modal-open');result.focus({preventScroll:true})});
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(busy||completed||!form.reportValidity())return;
  const values=new FormData(form);
  const payload=Object.fromEntries(['name','contact','interest','time','note','website'].map(k=>[k,String(values.get(k)||'').trim()]));
  payload.consent=true; // Consent is given by submitting the visible contact notice.
  if(!payload.name||!payload.contact){result.hidden=false;result.textContent='請填寫姓名與手機或 LINE ID。';return}
  const signature=JSON.stringify(payload);
  if(pendingPayload!==signature){pendingId=crypto.randomUUID();pendingPayload=signature;}
  window.dispatchEvent(new CustomEvent('haven:registration',{detail:'form_submit'}));busy=true;submit.disabled=true;submit.textContent='送出中…';form.setAttribute('aria-busy','true');result.hidden=false;result.dataset.state='pending';result.textContent='正在送出，請稍候。';
  try{
   const response=await fetch('https://haven-health-club.simon881.chatgpt.site/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,requestId:pendingId}),signal:AbortSignal.timeout(35000)});
   if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('登記服務暫時無法連線，請稍後重試。');
   const data=await response.json();
   if(!response.ok||data.ok!==true||data.requestId!==pendingId)throw new Error(data.message||'暫時無法確認結果，請稍後重試。');
   completed=true;window.dispatchEvent(new CustomEvent('haven:registration',{detail:'form_success'}));result.dataset.state='success';result.textContent='登記成功！我們已收到你的資料，將由專人與你聯繫。登記不代表完成入會或保留優惠名額。';submit.textContent='已完成登記';document.body.classList.add('registration-modal-open');successDialog.showModal();
  }catch(error){window.dispatchEvent(new CustomEvent('haven:registration',{detail:'form_error'}));result.dataset.state='error';result.textContent=error.name==='TimeoutError'?'連線逾時，資料已保留。請重試以確認結果。':(error.message==='Failed to fetch'?'連線中斷，資料已保留，請稍後重試。':error.message);submit.disabled=false;submit.textContent='重新送出';}
  finally{busy=false;form.removeAttribute('aria-busy');if(!successDialog.open)result.focus({preventScroll:true});}
 });
}
