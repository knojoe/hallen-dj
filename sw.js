// Hallen-DJ: App-Dateien offline vorhalten. Die Sounds liegen ohnehin lokal (IndexedDB).
// Seite selbst: erst Netz (max. 2,5 s), sonst Cache → Updates kommen sofort an, offline läuft trotzdem alles.
// Ticker-Daten (/api/…) nie aus dem Cache, nur Vereinswappen (/api/image/…) werden zwischengespeichert.
const C='hallen-dj-v17';
const CORE=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const put=(r,res)=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp)).catch(()=>{})}return res};
self.addEventListener('fetch',e=>{const r=e.request;
  if(r.method!=='GET'||r.url.startsWith('blob:'))return;
  if(/\/api\//.test(r.url)&&!/\/api\/image\//.test(r.url))return; // Live-Daten immer frisch
  if(r.mode==='navigate'||/\/(index\.html)?(\?.*)?$/.test(new URL(r.url).pathname)){
    e.respondWith(new Promise(res=>{let done=false;
      const t=setTimeout(()=>{caches.match(r,{ignoreSearch:true}).then(h=>{if(h&&!done){done=true;res(h)}})},2500);
      fetch(r).then(n=>{put(r,n);if(!done){done=true;clearTimeout(t);res(n)}})
        .catch(()=>caches.match(r,{ignoreSearch:true}).then(h=>h||caches.match('./index.html')).then(h2=>{if(!done){done=true;clearTimeout(t);res(h2||Response.error())}}))}));
    return}
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>{
    const net=fetch(r).then(res=>put(r,res)).catch(()=>hit);
    return hit||net}))});
