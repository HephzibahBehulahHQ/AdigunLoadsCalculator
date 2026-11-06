import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "powerlab-offline",
      closeBundle() {
        const walk = (dir: string): string[] =>
          readdirSync(dir, { withFileTypes: true }).flatMap((f) =>
            f.isDirectory()
              ? walk(join(dir, f.name))
              : [join(dir, f.name).replace(/^dist\//, "")],
          );
        const files = walk("dist").filter(
          (f) => !f.endsWith(".map") && f !== "sw.js",
        );
        const version = String(Date.now());
        // This cache contains only our public static build files. Module requests
        // can send Origin while precache fetches do not; Vary: Origin must not
        // make the same immutable asset unavailable offline. Scope isolation
        // also prevents one repository deployment clearing another one's cache.
        writeFileSync(
          "dist/sw.js",
          `const PREFIX='powerlab:'+self.registration.scope+':';const CACHE=PREFIX+${JSON.stringify(version)};const FILES=${JSON.stringify(files)};
const INDEX=new URL('index.html',self.registration.scope).href;
const ACTIVE=new URL('__powerlab_active__',self.registration.scope).href;
const MATCH={ignoreVary:true};
let previous;
async function previousValidCache(){
  const names=await caches.keys(),valid=[];
  for(let order=0;order<names.length;order++){
    const name=names[order];
    if(!name.startsWith(PREFIX)||name===CACHE)continue;
    const cache=await caches.open(name),index=await cache.match(INDEX,MATCH);
    if(!index?.ok)continue;
    const entry=(await index.text()).match(/<script[^>]+src=["']([^"']+)["']/)?.[1];
    if(!entry)continue;
    const url=new URL(entry,INDEX);
    if(!url.href.startsWith(self.registration.scope))continue;
    if(!(await cache.match(url.href,MATCH))?.ok)continue;
    // Installed assets are atomic. Empty interrupted installs never qualify.
    // Activation stamps prefer the last active build over superseded installs;
    // index + entry also support caches created by the earlier worker.
    const marker=await cache.match(ACTIVE,MATCH);
    const activated=marker?Number(await marker.text()):0;
    valid.push({name,order,activated:Number.isFinite(activated)?activated:0});
  }
  valid.sort((a,b)=>b.activated-a.activated||b.order-a.order);
  return valid[0]?.name;
}
function previousCache(){return previous??=(previousValidCache());}
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new URL(f,self.registration.scope).href)))));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  const keep=await previousCache();
  await Promise.all((await caches.keys()).filter(k=>k.startsWith(PREFIX)&&k!==CACHE&&k!==keep).map(k=>caches.delete(k)));
  await (await caches.open(CACHE)).put(ACTIVE,new Response(String(Date.now())));
  await self.clients.claim();
})()));
self.addEventListener('message',e=>{if(e.data==='ACTIVATE_UPDATE')self.skipWaiting()});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||!e.request.url.startsWith(self.registration.scope))return;
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE),current=await cache.match(e.request,MATCH);
    if(current)return current;
    // Never serve a previous HTML shell or data from an unrelated cache.
    if(e.request.mode!=='navigate'&&/\\.(?:js|css|json|wasm|svg|png|jpe?g|gif|webp|avif|ico|ttf|otf|woff2?)$/.test(new URL(e.request.url).pathname)){
      const name=await previousCache();
      const prior=name&&await (await caches.open(name)).match(e.request,MATCH);
      if(prior?.ok)return prior;
    }
    try{return await fetch(e.request);}catch{
      return e.request.mode==='navigate'?(await cache.match(INDEX,MATCH))||Response.error():Response.error();
    }
  })());
});`,
        );
      },
    },
  ],
  build: { target: "es2022", chunkSizeWarningLimit: 900 },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
} as Parameters<typeof defineConfig>[0]);
