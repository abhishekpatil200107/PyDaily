const C='pydaily-v5';
const FILES=['./','index.html','manifest.json','icon-192.png','icon-512.png','icon-maskable-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>Promise.allSettled(FILES.map(f=>c.add(f)))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith((async()=>{
    const cache=await caches.open(C);
    const hit=await cache.match(r,{ignoreSearch:true})||(r.mode==='navigate'?await cache.match('index.html'):null);
    const net=fetch(r).then(res=>{if(res&&res.ok)cache.put(r,res.clone());return res}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}          // open instantly from saved files, refresh in background
    return (await net)||(r.mode==='navigate'?await cache.match('index.html'):Response.error());
  })());
});
