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
        const version = "powerlab-" + Date.now();
        writeFileSync(
          "dist/sw.js",
          `const CACHE=${JSON.stringify(version)};const FILES=${JSON.stringify(files)};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new URL(f,self.registration.scope).href)))));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('powerlab-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('message',e=>{if(e.data==='ACTIVATE_UPDATE')self.skipWaiting()});self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!e.request.url.startsWith(self.registration.scope))return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).catch(()=>e.request.mode==='navigate'?caches.match(new URL('index.html',self.registration.scope).href):Response.error())))});`,
        );
      },
    },
  ],
  build: { target: "es2022", chunkSizeWarningLimit: 900 },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
} as Parameters<typeof defineConfig>[0]);
