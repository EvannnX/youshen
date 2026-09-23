import * as THREE from '../assets/vendor/three/three.module.js';

const smooth = (a,b,x) => { const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t); };

// Repair only the five malformed Tripo exports: almost all vertices were bound
// to BoneRoot, while bind matrices ran along Z and geometry ran along X.
// Valid skins are left unchanged. Originals remain in assets/神殿模型.
export function repairTempleSkin(document, name='') {
  const skin = document.getRoot().listSkins()[0];
  if (!skin) return { repaired:false };
  const joints = skin.listJoints(), ids=new Map(joints.map((j,i)=>[j.getName(),i]));
  const rootId=ids.get('BoneRoot');
  if(rootId===undefined || !ids.has('L_Upperarm'))return {repaired:false};
  const meshNodes=document.getRoot().listNodes().filter(n=>n.getSkin()===skin && n.getMesh());
  let total=0,rootOnly=0;
  for(const n of meshNodes)for(const p of n.getMesh().listPrimitives()) {
    const j=p.getAttribute('JOINTS_0').getArray(),w=p.getAttribute('WEIGHTS_0').getArray();
    for(let i=0;i<j.length;i+=4){total++;if([0,1,2,3].some(k=>j[i+k]===rootId && w[i+k]>.9))rootOnly++;}
  }
  if(rootOnly/total<.9)return {repaired:false};
  const inverse=skin.getInverseBindMatrices().getArray();
  const rotation=new THREE.Matrix4().makeRotationY(-Math.PI/2);
  const world=joints.map((j,i)=>new THREE.Matrix4().fromArray(inverse,i*16).invert().premultiply(rotation));
  // The malformed exports also contain non-rigid joint bases. Rebuild an
  // orthonormal rest frame at each recovered joint position for this display rig.
  world.forEach(m=>{const p=new THREE.Vector3().setFromMatrixPosition(m);m.makeTranslation(p.x,p.y,p.z);});
  // Rebuild local joint transforms from aligned bind matrices.
  const parents=new Map();document.getRoot().listNodes().forEach(n=>n.listChildren().forEach(c=>parents.set(c,n)));
  // Collapse non-joint intermediary nodes so skeleton.pose() does not treat
  // a world-space bind transform as local below an unrecognized parent.
  joints.forEach(joint=>{
    const immediate=parents.get(joint);let ancestor=immediate;
    while(ancestor && !joints.includes(ancestor))ancestor=parents.get(ancestor);
    if(ancestor && ancestor!==immediate){immediate.removeChild(joint);ancestor.addChild(joint);parents.set(joint,ancestor);}
  });
  joints.forEach((joint,i)=>{
    const parentIndex=joints.indexOf(parents.get(joint));
    const local=world[i].clone();if(parentIndex>=0)local.premultiply(world[parentIndex].clone().invert());
    const p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();local.decompose(p,q,s);
    joint.setTranslation(p.toArray()).setRotation(q.toArray()).setScale(s.toArray());
  });
  const alignedInverse=new Float32Array(inverse.length);
  world.forEach((m,i)=>m.clone().invert().toArray(alignedInverse,i*16));
  skin.getInverseBindMatrices().setArray(alignedInverse);
  const arms=['L','R'].map(side=>{
    const upper=ids.get(side+'_Upperarm'),lower=ids.get(side+'_Forearm'),hand=ids.get(side+'_Hand');
    const a=new THREE.Vector3().setFromMatrixPosition(world[upper]),b=new THREE.Vector3().setFromMatrixPosition(world[lower]),c=new THREE.Vector3().setFromMatrixPosition(world[hand]);
    return {upper,lower,hand,a,b,c,sign:Math.sign(a.x),axis:c.clone().sub(a).normalize()};
  });
  let repairedVertices=0;
  for(const node of meshNodes)for(const primitive of node.getMesh().listPrimitives()) {
    const positions=primitive.getAttribute('POSITION').getArray();
    const weights=primitive.getAttribute('WEIGHTS_0'),indices=primitive.getAttribute('JOINTS_0');
    const newWeights=new Float32Array(weights.getCount()*4),newIndices=new Uint16Array(indices.getCount()*4);
    for(let i=0;i<weights.getCount();i++) {
      const v=new THREE.Vector3().fromArray(positions,i*3);
      const arm=arms.find(a=>a.sign*v.x>=0) || arms[0];
      const sideX=arm.sign*v.x;
      // Include the full sleeve depth, not just the narrow anatomical arm.
      // A narrow radial mask leaves cloth vertices behind and stretches faces.
      const child = name === '小太子';
      // The short torso puts the waist inside the adult sleeve mask.
      // Keep the skirt rigid and limit arm influence to the sleeve band.
      const amount=smooth(Math.abs(arm.a.x)-.015,Math.abs(arm.a.x)+.065,sideX)*smooth(arm.a.y-(child ? .115 : .24),arm.a.y-(child ? .075 : .16),v.y)*(1-smooth(arm.a.y+.10,arm.a.y+.18,v.y));
      const elbow=smooth(Math.abs(arm.b.x)-.035,Math.abs(arm.b.x)+.035,sideX);
      const wrist=smooth(Math.abs(arm.c.x)-.02,Math.abs(arm.c.x)+.025,sideX);
      newIndices.set([rootId,arm.upper,arm.lower,arm.hand],i*4);
      newWeights.set([1-amount,amount*(1-elbow),amount*elbow*(1-wrist),amount*elbow*wrist],i*4);
      if(amount>.1)repairedVertices++;
    }
    indices.setArray(newIndices).setNormalized(false);weights.setArray(newWeights).setNormalized(false);
  }
  return { repaired:true, rootOnlyFraction:rootOnly/total, repairedVertices };
}
