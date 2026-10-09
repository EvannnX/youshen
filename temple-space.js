import * as THREE from 'three';
import { deityRows, hall } from './temple-layout.js?v=20261009-plaque-1';
import { buildTempleArchitecture } from './temple-architecture.js?v=20261009-plaque-1';
import { createEntrance } from './temple-entrance.js?v=20261009-plaque-1';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { deities } from './temple-space-data.js';
import { templeProps } from './temple-props.js?v=20261009-plaque-1';
import { applyRelaxedPose } from './temple-pose.js?v=20260923-clearance-3';
import { templeMaterial, agedTempleMaterial } from './temple-materials.js?v=20261009-plaque-1';

const $ = id => document.getElementById(id);
const isEnglish = new URLSearchParams(location.search).get('lang') === 'en';
const templeAudio = $('templeAudio');
const audioToggle = $('audioToggle');
templeAudio.volume = 0.32;

function syncAudioControl() {
  const playing = !templeAudio.paused;
  audioToggle.setAttribute('aria-pressed', String(playing));
  audioToggle.textContent = isEnglish ? (playing ? 'Sound on' : 'Sound off') : (playing ? '音乐开' : '音乐关');
  audioToggle.setAttribute('aria-label', isEnglish
    ? (playing ? 'Pause temple music' : 'Play temple music')
    : (playing ? '关闭神殿音乐' : '播放神殿音乐'));
}

function beginTempleMusic() {
  // Do not wait for loadeddata or canplaythrough. The browser may begin as soon
  // as it has enough of the M4A stream, while the remainder continues loading.
  templeAudio.play().catch(() => syncAudioControl());
}

templeAudio.addEventListener('play', syncAudioControl);
templeAudio.addEventListener('pause', syncAudioControl);
audioToggle.addEventListener('click', () => {
  if (templeAudio.paused) beginTempleMusic();
  else templeAudio.pause();
});
for (const eventName of ['pointerdown', 'keydown', 'touchstart']) {
  addEventListener(eventName, beginTempleMusic, { once: true, passive: true });
}
beginTempleMusic();
const englishNames = {
  '保长公': 'Procession Leader', '马夫': 'Horse Handler', '赵世子': 'Prince Zhao',
  '张大世子': 'Elder Prince Zhang', '张二世子': 'Second Prince Zhang', '华光大世子': 'Prince Huaguang',
  '金龙太子': 'Golden Dragon Prince', '长郡主': 'Princess Zhang', '孩儿弟': 'Child Deity',
  '哪吒': 'Nezha', '小太子': 'Little Prince', '文状元': 'Civil Scholar', '七爷': 'Seventh Lord',
  '八爷': 'Eighth Lord', '马元帅': 'Marshal Ma', '温元帅': 'Marshal Wen', '康元帅': 'Marshal Kang',
  '关帝': 'Guan Di', '白马尊王': 'White Horse King', '福州城隍': 'Fuzhou City God', '五福大帝': 'Five Emperors'
};
const englishStages = {
  '开道与仪仗': 'Procession Lead', '世子与陪祀': 'Princes and Attendants',
  '神将与部属': 'Guardians and Retinue', '主祀与地方信仰': 'Main Deities'
};
const englishDescriptions = {
  '保长公': 'A procession leader who opens the way and establishes the ritual order.',
  '马夫': 'A path opening attendant who helps set the pace and direction of the procession.',
  '赵世子': 'A prince figure honoured as an attendant deity within the procession.',
  '张大世子': 'The elder of the Zhang princes, accompanying the ritual procession.',
  '张二世子': 'The younger Zhang prince, presented with the accompanying deity group.',
  '华光大世子': 'A Prince Huaguang figure, represented with martial splendour in the procession.',
  '金龙太子': 'A Golden Dragon Prince figure, one of the princely attendants in local worship.',
  '长郡主': 'A princess figure included among the princely and attendant deities.',
  '孩儿弟': 'A child deity with a smaller ritual image and a distinct place in the group.',
  '哪吒': 'Nezha, a youthful martial deity recognised by his energetic, protective presence.',
  '小太子': 'A Little Prince figure, shown at a smaller scale than the adult deity images.',
  '文状元': 'A civil scholar figure associated with learning, achievement and ceremonial order.',
  '七爷': 'Seventh Lord, a familiar guardian figure in the procession.',
  '八爷': 'Eighth Lord, paired in popular practice with other protective procession figures.',
  '马元帅': 'Marshal Ma, a martial guardian represented in the deity retinue.',
  '温元帅': 'Marshal Wen, a martial guardian represented in the deity retinue.',
  '康元帅': 'Marshal Kang, a martial guardian represented in the deity retinue.',
  '关帝': 'Guan Di, revered for loyalty, righteousness and martial protection.',
  '白马尊王': 'White Horse King, a local deity honoured in Fuzhou area traditions.',
  '福州城隍': 'The City God of Fuzhou, protector of the city and its community.',
  '五福大帝': 'The Five Emperors, the principal group represented at the main altar.'
};
const deityName = deity => isEnglish ? englishNames[deity.name] || deity.name : deity.name;
const stageName = stage => isEnglish ? englishStages[stage] || stage : stage;
const deityDescription = deity => isEnglish ? englishDescriptions[deity.name] || deity.desc : deity.desc;
const ui = (zh, en) => isEnglish ? en : zh;

function localizeStaticInterface() {
  if (!isEnglish) return;
  document.documentElement.lang = 'en';
  document.title = 'Immersive Temple — Youshen';
  $('scene').setAttribute('aria-label', 'Interactive Youshen immersive temple');
  renderer.domElement.setAttribute('aria-label', 'Immersive temple. Drag to look around and use arrow keys to walk.');
  const brand = document.querySelector('.brand');
  brand.href = 'en/index.html'; brand.textContent = '神殿';
  document.querySelector('.topbar nav a').href = 'en/temple.html#sanctum';
  document.querySelector('.topbar nav a').textContent = 'Text Temple';
  $('helpOpen').setAttribute('aria-label', 'Visitor guide');
  $('detail').setAttribute('aria-label', 'Selected deity details');
  $('detailClose').setAttribute('aria-label', 'Close details');
  document.querySelector('#story summary').textContent = 'Deity story';
  document.querySelector('#story small').textContent = 'This display follows a curatorial sequence. Procession orders vary by locality.';
  $('rotate').textContent = 'Rotate figure'; $('retry').textContent = 'Retry loading';
  $('classicLink').textContent = 'View in text temple';
  document.querySelector('.drawer-title h2').textContent = 'Deity index';
  $('directoryClose').setAttribute('aria-label', 'Close deity index');
  document.querySelector('.location .eyebrow').textContent = 'You are here';
  $('zone').textContent = 'Entrance Hall'; $('roomStatus').textContent = 'Lighting the temple...';
  $('directoryOpen').innerHTML = 'Deity index <span id="count">21</span>';
  $('previous').setAttribute('aria-label', 'Previous figure'); $('next').setAttribute('aria-label', 'Next figure');
  $('home').textContent = 'Entrance'; $('altar').textContent = 'Main Altar';
  document.querySelector('.move-pad').setAttribute('aria-label', 'Touch controls');
  document.querySelector('[data-move="forward"]').setAttribute('aria-label', 'Forward');
  document.querySelector('[data-move="left"]').setAttribute('aria-label', 'Move left');
  document.querySelector('[data-move="back"]').setAttribute('aria-label', 'Back');
  document.querySelector('[data-move="right"]').setAttribute('aria-label', 'Move right');
  document.querySelector('#help .eyebrow').textContent = 'Visitor guide';
  document.querySelector('#help h2').textContent = 'Let the lantern light introduce the deities';
  const help = document.querySelectorAll('#help p');
  help[0].textContent = 'Drag to look around. Use W A S D or the arrow keys to walk. On mobile, use the direction controls at bottom right.';
  help[1].textContent = 'Select a figure, nameplate or index entry to travel to its station. The bottom arrows follow the curatorial route. Main Altar takes you directly to the Five Emperors.';
  help[2].textContent = 'After selecting a figure, you can rotate it. A reference image remains visible while a model loads, and failed loads can be retried.';
  $('helpDone').textContent = 'Begin visiting'; $('helpClose').setAttribute('aria-label', 'Close visitor guide');
  document.querySelector('#fatal h2').textContent = 'The immersive temple cannot open right now';
  $('fatalMessage').textContent = 'Please use a browser that supports WebGL.';
  document.querySelector('#fatal a').href = 'en/temple.html#sanctum';
  document.querySelector('#fatal a').textContent = 'Open text temple';
}
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#19130f');
scene.fog = new THREE.FogExp2('#30271e', 0.005);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.08, 240);
camera.position.set(0, 2.5, 10);
camera.rotation.order = 'YXZ';
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
$('scene').appendChild(renderer.domElement);
renderer.domElement.tabIndex = 0;
renderer.domElement.setAttribute('aria-label', '三维神殿，拖动环顾，方向键行走');
localizeStaticInterface();
const hemi = new THREE.HemisphereLight('#ffddad', '#32313e', 2.3);
scene.add(hemi);
const sunlight = new THREE.DirectionalLight('#ffd6a0', 3.2);
sunlight.position.set(1, 7, 8);
scene.add(sunlight);
const fill = new THREE.DirectionalLight('#9dafcf', 1.2);
fill.position.set(-6, 3, -25);
scene.add(fill);

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .65, ...extra });
const wood = agedTempleMaterial('timber');
const red = agedTempleMaterial('vermilion');
const gold = agedTempleMaterial('gold');
const stone = templeMaterial('slate_floor_03', [2, 2], '#756b5d', .35);
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
buildTempleArchitecture(scene);

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
for (const z of deityRows) {
  for (const side of [-1, 1]) {
    prop('lantern', side * (hall.wallX - 1.4), 7.3, z).scale.setScalar(2);
    // Ceiling cross rail and suspension rod connect the lantern to the frame.
    box(scene, side * (hall.wallX - 1.4), 10.7, z, .14, .18, 5.4, wood);
    cylinder(scene, side * (hall.wallX - 1.4), 10.25, z, .035, .7, gold);
    prop('banner', side * (hall.wallX - .7), 1.05, z - 4.8, Math.PI / 2).scale.setScalar(3);
    // Two short drops suspend the embroidered banner's top rod.
    box(scene, side * (hall.wallX - .7), 10.7, z - 4.8, 1.35, .16, .16, wood);
    for(const dx of [-.36,.36])cylinder(scene, side * (hall.wallX - .7)+dx, 10.65, z - 4.8, .016, .15, gold);
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
  const z = isAltar ? hall.altar : deityRows[Math.floor(index / 2)];
  const x = isAltar ? 0 : side * hall.statueX;
  const root = new THREE.Group(); root.position.set(x, 0, z);
  root.rotation.y = isAltar ? 0 : -side * Math.PI / 2;
  scene.add(root);
  if (isAltar) {
    box(scene, 0, .16, hall.altar, 22, .32, 7, stone);
    box(scene, 0, .48, hall.altar - .4, 19.6, .32, 6.3, stone);
    box(scene, 0, .89, hall.altar - .7, 17.6, .5, 5.6, wood);
    box(scene, 0, 1.16, hall.altar - .7, 18, .08, 5.75, gold);
    for (const sx of [-7.35, 7.35]) cylinder(scene, sx, 5.25, hall.altar, .2, 9.8, red);
    for (let j = 0; j < 5; j++) box(scene, 0, 8.8 + j * .2, hall.altar - .5, 18 - j * .7, .2, 4 - j * .4, j === 0 ? gold : wood);
    prop('plaque', 0, 9.5, hall.altar + 1.8);
    for (const x of [-2.9, 2.9]) box(scene, x, 12.5, hall.altar + 1.8, .055, 1.2, .055, gold);
    prop('curtain', 0, 5.55, hall.altar - 1.6).scale.x = 1.5;
    // Curtain rail carried by two posts and tied into the altar canopy.
    box(scene, 0, 8.9, hall.altar - 1.6, 16, .16, .18, wood);
    for(const sx of [-7.8,7.8]) {
      cylinder(scene, sx, 4.47, hall.altar - 1.6, .09, 8.94, wood);
      box(scene, sx, 8.94, hall.altar - 1, .14, .18, 1.4, gold);
    }
  } else {
    const plinth = prop('plinth', x, 0, z, root.rotation.y);
    plinth.scale.set(2, 1.5, 2);
    const screen = prop('lattice', x + side * 2.15, 1.05, z, root.rotation.y);
    screen.scale.set(1.8, 1.5, 1);
  }
  const picture = new THREE.Mesh(new THREE.PlaneGeometry(isAltar ? 7 : 2.35, isAltar ? 3.7 : 3.4), new THREE.MeshBasicMaterial({ color: '#56412d', side: THREE.DoubleSide }));
  picture.position.set(0, isAltar ? 4.2 : 3.6, .12); root.add(picture);
  textureLoader.load(d.image, t => {
    t.colorSpace = THREE.SRGBColorSpace; picture.material.map = t; picture.material.color.set('#ffffff');
    picture.material.needsUpdate = true; pictureTextures.push(t);
    const aspect = t.image.width / t.image.height;
    picture.scale.x = Math.min(1, (isAltar ? 3.7 : 3.4) * aspect / (isAltar ? 7 : 2.35));
  }, undefined, () => {});
  const plaque = label(deityName(d), isAltar ? 3.4 : 2.4);
  plaque.position.set(0, isAltar ? .94 : .69, isAltar ? 2.3 : 2.2); root.add(plaque);
  picture.userData.index = plaque.userData.index = index;
  clickTargets.push(picture, plaque);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.2, .23, 40), glow);
  ring.rotation.x = -Math.PI / 2; ring.position.set(isAltar ? 0 : side * 3.5, .025, isAltar ? hall.altar + 10 : z);
  ring.userData.index = index; scene.add(ring); clickTargets.push(ring);
  stations.push({ root, picture, index, data: d, isAltar, state: 'idle', model: null, lastUsed: 0, target: new THREE.Vector3(isAltar ? 0 : side * (hall.statueX - 8.5), isAltar ? 2.7 : 2.5, isAltar ? hall.altar + 13 : z) });
});
// A deliberately small number of lights keeps the prototype usable on laptops.
for (const z of deityRows.filter((_, i) => i % 2 === 0)) {
  const light = new THREE.PointLight('#ffbb78', 55, 28, 2); light.position.set(0, 7, z); scene.add(light);
}

const roofLight = new THREE.HemisphereLight('#f2e2bb', '#73604d', 1.2);
scene.add(roofLight);

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
let selected = -1, loading = 0, rotationEnabled = false, active = false;
let desired = null, yaw = 0, pitch = -.04;
const keys = new Set();
const queue = new Set();
function updateStatus() {
  const s = stations[selected];
  const readyCount = stations.filter(station => station.state === 'ready').length;
  const errorCount = stations.filter(station => station.state === 'error').length;
  $('roomStatus').textContent = readyCount === stations.length
    ? ui(`${readyCount} 尊神像已入殿`, `${readyCount} figures are in the hall`)
    : ui(`神像入殿 ${readyCount} / ${stations.length}${errorCount ? '，部分加载失败可点选重试' : ''}`, `Figures in hall ${readyCount} / ${stations.length}${errorCount ? '. Some models can be retried.' : ''}`);
  if (!s) return;
  const states = isEnglish
    ? { idle: 'Reference image is visible. Waiting to load.', loading: 'Loading 3D figure...', ready: '3D figure is in place.', error: 'Model could not load. Reference image remains visible.' }
    : { idle: '已显示参考图，等待载入', loading: '正在载入三维神像…', ready: '三维神像已就位', error: '模型未能载入，当前显示参考图' };
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
  if (loading >= 2 || !queue.size) return;
  const index = queue.has(selected) ? selected : [...queue].sort((a, b) => stations[a].target.distanceToSquared(camera.position) - stations[b].target.distanceToSquared(camera.position))[0];
  queue.delete(index); const s = stations[index];
  if (s.state !== 'idle') { pump(); return; }
  loading++; s.state = 'loading'; updateStatus();
  try {
    const displayPath = `assets/temple-models/${s.data.model.split('/').pop()}`;
    const gltf = await loader.loadAsync(displayPath);
    const model = gltf.scene;
    // The original five scans face -X; current Tripo humanoid exports face +Z.
    const scans = ['保长公', '马夫', '赵世子', '张大世子', '张二世子', '七爷'];
    model.rotation.y = s.data.rotationY ?? (scans.includes(s.data.name) ? -Math.PI / 2 : 0);
    s.pose = applyRelaxedPose(model,s.data.name);
    const child = ['孩儿弟','小太子'].includes(s.data.name);
    fit(model, s.isAltar ? 6.3 : child ? 3.8 : 5.7, s.isAltar ? 12 : child ? Infinity : 4.725, s.isAltar ? 5.25 : child ? Infinity : 3.75, s.isAltar ? 1.2 : 1.08);
    s.bounds = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3()).toArray();
    const pivot = new THREE.Group(); pivot.add(model); s.root.add(pivot); s.model = pivot;
    pivot.traverse(o => { if (o.isMesh) { o.userData.index = index; clickTargets.push(o); } });
    s.picture.visible = false; s.state = 'ready'; s.lastUsed = performance.now();
  } catch (error) { console.error('Deity model failed:', s.data.name, error); s.state = 'error'; }
  loading--; updateStatus(); pump();
}
async function replaceProps() {
  for (const [type, config] of Object.entries(templeProps)) {
    if (!config.model) continue;
    try {
      const gltf = await loader.loadAsync(config.model);
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

function start() { active = true; }
function select(index) {
  start(); selected = (index + stations.length) % stations.length;
  const s = stations[selected];
  const destination = s.target.clone();
  if (s.isAltar) destination.z = s.root.position.z + Math.max(17, 7 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect));
  else {
    const size = s.bounds || [4.725, 5.7, 3.75];
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const distance = Math.max(8.5, size[1] * .7 / Math.tan(halfFov), size[0] * .65 / (Math.tan(halfFov) * camera.aspect));
    destination.x = Math.sign(s.root.position.x) * Math.max(0, hall.statueX - distance);
  }
  desired = { position: destination, look: new THREE.Vector3(s.root.position.x, s.isAltar ? 6 : 3.45, s.root.position.z) };
  $('story').open = innerWidth > 700;
  $('detail').hidden = false; $('directory').hidden = true;
  $('detailName').textContent = deityName(s.data);
  $('detailStage').textContent = stageName(s.data.stage);
  $('detailDesc').textContent = deityDescription(s.data);
  $('zone').textContent = s.isAltar ? ui('五福主坛', 'Five Emperors Altar') : stageName(s.data.stage);
  $('classicLink').href = isEnglish ? 'en/temple.html#sanctum' : `temple-text.html?deity=${encodeURIComponent(s.data.name)}#sanctum`;
  document.querySelectorAll('#deityList button').forEach((b, i) => b.classList.toggle('active', i === selected));
  requestModel(selected); updateStatus();
  rotationEnabled = false; $('rotate').textContent = ui('旋转神像', 'Rotate figure');
}
deities.forEach((d, i) => {
  const b = document.createElement('button');
  const n = document.createElement('span'); n.textContent = String(i + 1).padStart(2, '0');
  b.append(n, deityName(d)); b.addEventListener('click', () => select(i)); $('deityList').appendChild(b);
});
$('count').textContent = deities.length;
if ($('start')) $('start').onclick = () => { start(); $('help').showModal(); };
$('helpOpen').onclick = () => $('help').showModal();
$('helpClose').onclick = $('helpDone').onclick = () => $('help').close();
$('directoryOpen').onclick = () => { $('directory').hidden = !$('directory').hidden; $('detail').hidden = true; };
$('directoryClose').onclick = () => $('directory').hidden = true;
$('detailClose').onclick = () => $('detail').hidden = true;
$('previous').onclick = () => select(selected < 0 ? 0 : selected - 1);
$('next').onclick = () => select(selected + 1);
$('altar').onclick = () => select(stations.length - 1);
$('home').onclick = () => {
  start(); desired = { position: new THREE.Vector3(0, 2.5, 3.8), look: new THREE.Vector3(0, 2.5, -40) };
  selected = -1; $('detail').hidden = true; $('directory').hidden = true; $('zone').textContent = ui('入殿门庭', 'Entrance Hall'); rotationEnabled = false;
};
$('rotate').onclick = () => { rotationEnabled = !rotationEnabled; $('rotate').textContent = rotationEnabled ? ui('停止旋转', 'Stop rotating') : ui('旋转神像', 'Rotate figure'); };
$('retry').onclick = () => { if (selected >= 0) { stations[selected].state = 'idle'; requestModel(selected); } };

let pointer = null;
renderer.domElement.addEventListener('pointerdown', e => {
  if (entrance.active || $('help').open) return;
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
  if (!entrance.active && movementKeys[e.code] && !$('help').open && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
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
  e.preventDefault(); $('fatal').hidden = false; $('fatalMessage').textContent = ui('图形资源已中断，请刷新页面重新进入，或使用图文神殿。', 'Graphics were interrupted. Refresh to enter again, or use the text temple.');
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
  entrance.update(dt);
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
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -hall.walkLimit, hall.walkLimit);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, hall.altar + 8, 11);
  }
  camera.rotation.set(pitch, yaw, 0, 'YXZ');
  if (rotationEnabled && stations[selected]?.model) stations[selected].model.rotation.y += dt * .3;
  nearbyCheck += dt;
  if (nearbyCheck > .75 && active) {
    nearbyCheck = 0;
    const closest = stations.filter(s => s.target.distanceTo(desired?.position || camera.position) < 24).sort((a, b) => a.target.distanceTo(camera.position) - b.target.distanceTo(camera.position));
    if (closest[0]) { closest.slice(0, 4).forEach(s => requestModel(s.index)); if (selected < 0) $('zone').textContent = stageName(closest[0].data.stage); }
  }
  renderer.render(scene, camera);
}
const entrance = createEntrance({ scene, camera, box, wood, gold, stone, ui, reducedMotion,
  readiness: () => ({ ready: stations.slice(0, 4).filter(s => s.state === 'ready').length,
    settled: stations.slice(0, 4).filter(s => ['ready', 'error'].includes(s.state)).length, total: 4 }),
  onComplete: () => {
    active = true; keys.clear(); renderer.domElement.focus(); replaceProps();
    // Keep the entrance priority, then finish the hall without requiring every bay to be visited.
    stations.forEach(s => requestModel(s.index));
  }
});
requestAnimationFrame(animate);
updateStatus();
// Reserve bandwidth for the first two bays; other figures load near the visitor.
for (const index of [0, 1, 2, 3]) requestModel(index);
// Read-only diagnostics used to verify navigation and progressive model loading.
window.templeDiagnostics = () => ({ entrance: entrance.active, loading, queued: [...queue], models: stations.map(s => ({ name: s.data.name, state: s.state, pose:s.pose, bounds:s.bounds, position:s.root.position.toArray() })), resident: stations.filter(s => s.model).length, selected, position: camera.position.toArray(), drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles, props: Object.fromEntries([...propInstances].map(([k, v]) => [k, {count:v.length,loaded:v.filter(i=>i.root.userData.asset).length}])) });
