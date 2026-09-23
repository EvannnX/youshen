import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { deities } from './temple-space-data.js';
import { templeProps } from './temple-props.js';
import { applyRelaxedPose } from './temple-pose.js?v=20260923-clearance-3';
import { templeMaterial } from './temple-materials.js';

const $ = id => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#19130f');
scene.fog = new THREE.FogExp2('#21140e', 0.017);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.08, 110);
camera.position.set(0, 2.5, 10);
camera.rotation.order = 'YXZ';
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
$('scene').appendChild(renderer.domElement);
renderer.domElement.tabIndex = 0;
renderer.domElement.setAttribute('aria-label', '三维神殿，拖动环顾，方向键行走');
const hemi = new THREE.HemisphereLight('#ffddad', '#32313e', 2.3);
scene.add(hemi);
const sunlight = new THREE.DirectionalLight('#ffd6a0', 3.2);
sunlight.position.set(1, 7, 8);
scene.add(sunlight);
const fill = new THREE.DirectionalLight('#9dafcf', 1.2);
fill.position.set(-6, 3, -25);
scene.add(fill);

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .65, ...extra });
const wood = mat('#21130d');
const red = mat('#631d14', { roughness: .38 });
const gold = mat('#af7840', { metalness: .48, roughness: .4 });
const stone = mat('#3f3731');
const black = mat('#100d0b');
const glow = new THREE.MeshBasicMaterial({ color: '#ed734b' });
const cube = new THREE.BoxGeometry(1, 1, 1);
function box(parent, x, y, z, w, h, d, material) {
  const m = new THREE.Mesh(cube, material);
  m.position.set(x, y, z); m.scale.set(w, h, d); parent.add(m); return m;
}
function cylinder(parent, x, y, z, radius, height, material, sides = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, sides), material);
  m.position.set(x, y, z); parent.add(m); return m;
}
function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
box(scene, 0, -.12, -18, 17, .24, 63, templeMaterial('slate_floor_03',[5.7,21],'#aaa79f',.65));
const plaster=templeMaterial('plastered_wall',[21,2.7],'#777168',.55);
box(scene, -8.2, 4, -18, .4, 8, 63, plaster);
box(scene, 8.2, 4, -18, .4, 8, 63, plaster);
box(scene, 0, 8, -18, 17, .3, 63, templeMaterial('dark_wood',[8.5,15.75],'#b99b7c',.55));
box(scene, 0, 3.8, -48, 17, 8, .35, templeMaterial('plastered_wall',[5.7,2.7],'#873a2a',.45));
box(scene, 0, .015, -17, .035, .022, 57, glow);
for (let z = 9; z > -46; z -= 5.4) {
  for (const side of [-1, 1]) {
    cylinder(scene, side * 5.65, 3.8, z, .23, 7.6, red);
    cylinder(scene, side * 5.65, .24, z, .37, .48, stone);
    cylinder(scene, side * 5.65, .51, z, .25, .065, gold);
    box(scene, side * 5.65, 6.85, z, 1.45, .23, .7, gold);
    box(scene, side * 5.65, 7.15, z, 2.25, .27, .8, wood);
  }
  box(scene, 0, 7.6, z, 16, .4, .32, red);
  box(scene, 0, 7.37, z, 11.2, .08, .38, gold);
}
for (const x of [-4, -2, 0, 2, 4]) box(scene, x, 7.9, -18, .16, .2, 61, wood);

const loader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath('assets/vendor/three/draco/');
loader.setDRACOLoader(draco);
const propInstances = new Map();
function prop(type, x, y, z, yaw = 0) {
  const root = new THREE.Group(); root.position.set(x, y, z); root.rotation.y = yaw;
  scene.add(root);
  const placeholder = new THREE.Group(); root.add(placeholder);
  if (!propInstances.has(type)) propInstances.set(type, []);
  propInstances.get(type).push({ root, placeholder });
  if (type === 'lantern') {
    cylinder(placeholder, 0, .68, 0, .34, .76, mat('#ba4020', { emissive: '#e84a17', emissiveIntensity: .8 }), 6);
    for (const y of [.27, 1.08]) cylinder(placeholder, 0, y, 0, .42, .09, wood, 6);
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      box(placeholder, Math.sin(a) * .345, .68, Math.cos(a) * .345, .035, .82, .035, gold);
    }
    cylinder(placeholder, 0, .12, 0, .024, .25, gold);
    cylinder(placeholder, 0, 1.23, 0, .018, .26, gold);
  } else if (type === 'banner') {
    const bannerTexture = canvasTexture(256, 768, (c, w, h) => {
      c.fillStyle = '#60160e'; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#c99a4d'; c.lineWidth = 8; c.strokeRect(18, 15, w - 36, h - 30);
      c.lineWidth = 3;
      for (let j = 0; j < 7; j++) {
        c.beginPath(); c.ellipse(128, 88 + j * 97, 58, 34, j % 2 ? .45 : -.45, 0, Math.PI * 2); c.stroke();
      }
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(.95, 3, 10, 25), mat('#ffffff', { map: bannerTexture, side: THREE.DoubleSide }));
    const p = mesh.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 19) * .045);
    mesh.geometry.computeVertexNormals(); mesh.position.y = 1.6; placeholder.add(mesh);
    box(placeholder, 0, 3.13, 0, 1.1, .07, .07, gold);
    for (let i = 0; i < 12; i++) box(placeholder, -.45 + i * .082, .05, 0, .02, .2, .02, gold);
  } else if (type === 'curtain') {
    for (const side of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 3.3, 24, 16), mat('#84221b', { side: THREE.DoubleSide }));
      const p = m.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        p.setZ(i, .12 * Math.sin(p.getX(i) * 16));
        p.setX(i, p.getX(i) + side * .35 * Math.sin((p.getY(i) / 3.3 + .5) * Math.PI));
      }
      m.geometry.computeVertexNormals(); m.position.set(side * 4.4, 1.65, 0); placeholder.add(m);
      box(placeholder, side * 4.5, 1.5, .12, 1.05, .1, .12, gold);
    }
    box(placeholder, 0, 3.25, 0, 8.7, .32, .13, red);
  } else if (type === 'plinth') {
    box(placeholder, 0, .08, 0, 2.8, .16, 2.1, stone);
    box(placeholder, 0, .35, 0, 2.6, .4, 1.9, wood);
    box(placeholder, 0, .64, 0, 2.85, .13, 2.15, black);
    for (const y of [.2, .52]) box(placeholder, 0, y, 1, 2.65, .035, .025, gold);
    for (let x = -1; x <= 1; x += .4) {
      const ornament = box(placeholder, x, .37, 1, .17, .17, .035, gold); ornament.rotation.z = Math.PI / 4;
    }
  } else if (type === 'lattice') {
    box(placeholder, 0, 1.9, -.08, 2.65, 3.8, .12, black);
    for (let x = -1.25; x <= 1.3; x += .42) box(placeholder, x, 1.9, 0, .045, 3.8, .06, gold);
    for (let y = 0; y < 3.9; y += .42) box(placeholder, 0, y, 0, 2.65, .045, .06, wood);
    for (const x of [-1.4, 1.4]) box(placeholder, x, 1.9, 0, .12, 4, .16, red);
  }
  return root;
}
for (let z = 7; z > -44; z -= 10.8) {
  for (const side of [-1, 1]) {
    prop('lantern', side * 4.75, 5.15, z);
    // Ceiling cross rail and suspension rod connect the lantern to the frame.
    box(scene, side * 4.75, 7.65, z, .14, .18, 5.4, wood);
    cylinder(scene, side * 4.75, 7.025, z, .022, 1.25, gold);
    // Lower fixtures hang from a freestanding post, not from empty space.
    prop('lantern', side * 5.05, .55, z - 3);
    cylinder(scene, side * 5.48, .12, z - 3, .3, .24, stone);
    cylinder(scene, side * 5.48, 1.15, z - 3, .055, 2.1, wood);
    box(scene, side * 5.265, 2.17, z - 3, .56, .09, .09, gold);
    cylinder(scene, side * 5.05, 2, z - 3, .018, .34, gold);
    prop('banner', side * 4.6, 3.7, z - 2.3);
    // Two short drops suspend the embroidered banner's top rod.
    box(scene, side * 4.6, 7.65, z - 2.3, 1.35, .16, .16, wood);
    for(const dx of [-.36,.36])cylinder(scene, side * 4.6+dx, 7.26, z - 2.3, .016, .8, gold);
  }
}

const raycaster = new THREE.Raycaster();
const clickTargets = [];
const stations = [];
const textureLoader = new THREE.TextureLoader();
const pictureTextures = [];
function label(text, width = 2.4, height = .42) {
  const texture = canvasTexture(768, 128, (c, w, h) => {
    c.font = '52px "Songti SC", serif'; c.fillStyle = '#ecd1a4'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, w / 2, h / 2);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent:true, depthWrite:false }));
}
deities.forEach((d, index) => {
  const isAltar = index === deities.length - 1;
  const side = index % 2 === 0 ? -1 : 1;
  const z = isAltar ? -45 : 5 - Math.floor(index / 2) * 5.2;
  const x = isAltar ? 0 : side * 6.65;
  const root = new THREE.Group(); root.position.set(x, 0, z);
  root.rotation.y = isAltar ? 0 : -side * Math.PI / 2;
  scene.add(root);
  if (isAltar) {
    box(scene, 0, .16, -45, 11, .32, 5, stone);
    box(scene, 0, .48, -45.4, 9.8, .32, 4.2, stone);
    box(scene, 0, .89, -45.7, 8.8, .5, 3.4, wood);
    box(scene, 0, 1.16, -45.7, 9, .08, 3.55, gold);
    for (const sx of [-4.9, 4.9]) cylinder(scene, sx, 3.9, -45, .2, 7.1, red);
    for (let j = 0; j < 5; j++) box(scene, 0, 6.1 + j * .2, -45.5, 12 - j * .7, .2, 4 - j * .4, j === 0 ? gold : wood);
    prop('curtain', 0, 2.85, -46.6);
    // Curtain rail carried by two posts and tied into the altar canopy.
    box(scene, 0, 6.2, -46.6, 10.7, .16, .18, wood);
    for(const sx of [-5.2,5.2]) {
      cylinder(scene, sx, 3.12, -46.6, .09, 6.24, wood);
      box(scene, sx, 6.24, -46, .14, .18, 1.4, gold);
    }
  } else {
    prop('plinth', x, 0, z, root.rotation.y);
    prop('lattice', x + side * 1.05, .8, z, root.rotation.y);
  }
  const picture = new THREE.Mesh(new THREE.PlaneGeometry(isAltar ? 7 : 2.35, isAltar ? 3.7 : 3.4), new THREE.MeshBasicMaterial({ color: '#56412d', side: THREE.DoubleSide }));
  picture.position.set(0, isAltar ? 3.2 : 2.5, .12); root.add(picture);
  textureLoader.load(d.image, t => {
    t.colorSpace = THREE.SRGBColorSpace; picture.material.map = t; picture.material.color.set('#ffffff');
    picture.material.needsUpdate = true; pictureTextures.push(t);
    const aspect = t.image.width / t.image.height;
    picture.scale.x = Math.min(1, (isAltar ? 3.7 : 3.4) * aspect / (isAltar ? 7 : 2.35));
  }, undefined, () => {});
  const plaque = label(d.name, isAltar ? 3.4 : 2.4);
  plaque.position.set(0, isAltar ? .94 : .46, isAltar ? 2.3 : 1.1); root.add(plaque);
  picture.userData.index = plaque.userData.index = index;
  clickTargets.push(picture, plaque);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.2, .23, 40), glow);
  ring.rotation.x = -Math.PI / 2; ring.position.set(isAltar ? 0 : side * 3.5, .025, isAltar ? -39 : z);
  ring.userData.index = index; scene.add(ring); clickTargets.push(ring);
  stations.push({ root, picture, index, data: d, isAltar, state: 'idle', model: null, lastUsed: 0, target: new THREE.Vector3(isAltar ? 0 : side * 1.1, isAltar ? 2.7 : 2.5, isAltar ? -36 : z + .5) });
});
// A deliberately small number of lights keeps the prototype usable on laptops.
for (const z of [3, -14, -30, -44]) {
  const light = new THREE.PointLight('#ffbb78', 38, 16, 2); light.position.set(0, 5.1, z); scene.add(light);
}

function fit(root, maxHeight, maxWidth, maxDepth, ground) {
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  const scale = Math.min(maxHeight / Math.max(size.y, .001), maxWidth / Math.max(size.x, .001), maxDepth / Math.max(size.z, .001));
  root.scale.multiplyScalar(scale);
  const fitted = new THREE.Box3().setFromObject(root), center = fitted.getCenter(new THREE.Vector3());
  root.position.sub(new THREE.Vector3(center.x, fitted.min.y - ground, center.z));
}
function disposeModel(root) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  root.traverse(o => {
    if (o.geometry) geometries.add(o.geometry);
    for (const m of (Array.isArray(o.material) ? o.material : [o.material]).filter(Boolean)) {
      materials.add(m); Object.values(m).forEach(v => { if (v?.isTexture) textures.add(v); });
    }
  });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
  textures.forEach(t => { t.dispose(); t.source?.data?.close?.(); });
}
let selected = -1, loading = false, rotationEnabled = false, active = false;
let desired = null, yaw = 0, pitch = -.04;
const keys = new Set();
const queue = new Set();
function updateStatus() {
  const s = stations[selected];
  const readyCount = stations.filter(station => station.state === 'ready').length;
  const errorCount = stations.filter(station => station.state === 'error').length;
  $('roomStatus').textContent = readyCount === stations.length ? `${readyCount} 尊神像已入殿` : `神像入殿 ${readyCount} / ${stations.length}${errorCount ? '，部分加载失败可点选重试' : ''}`;
  if (!s) return;
  const states = { idle: '已显示参考图，等待载入', loading: '正在载入三维神像…', ready: '三维神像已就位', error: '模型未能载入，当前显示参考图' };
  $('modelStatus').textContent = states[s.state];
  $('retry').hidden = s.state !== 'error';
  $('rotate').disabled = s.state !== 'ready';
}
function requestModel(index) {
  const s = stations[index]; if (!s) return;
  s.lastUsed = performance.now();
  if (s.state === 'idle') { queue.add(index); pump(); }
}
async function pump() {
  if (loading || !queue.size) return;
  const index = queue.has(selected) ? selected : queue.values().next().value;
  queue.delete(index); const s = stations[index];
  if (s.state !== 'idle') { pump(); return; }
  loading = true; s.state = 'loading'; updateStatus();
  try {
    const repaired = ['华光大世子','金龙太子','长郡主','哪吒','小太子'];
    const displayPath = repaired.includes(s.data.name)
      ? `assets/temple-fullres/${s.data.name}.glb`
      : s.data.name === '七爷' ? 'assets/实时渲染模型/七爷动作.glb' : s.data.model;
    const gltf = await loader.loadAsync(displayPath);
    const model = gltf.scene;
    // The original five scans face -X; current Tripo humanoid exports face +Z.
    const scans = ['保长公', '马夫', '赵世子', '张大世子', '张二世子', '七爷'];
    model.rotation.y = s.data.rotationY ?? (scans.includes(s.data.name) ? -Math.PI / 2 : 0);
    s.pose = applyRelaxedPose(model,s.data.name);
    const child = ['孩儿弟','小太子'].includes(s.data.name);
    fit(model, s.isAltar ? 4.2 : child ? 3.8*2/3 : 3.8, s.isAltar ? 8 : child ? Infinity : 3.15, s.isAltar ? 3.5 : child ? Infinity : 2.5, s.isAltar ? 1.2 : .72);
    const pivot = new THREE.Group(); pivot.add(model); s.root.add(pivot); s.model = pivot;
    pivot.traverse(o => { if (o.isMesh) { o.userData.index = index; clickTargets.push(o); } });
    s.picture.visible = false; s.state = 'ready'; s.lastUsed = performance.now();
  } catch (error) { console.error('Deity model failed:', s.data.name, error); s.state = 'error'; }
  loading = false; updateStatus(); pump();
}
async function replaceProps() {
  for (const [type, config] of Object.entries(templeProps)) {
    if (!config.model) continue;
    try {
      const originals = {lantern:'六角宫灯',banner:'垂挂绣幡',curtain:'主坛帷幔',plinth:'雕花底座',lattice:'木雕花格屏'};
      const gltf = await loader.loadAsync(`assets/temple-props/source/${originals[type]}.glb`);
      gltf.scene.rotation.y = config.rotationY || 0;
      fit(gltf.scene, config.height, Infinity, Infinity, 0);
      // Architectural fittings have fixed openings and top elevations.
      // Match their width/depth independently to the existing bays.
      const size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
      if (config.width) gltf.scene.scale.x *= config.width / size.x;
      if (config.depth) gltf.scene.scale.z *= config.depth / size.z;
      const aligned = new THREE.Box3().setFromObject(gltf.scene);
      const center = aligned.getCenter(new THREE.Vector3());
      gltf.scene.position.sub(new THREE.Vector3(center.x, aligned.min.y, center.z));
      for (const instance of propInstances.get(type) || []) {
        const replacement = gltf.scene.clone(true);
        instance.root.add(replacement); instance.placeholder.visible = false;
        instance.root.userData.asset = config.model;
        if (type === 'lantern') {
          // The uploaded fixture is a solid asset; provide its warm light separately.
          const pane = new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),glow);
          pane.position.set(0,.57,.14); instance.root.add(pane);
        }
      }
    } catch (e) { console.warn('Prop placeholder retained:', type, e); }
  }
}
replaceProps();

function start() { active = true; $('intro').hidden = true; }
function select(index) {
  start(); selected = (index + stations.length) % stations.length;
  const s = stations[selected];
  const destination = s.target.clone();
  if (s.isAltar) destination.z = s.root.position.z + Math.max(9, 4.8 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect));
  else if (innerWidth < 700) destination.x = 0;
  desired = { position: destination, look: new THREE.Vector3(s.root.position.x, 2.65, s.root.position.z) };
  $('story').open = innerWidth > 700;
  $('detail').hidden = false; $('directory').hidden = true;
  $('detailName').textContent = s.data.name;
  $('detailStage').textContent = s.data.stage;
  $('detailDesc').textContent = s.data.desc;
  $('zone').textContent = s.isAltar ? '五福主坛' : s.data.stage;
  $('classicLink').href = `temple.html?deity=${encodeURIComponent(s.data.name)}#sanctum`;
  document.querySelectorAll('#deityList button').forEach((b, i) => b.classList.toggle('active', i === selected));
  requestModel(selected); updateStatus();
  rotationEnabled = false; $('rotate').textContent = '旋转神像';
}
deities.forEach((d, i) => {
  const b = document.createElement('button');
  const n = document.createElement('span'); n.textContent = String(i + 1).padStart(2, '0');
  b.append(n, d.name); b.addEventListener('click', () => select(i)); $('deityList').appendChild(b);
});
$('count').textContent = deities.length;
$('start').onclick = () => { start(); $('help').showModal(); };
$('helpOpen').onclick = () => $('help').showModal();
$('helpClose').onclick = $('helpDone').onclick = () => $('help').close();
$('directoryOpen').onclick = () => { $('directory').hidden = !$('directory').hidden; $('detail').hidden = true; };
$('directoryClose').onclick = () => $('directory').hidden = true;
$('detailClose').onclick = () => $('detail').hidden = true;
$('previous').onclick = () => select(selected < 0 ? 0 : selected - 1);
$('next').onclick = () => select(selected + 1);
$('altar').onclick = () => select(stations.length - 1);
$('home').onclick = () => {
  start(); desired = { position: new THREE.Vector3(0, 2.5, 10), look: new THREE.Vector3(0, 2.5, -40) };
  selected = -1; $('detail').hidden = true; $('directory').hidden = true; $('zone').textContent = '入殿门庭'; rotationEnabled = false;
};
$('rotate').onclick = () => { rotationEnabled = !rotationEnabled; $('rotate').textContent = rotationEnabled ? '停止旋转' : '旋转神像'; };
$('retry').onclick = () => { if (selected >= 0) { stations[selected].state = 'idle'; requestModel(selected); } };

let pointer = null;
renderer.domElement.addEventListener('pointerdown', e => {
  if ($('help').open) return;
  renderer.domElement.focus(); renderer.domElement.setPointerCapture(e.pointerId);
  pointer = { x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY, moved: false };
});
renderer.domElement.addEventListener('pointermove', e => {
  if (!pointer) return;
  if (Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y) > 5) pointer.moved = true;
  if (pointer.moved) {
    start(); desired = null;
    yaw -= (e.clientX - pointer.lastX) * .0035;
    pitch = THREE.MathUtils.clamp(pitch - (e.clientY - pointer.lastY) * .0035, -.75, .75);
  }
  pointer.lastX = e.clientX; pointer.lastY = e.clientY;
});
renderer.domElement.addEventListener('pointerup', e => {
  if (pointer && !pointer.moved) {
    raycaster.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, 1 - e.clientY / innerHeight * 2), camera);
    const hits = raycaster.intersectObjects(clickTargets, false).filter(h => h.object.visible);
    if (hits.length) select(hits[0].object.userData.index);
  }
  pointer = null;
});
renderer.domElement.addEventListener('pointercancel', () => pointer = null);
const movementKeys = { KeyW: 'forward', ArrowUp: 'forward', KeyS: 'back', ArrowDown: 'back', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right' };
addEventListener('keydown', e => {
  if (e.code === 'Escape') { $('detail').hidden = true; $('directory').hidden = true; keys.clear(); }
  if (movementKeys[e.code] && !$('help').open && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    e.preventDefault(); start(); desired = null; keys.add(movementKeys[e.code]);
  }
});
addEventListener('keyup', e => keys.delete(movementKeys[e.code]));
addEventListener('blur', () => { keys.clear(); pointer = null; });
document.addEventListener('visibilitychange', () => { if (document.hidden) keys.clear(); });
document.querySelectorAll('[data-move]').forEach(b => {
  b.addEventListener('pointerdown', e => { start(); desired = null; b.setPointerCapture(e.pointerId); keys.add(b.dataset.move); });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(event, () => keys.delete(b.dataset.move));
});
renderer.domElement.addEventListener('webglcontextlost', e => {
  e.preventDefault(); $('fatal').hidden = false; $('fatalMessage').textContent = '图形资源已中断，请刷新页面重新进入，或使用图文神殿。';
});
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  if (selected >= 0) select(selected);
});
let previousTime = performance.now(), nearbyCheck = 0;
function animate(time) {
  requestAnimationFrame(animate);
  const dt = Math.min((time - previousTime) / 1000, .045); previousTime = time;
  if (document.hidden) return;
  if (desired) {
    const alpha = reducedMotion ? 1 : 1 - Math.exp(-dt * 4);
    camera.position.lerp(desired.position, alpha);
    const dx = desired.look.x - camera.position.x, dz = desired.look.z - camera.position.z;
    const targetYaw = Math.atan2(-dx, -dz);
    yaw += Math.atan2(Math.sin(targetYaw - yaw), Math.cos(targetYaw - yaw)) * alpha;
    pitch += (Math.atan2(desired.look.y - camera.position.y, Math.hypot(dx, dz)) - pitch) * alpha;
    if (camera.position.distanceTo(desired.position) < .015 && Math.abs(Math.atan2(Math.sin(targetYaw - yaw), Math.cos(targetYaw - yaw))) < .005) desired = null;
  } else if (keys.size && !$('help').open) {
    const f = Number(keys.has('forward')) - Number(keys.has('back'));
    const r = Number(keys.has('right')) - Number(keys.has('left'));
    const norm = Math.max(1, Math.hypot(f, r));
    camera.position.x += (-Math.sin(yaw) * f + Math.cos(yaw) * r) * dt * 4 / norm;
    camera.position.z += (-Math.cos(yaw) * f - Math.sin(yaw) * r) * dt * 4 / norm;
    // Keep visitors within the clear central aisle and in front of the altar steps.
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -4.1, 4.1);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -39, 11);
  }
  camera.rotation.set(pitch, yaw, 0, 'YXZ');
  if (rotationEnabled && stations[selected]?.model) stations[selected].model.rotation.y += dt * .3;
  nearbyCheck += dt;
  if (nearbyCheck > 1.5 && active && !desired && selected < 0) {
    nearbyCheck = 0;
    const closest = stations.filter(s => s.target.distanceTo(camera.position) < 7).sort((a, b) => a.target.distanceTo(camera.position) - b.target.distanceTo(camera.position));
    if (closest[0]) { requestModel(closest[0].index); $('zone').textContent = closest[0].data.stage; }
  }
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);
updateStatus();
// Populate every bay with its GLB. Selection takes priority, but does not cancel
// the background queue. Lightweight derivatives stay resident after loading.
for (const index of [0,1,stations.length-1,...stations.map(s=>s.index)]) requestModel(index);
// Read-only diagnostics used to verify navigation and progressive model loading.
window.templeDiagnostics = () => ({ models: stations.map(s => ({ name: s.data.name, state: s.state, pose:s.pose })), resident: stations.filter(s => s.model).length, selected, position: camera.position.toArray(), drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles, props: Object.fromEntries([...propInstances].map(([k, v]) => [k, {count:v.length,loaded:v.filter(i=>i.root.userData.asset).length}])) });
