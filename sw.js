const C='pydaily-v11';
const FILES=['./','index.html','manifest.json','icon-192.png','icon-512.png','icon-maskable-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>Promise.allSettled(FILES.map(f=>c.add(new Request(f,{cache:'reload'}))))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  const same=u.origin===location.origin,fonts=/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if(r.method!=='GET'||!(same||fonts))return;
  e.respondWith((async()=>{
    const cache=await caches.open(C);
    const find=async()=>(await cache.match(r,{ignoreSearch:true}))||(r.mode==='navigate'?await cache.match('index.html'):null);
    if(fonts){const m=await find();if(m)return m}
    try{                                   // online: always get the newest files
      const res=await Promise.race([fetch(r,{cache:'no-cache'}),new Promise((_,j)=>setTimeout(()=>j(0),4000))]);
      if(res&&(res.ok||res.type==='opaque'))cache.put(r,res.clone());
      return res;
    }catch(x){return (await find())||Response.error()}   // offline or slow: use saved copy
  })());
});
