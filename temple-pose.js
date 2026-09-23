import * as THREE from 'three';

// Aim bones in world space, then convert back into each parent's local axes.
// ActorCore rigs do not share a simple local Euler axis across left and right arms.
function aim(bone, end, target) {
  if (!bone || !end) return false;
  bone.updateWorldMatrix(true, true);
  const direction = end.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).normalize();
  if (direction.lengthSq() < .5) return false;
  const world = bone.getWorldQuaternion(new THREE.Quaternion());
  const delta = new THREE.Quaternion().setFromUnitVectors(direction, target.clone().normalize());
  const parent = bone.parent.getWorldQuaternion(new THREE.Quaternion());
  bone.quaternion.copy(parent.invert().multiply(delta.multiply(world)));
  bone.updateWorldMatrix(true, true);
  return true;
}

export const poseProfiles = {
  '哪吒': [.26,.12,.13], '华光大世子': [.26,.12,.13],
  '金龙太子': [.43,.42,.18], '长郡主': [.43,.42,.18],
  '孩儿弟': [.5,.5,.18], '小太子': [.5,.5,.18],
  '七爷': [.43,.42,.18], '八爷': [.46,.46,.18],
  '文状元': [.46,.46,.18], '马元帅': [.44,.42,.2],
  '温元帅': [.44,.42,.2], '康元帅': [.44,.42,.2]
};

export function applyRelaxedPose(root, name='') {
  // Some Tripo exports store identity transforms on every joint and keep the
  // actual rest positions only in inverse bind matrices. Recover those first.
  const skeletons = new Set();
  root.traverse(o => { if (o.isSkinnedMesh) skeletons.add(o.skeleton); });
  skeletons.forEach(skeleton => skeleton.pose());
  const bones = new Map();
  root.traverse(o => { if (o.isBone) bones.set(o.name.toLowerCase().replace(/[^a-z0-9]/g,''),o); });
  if (!bones.size) return { adjusted:false, reason:'static-mesh' };
  root.updateMatrixWorld(true);
  let arms = 0;
  const [spread,forearmSpread,forward] = poseProfiles[name] || [.55,.65,.18];
  for (const [prefix, sign] of [['l',1],['r',-1]]) {
    const upper = bones.get(prefix+'upperarm');
    const lower = bones.get(prefix+'forearm');
    const hand = bones.get(prefix+'hand');
    if (!upper || !lower || !hand) continue;
    // Character-specific outward clearance for flared robes and armored skirts.
    // Nezha and Huaguang retain the previously approved angles.
    const upperTarget = new THREE.Vector3(sign*spread,-1,.035);
    const lowerTarget = new THREE.Vector3(sign*forearmSpread,-1,forward);
    if (aim(upper,lower,upperTarget) && aim(lower,hand,lowerTarget)) arms++;
  }
  root.updateMatrixWorld(true);
  root.traverse(o => {
    if (o.isSkinnedMesh) {
      o.skeleton.update();
      o.computeBoundingBox();
      o.computeBoundingSphere();
    }
  });
  return { adjusted:arms === 2, arms, reason:arms === 2 ? 'relaxed' : 'unsupported-rig' };
}
