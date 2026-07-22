import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
const root=new URL('../../',import.meta.url);const read=p=>readFile(new URL(p,root),'utf8');
async function walk(u){const out=[];for(const e of await readdir(u,{withFileTypes:true})){const c=new URL(e.name+(e.isDirectory()?'/':''),u);out.push(...(e.isDirectory()?await walk(c):[c]));}return out;}
test('shared package imports the painted raster skin',async()=>assert.match(await read('packages/ui/src/index.ts'),/raster-system\.css/));
test('manifest covers every surface and required source board',async()=>{const m=JSON.parse(await read('packages/ui/manifests/raster-assets.json'));for(const k of ['command-core','mobile-ui','salvage-bay','broadcast-overlay'])assert.ok(m.sources[k]);assert.deepEqual([...new Set(m.assets.flatMap(a=>a.applications))].sort(),['admin','overlay','player']);});
test('raster directory contains only WebP artwork',async()=>{const f=await walk(new URL('packages/ui/assets/raster/',root));assert.ok(f.length>=20);assert.ok(f.every(x=>x.pathname.endsWith('.webp')));});
test('skin maps player admin mobile and OBS classes',async()=>{const c=await read('packages/ui/src/raster-system.css');for(const s of ['.player-shell','.admin-shell','.nw-panel','.nw-button','.nw-command-nav__mobile','.nw-inventory-slot','.broadcast-canvas','.dispatch-rail','.nw-overlay-event'])assert.ok(c.includes(s));assert.match(c,/background:transparent!important/);assert.match(c,/pointer-events:none!important/);});
