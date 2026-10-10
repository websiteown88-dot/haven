// Coarse device category only; raw UA/platform/touch data is never transmitted.
export function detectDevice(nav){
 const ua=nav.userAgent||'',platform=nav.userAgentData?.platform||nav.platform||'',touch=Number(nav.maxTouchPoints||0);
 if(/iPad|Tablet|PlayBook|Kindle|Silk/i.test(ua)||(/Mac/i.test(platform)&&touch>1)||(/Android/i.test(ua)&&!/Mobile/i.test(ua)))return 'tablet';
 if(/iPhone|iPod|Windows Phone|Android.*Mobile/i.test(ua)||nav.userAgentData?.mobile===true)return 'mobile';
 if(/Windows|Macintosh|X11|CrOS/i.test(ua)||(/Win|Mac|Linux|Chrome OS/i.test(platform)&&touch===0))return 'desktop';
 return 'unknown';
}
