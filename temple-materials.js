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

const agedCache = new Map();
// Layer worn pigments over the local wood scan; deterministic marks do not flicker.
export function agedTempleMaterial(kind) {
  if (agedCache.has(kind)) return agedCache.get(kind);
  const palette = {
    timber: [79, 57, 36], vermilion: [128, 52, 35],
    jade: [54, 75, 61], gold: [151, 123, 70]
  };
  const base = palette[kind];
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d'); const pixels = ctx.createImageData(512, 512);
  let seed = 7319;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; };
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
    const grain = Math.sin(x * .29 + Math.sin(y * .014) * 2) * .06;
    const cloud = Math.sin(x * .035 + Math.sin(y * .025)) * Math.cos(y * .021) * .14;
    const light = .88 + grain + cloud + random() * .15;
    const at = (y * 512 + x) * 4;
    for (let c = 0; c < 3; c++) pixels.data[at + c] = base[c] * light;
    pixels.data[at + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  // Fine longitudinal checks and irregular patches of exposed timber.
  for (let i = 0; i < 160; i++) {
    const x = random() * 512, y = random() * 512, length = 8 + random() * 80;
    ctx.strokeStyle = `rgba(27,20,13,${.08 + random() * .18})`;
    ctx.lineWidth = .3 + random() * .8; ctx.beginPath(); ctx.moveTo(x,y);
    ctx.bezierCurveTo(x+2,y+length*.3,x-2,y+length*.7,x+1,y+length); ctx.stroke();
  }
  for (let i = 0; i < 450; i++) {
    const x = random() * 512, y = random() * 512;
    ctx.fillStyle = i % 3 ? 'rgba(49,34,20,.3)' : 'rgba(179,151,101,.28)';
    ctx.beginPath(); ctx.ellipse(x,y,.5+random()*3,1+random()*8,random()*.3,0,Math.PI*2);ctx.fill();
  }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.anisotropy = 8;
  const normal = new THREE.TextureLoader().load('assets/temple-textures/dark_wood-normal.jpg');
  normal.wrapS = normal.wrapT = THREE.RepeatWrapping; normal.anisotropy = 8;
  const roughness = new THREE.TextureLoader().load('assets/temple-textures/dark_wood-roughness.jpg');
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping;
  const scan = new Image();
  scan.onload = () => {
    ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = .55;
    ctx.drawImage(scan,0,0,512,512); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
    map.needsUpdate=true;
  };
  scan.src = 'assets/temple-textures/dark_wood-color.jpg';
  const material = new THREE.MeshStandardMaterial({ map, normalMap: normal, roughnessMap: roughness,
    normalScale: new THREE.Vector2(.32,.32), roughness: kind === 'gold' ? .76 : .95,
    metalness: kind === 'gold' ? .48 : 0 });
  agedCache.set(kind,material); return material;
}
