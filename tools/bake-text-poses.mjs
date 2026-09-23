// Bake the same front-facing relaxed pose used by the 3D hall into GLBs for
// model-viewer, which cannot adjust an imported skeleton at runtime.
import { createRequire } from 'node:module';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as THREE from '../assets/vendor/three/three.module.js';
import { repairTempleSkin } from './repair-temple-skin.mjs';

const require = createRequire(resolve(process.argv[2], 'package.json'));
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const poseSource = (await readFile('temple-pose.js','utf8')).replace("from 'three'", `from '${pathToFileURL(resolve('assets/vendor/three/three.module.js'))}'`);
const { applyRelaxedPose } = await import('data:text/javascript;base64,' + Buffer.from(poseSource).toString('base64'));
const names = ['孩儿弟','文状元','八爷','马元帅','温元帅','康元帅','七爷','华光大世子','长郡主','金龙太子','哪吒','小太子'];
await mkdir('assets/temple-text-models',{recursive:true});

for (const name of names) {
  const source = name === '七爷' ? 'assets/实时渲染模型/七爷动作.glb' : `assets/神殿模型/${name}.glb`;
  const doc = await io.read(source);
  repairTempleSkin(doc,name);
  const joints = new Set(doc.getRoot().listSkins().flatMap(s => s.listJoints()));
  const objects = new Map(doc.getRoot().listNodes().map(n => {
    const o = joints.has(n) ? new THREE.Bone() : new THREE.Group();
    o.name=n.getName();o.position.fromArray(n.getTranslation());o.quaternion.fromArray(n.getRotation());o.scale.fromArray(n.getScale());
    return [n,o];
  }));
  for (const [n,o] of objects) n.listChildren().forEach(c => o.add(objects.get(c)));
  const root = new THREE.Group(); doc.getRoot().listScenes()[0].listChildren().forEach(n => root.add(objects.get(n)));
  for (const skin of doc.getRoot().listSkins()) {
    const data=skin.getInverseBindMatrices().getArray(), js=skin.listJoints();
    const skeleton=new THREE.Skeleton(js.map(n=>objects.get(n)),js.map((n,i)=>new THREE.Matrix4().fromArray(data,i*16)));
    const probe=new THREE.Object3D();probe.isSkinnedMesh=true;probe.skeleton=skeleton;probe.computeBoundingBox=()=>{};probe.computeBoundingSphere=()=>{};root.add(probe);
  }
  root.updateMatrixWorld(true); applyRelaxedPose(root,name);
  for (const [node,obj] of objects) if (joints.has(node)) node.setRotation(obj.quaternion.toArray());
  await io.write(`assets/temple-text-models/${name}.glb`,doc);
  console.log('Baked text pose',name);
}
