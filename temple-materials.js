import * as THREE from 'three';

// Local CC0 scans: color is sRGB, surface data remains linear.
export function templeMaterial(id, repeat, color, strength=.5) {
  const loader=new THREE.TextureLoader();
  const texture=(suffix,srgb=false)=>{
    const t=loader.load(`assets/temple-textures/${id}-${suffix}.jpg`);
    t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.repeat.set(...repeat);t.anisotropy=8;
    if(srgb)t.colorSpace=THREE.SRGBColorSpace;
    return t;
  };
  return new THREE.MeshStandardMaterial({color,map:texture('color',true),normalMap:texture('normal'),roughnessMap:texture('roughness'),roughness:.9,normalScale:new THREE.Vector2(strength,strength)});
}
