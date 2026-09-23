// Verifies local/world bone-axis conversion against actual exported skeletons.
// node tools/check-temple-poses.mjs <tools-directory>
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as THREE from '../assets/vendor/three/three.module.js';
const require = createRequire(resolve(process.argv[2] || '.', 'package.json'));
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const source = (await readFile('temple-pose.js','utf8')).replace("from 'three'", `from '${pathToFileURL(resolve('assets/vendor/three/three.module.js'))}'`);
const { applyRelaxedPose, poseProfiles } = await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
for(const name of ['哪吒','华光大世子'])assert.deepEqual(poseProfiles[name],[.26,.12,.13]);
const manifest = JSON.parse(await readFile('assets/temple-models/manifest.json','utf8'));
let count = 0;
for (const entry of manifest.filter(e => e.skins)) {
  const doc = await io.read(entry.output);
  const jointNodes = new Set(doc.getRoot().listSkins().flatMap(s=>s.listJoints()));
  const objects = new Map(doc.getRoot().listNodes().map(n => {
    const o = jointNodes.has(n) ? new THREE.Bone() : new THREE.Group();
    o.name = n.getName(); o.position.fromArray(n.getTranslation()); o.quaternion.fromArray(n.getRotation()); o.scale.fromArray(n.getScale());
    return [n,o];
  }));
  for (const [n,o] of objects) n.listChildren().forEach(child=>o.add(objects.get(child)));
  const root = new THREE.Group(); doc.getRoot().listScenes()[0].listChildren().forEach(n=>root.add(objects.get(n)));
  for (const skin of doc.getRoot().listSkins()) {
    const data = skin.getInverseBindMatrices().getArray();
    const joints = skin.listJoints();
    const skeleton = new THREE.Skeleton(joints.map(n=>objects.get(n)), joints.map((n,i)=>new THREE.Matrix4().fromArray(data,i*16)));
    skeleton.pose();
    // Only geometry-bound recomputation is stubbed; the real skeleton and all
    // hierarchy transforms are tested using the production posing function.
    const probe = new THREE.Object3D(); probe.isSkinnedMesh = true; probe.skeleton=skeleton;
    probe.computeBoundingBox=()=>{};probe.computeBoundingSphere=()=>{};root.add(probe);
  }
  root.updateMatrixWorld(true);
  const measure = () => {
    const result = {};
    for (const p of ['L','R']) {
      const a = root.getObjectByName(p+'_Upperarm').getWorldPosition(new THREE.Vector3());
      const b = root.getObjectByName(p+'_Forearm').getWorldPosition(new THREE.Vector3());
      const c = root.getObjectByName(p+'_Hand').getWorldPosition(new THREE.Vector3());
      result[p] = {upper:a.distanceTo(b),lower:b.distanceTo(c),upperDirection:b.clone().sub(a).normalize(),lowerDirection:c.clone().sub(b).normalize()};
    }
    return result;
  };
  const before=measure();
  const name=entry.output.split('/').pop().replace('.glb','');
  assert.equal(applyRelaxedPose(root,name).adjusted,true,entry.output);
  const after=measure();
  if(entry.skinRepair?.repaired) {
    const skin=doc.getRoot().listSkins()[0],js=skin.listJoints(),ib=skin.getInverseBindMatrices().getArray();
    const prim=doc.getRoot().listMeshes()[0].listPrimitives()[0];
    const ps=prim.getAttribute('POSITION'),ws=prim.getAttribute('WEIGHTS_0'),is=prim.getAttribute('JOINTS_0');
    if(name==='小太子') {
      const shoulder=js.findIndex(j=>j.getName()==='L_Upperarm');
      const shoulderY=new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().fromArray(ib,shoulder*16).invert()).y;
      for(let i=0;i<ps.getCount();i++) {
        if(ps.getElement(i,[])[1] >= shoulderY-.115)continue;
        const weights=ws.getElement(i,[]),indices=is.getElement(i,[]);
        assert.ok(weights.every((w,k)=>w<.00001 || js[indices[k]].getName()==='BoneRoot'),'Child waist/skirt must not follow arm bones');
      }
    }
    let checked=0;
    for(let i=0;i<ps.getCount();i++) {
      const p=ps.getElement(i,[]);if(p[0]<.25)continue;
      const w=ws.getElement(i,[]),idx=is.getElement(i,[]),out=new THREE.Vector3();
      for(let k=0;k<4;k++)out.addScaledVector(new THREE.Vector3(...p).applyMatrix4(new THREE.Matrix4().fromArray(ib,idx[k]*16)).applyMatrix4(objects.get(js[idx[k]]).matrixWorld),w[k]);
      if(w[0]>.01)continue;
      assert.ok(out.y < p[1]-.08,entry.output+' sleeve vertex must move down');
      checked++;
    }
    assert.ok(checked>10,entry.output+' checks actual weighted sleeve vertices');
  }
  for (const p of ['L','R']) {
    assert.ok(Math.abs(before[p].upper-after[p].upper)<.00001,'Upper arm length preserved');
    assert.ok(Math.abs(before[p].lower-after[p].lower)<.00001,'Forearm length preserved');
    assert.ok(after[p].upperDirection.y < -.80,'Upper arm hangs down with robe clearance');
    assert.ok(after[p].lowerDirection.y < -.72,'Forearm hangs down with robe clearance');
  }
  console.log('PASS',entry.output); count++;
}
assert.equal(count,12);
assert.equal(applyRelaxedPose(new THREE.Group()).reason,'static-mesh');
console.log(`${count} skeletons verified; static meshes preserved.`);
