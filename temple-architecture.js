import * as THREE from 'three';
import { columnRows, hall, horizontalScale, aisleInset } from './temple-layout.js?v=20261009-plaque-1';
import { templeMaterial, agedTempleMaterial } from './temple-materials.js?v=20261009-plaque-1';

// Repeated timber work is instanced: a layered roof without hundreds of draw calls.
export function buildTempleArchitecture(scene) {
  const materials = {
    timber: agedTempleMaterial('timber'),
    vermilion: agedTempleMaterial('vermilion'),
    jade: agedTempleMaterial('jade'),
    gold: agedTempleMaterial('gold'),
    stone: templeMaterial('slate_floor_03', [1, 1], '#817765', .5),
    floor: templeMaterial('slate_floor_03', [8, 21], '#bdb5a2', .32),
    wall: templeMaterial('plastered_wall', [18, 3], '#675647', .65),
    ceiling: templeMaterial('dark_wood', [5, 12], '#a18969', .35)
  };
  const batches = new Map();
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 24);
  const bracket = new THREE.Shape();
  bracket.moveTo(-1, .17); bracket.lineTo(1, .17); bracket.lineTo(1, -.02);
  bracket.bezierCurveTo(.78, -.03, .75, -.28, .36, -.3);
  bracket.lineTo(-.36, -.3); bracket.bezierCurveTo(-.75, -.28, -.78, -.03, -1, -.02); bracket.closePath();
  const arm = new THREE.ExtrudeGeometry(bracket, { depth: .26, bevelEnabled: false });
  arm.translate(0, 0, -.13);
  function add(shape, material, x, y, z, w, h, d, yaw = 0) {
    const key = `${shape}/${material}`;
    if (!batches.has(key)) batches.set(key, []);
    const object = new THREE.Object3D(); object.position.set((Math.abs(x) <= 6.5 ? x * horizontalScale : Math.sign(x) * (Math.abs(x) * ((hall.columnX + aisleInset) / 6.5) - aisleInset)), y, z);
    object.scale.set(w, h, d); object.rotation.y = yaw; object.updateMatrix();
    batches.get(key).push(object.matrix.clone());
  }
  const b = (m,x,y,z,w,h,d) => add('box',m,x,y,z,w > 1.4 ? (x === 0 ? w * ((hall.columnX + aisleInset) / 6.5) - 2 * aisleInset : w * ((hall.columnX + aisleInset) / 6.5)) : w,h,d);
  b('floor',0,-.14,hall.center,24,.28,hall.length);
  for (const side of [-1,1]) {
    b('wall',side*12,5.7,hall.center,.4,11.4,hall.length);
    b('stone',side*11.75,.65,hall.center,.35,1.3,hall.length);
    // Lower side roofs sit below the raised central nave.
    b('ceiling',side*9.25,10.65,hall.center,5.5,.28,hall.length);
    b('jade',side*6.5,11.2,hall.center,.28,1.1,hall.length);
    for (const y of [10.65,11.65]) b('gold',side*6.35,y,hall.center,.09,.075,hall.length);
    b('timber',side*5.9,12.2,hall.center,.3,.48,hall.length);
  }
  b('wall',0,6.5,hall.back,24,13,.4);
  b('ceiling',0,13.1,hall.center,15,.3,hall.length);
  // Front wall completes the portal from the inside, including the raised roof.
  b('wall',0,10.55,12,24,5.5,.45);
  const muralMap = new THREE.TextureLoader().load('assets/temple-textures/taoist-mural-aged-v1.jpg');
  muralMap.colorSpace = THREE.SRGBColorSpace; muralMap.anisotropy = 8;
  const muralPlaster = templeMaterial('plastered_wall', [2, 2], '#e1d3b9', .23);
  muralPlaster.map.dispose(); muralPlaster.map = muralMap;
  muralPlaster.roughness = 1;
  const muralPlane = new THREE.PlaneGeometry(1, 1);
  // Mural panels are fixed to the wall, with real timber surrounds and a stone dado.
  for (let i = 0; i < columnRows.length - 1; i++) {
    const z = (columnRows[i] + columnRows[i + 1]) / 2;
    const width = columnRows[i] - columnRows[i + 1] - .7;
    for (const side of [-1, 1]) {
      const panel = new THREE.Mesh(muralPlane, muralPlaster);
      panel.position.set(side * (hall.wallX - .23), 5.9, z);
      panel.rotation.y = -side * Math.PI / 2; panel.scale.set(width, 8.7, 1); scene.add(panel);
      for (const edge of [-1, 1]) {
        b('timber',side*11.78,5.9,z+edge*(width/2+.1),.2,9.1,.2);
        b('gold',side*11.7,5.9,z+edge*(width/2+.01),.045,8.85,.04);
      }
      for (const y of [1.45,10.35]) {
        b('timber',side*11.78,y,z,.2,.22,width+.4);
        b('gold',side*11.7,y,z,.045,.035,width+.2);
      }
    }
  }
  for (const x of [-9.5,0,9.5]) {
    const panel = new THREE.Mesh(muralPlane,muralPlaster);
    panel.position.set(x,6,hall.back+.23); panel.scale.set(9.1,9.1,1); scene.add(panel);
    for(const edge of [-1,1]) {
      const frame = new THREE.Mesh(cube, materials.timber);
      frame.position.set(x+edge*4.65,6,hall.back+.35); frame.scale.set(.18,9.5,.2);scene.add(frame);
    }
  }
  for (const [bayIndex, z] of columnRows.entries()) {
    for (const side of [-1,1]) {
      const x=side*6.5;
      add('column','vermilion',x,4.85,z,.4,9.1,.4);
      add('column','stone',x,.22,z,.68,.44,.68);
      add('column','stone',x,.55,z,.53,.22,.53);
      add('column','gold',x,.72,z,.42,.08,.42);
      add('column','gold',x,8.95,z,.43,.12,.43);
      b('jade',x,9.3,z,1.05,.38,1.05);
      // Dou-gong: bearing blocks and crossing curved arms, stepping outward.
      for (let level=0;level<3;level++) {
        const y=9.55+level*.42, reach=.65+level*.31;
        for (const yaw of [0,Math.PI/2]) {
          add('arm',level%2?'vermilion':'jade',x,y,z,reach,1,1,yaw);
          add('arm','gold',x,y+.06,z,reach,.16,1.05,yaw);
        }
        for (const direction of [-1,1]) {
          b('timber',x+direction*reach*.77,y+.24,z,.3,.24,.4);
          b('timber',x,y+.24,z+direction*reach*.77,.4,.24,.3);
        }
      }
      b('jade',side*9.25,10.4,z,5.5,.4,.36);
      b('gold',side*9.25,10.22,z+.2,5.5,.045,.025);
    }
    // Three successively raised beams make the roof's depth legible from below.
    for (const [y,width] of [[10.9,16.7],[11.9,13.4],[12.8,10.4]]) {
      b('jade',0,y,z,width,.45,.5);
      for (const sign of [-1,1]) {
        b('gold',0,y-.15,z+sign*.26,width-.18,.045,.025);
        b('gold',0,y+.15,z+sign*.26,width-.18,.045,.025);
        for(let x=-width/2+.65;x<width/2;x+=1.05){
          b('gold',x,y,z+sign*.27,.12,.2,.03);
        }
      }
      if (y<12.8) for(const side of [-1,1]) b('vermilion',side*(width/2-1.7),y+.5,z,.3,.6,.35);
    }
    if (bayIndex === columnRows.length - 1) continue;
    const bayDepth = z - columnRows[bayIndex + 1];
    const bayCenter = (z + columnRows[bayIndex + 1]) / 2;
    // Recessed coffer panels with nested gilt frames and a central medallion.
    for(const x of [-4.9,0,4.9]) {
      b('jade',x,12.96,bayCenter,4.55,.12,bayDepth-.3);
      for(const inset of [0,.2,.45]) {
        const w=4.3-inset*2,d=bayDepth-.55-inset*2,y=12.85-inset*.25;
        for(const s of [-1,1]) {
          b('gold',x+s*w/2,y,bayCenter,.045,.045,d);
          b('gold',x,y,bayCenter+s*d/2,w,.045,.045);
        }
      }
      add('column','gold',x,12.72,bayCenter,.72,.06,.72);
      add('column','jade',x,12.67,bayCenter,.59,.05,.59);
      for(const dx of [-.9,.9]) for(const dz of [-bayDepth*.27,bayDepth*.27])
        add('column','gold',x+dx,12.78,bayCenter+dz,.12,.035,.12);
    }
  }
  for(let z=12;z>hall.back;z-=1.35) for(const side of [-1,1])
    b('timber',side*9.25,10.42,z,5.4,.16,.13);
  const geometry = {box:cube,column:cylinder,arm};
  for(const [key,matrices] of batches){
    const [shape,material]=key.split('/');
    const mesh=new THREE.InstancedMesh(geometry[shape],materials[material],matrices.length);
    matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
    mesh.instanceMatrix.needsUpdate=true; scene.add(mesh);
  }
}
