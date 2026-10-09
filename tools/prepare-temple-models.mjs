// npm install --prefix <tools-directory> @gltf-transform/core@4.2.1 @gltf-transform/extensions@4.2.1 @gltf-transform/functions@4.2.1 meshoptimizer@0.22.0 sharp@0.34.3
// node tools/prepare-temple-models.mjs <tools-directory>
// Always writes derivatives; source GLBs are never modified.
import { createRequire } from 'node:module';
import { resolve, basename } from 'node:path';
import { mkdir, stat, writeFile, readFile } from 'node:fs/promises';
import { deities } from '../temple-space-data.js';
import { repairTempleSkin } from './repair-temple-skin.mjs';
const require = createRequire(resolve(process.argv[2] || '.', 'package.json'));
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const { dedup, weld, simplify, prune, textureCompress, getBounds } = require('@gltf-transform/functions');
const { MeshoptSimplifier } = require('meshoptimizer');
const sharp = require('sharp');
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const props = [['六角宫灯','lantern'],['垂挂绣幡','banner'],['主坛帷幔','curtain'],['雕花底座','plinth'],['木雕花格屏','lattice']];
const jobs = [
  ...deities.map(d => ({ source:d.name === '七爷' ? 'assets/实时渲染模型/七爷动作.glb' : d.model, output:`assets/temple-models/${basename(d.model)}`, target:60000, texture:1024 })),
  ...props.map(([name,id]) => ({ source:`assets/temple-props/source/${name}.glb`, output:`assets/temple-props/${id}.glb`, target:18000, texture:1024 }))
];
await mkdir('assets/temple-models', { recursive:true });
const only = process.argv[3];
const manifest = only ? JSON.parse(await readFile('assets/temple-models/manifest.json','utf8')).filter(e => !e.output.includes(only)) : [];
for (const job of jobs) {
  if (only && !job.output.includes(only)) continue;
  const doc = await io.read(job.source);
  const skinRepair = repairTempleSkin(doc,basename(job.output,'.glb'));
  const triangles = () => doc.getRoot().listMeshes().reduce((n,m) => n+m.listPrimitives().reduce((s,p)=>s+(p.getIndices()?.getCount() || p.getAttribute('POSITION').getCount())/3,0),0);
  const before = triangles();
  await doc.transform(dedup(), weld(), simplify({simplifier:MeshoptSimplifier,ratio:Math.min(1,job.target/before),error:.005}), prune(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[job.texture,job.texture],quality:84}));
  await io.write(job.output,doc);
  const entry = { ...job, skinRepair, inputBytes:(await stat(job.source)).size, outputBytes:(await stat(job.output)).size, inputTriangles:before, outputTriangles:triangles(), skins:doc.getRoot().listSkins().length, bounds:getBounds(doc.getRoot().listScenes()[0]) };
  manifest.push(entry); console.log(JSON.stringify(entry));
}
await writeFile('assets/temple-models/manifest.json',JSON.stringify(manifest,null,2)+'\n');
