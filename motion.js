import * as THREE from 'three';
import { PoseTracker, POSE_CONNECTIONS } from './src/pose/PoseTracker.js?v=20260531-13';
import { AvatarLoader } from './src/avatar/AvatarLoader.js?v=20260531-13';
import { HumanoidRetargeter } from './src/avatar/HumanoidRetargeter.js?v=20260531-13';

const DEITIES = [
 {
 name: '七爷',
 english: "Seventh Lord, Xie Bi'an",
 role: 'Underworld Messenger',
 code: 'Tall frame, white face, long tongue',
 movement: 'Weighted, ceremonial, slow',
 story: '七爷是福州游神中最经典的塔骨形象之一，承担巡捕、护境与驱邪的仪式角色。白面长舌、高大塔骨与稳重步伐，让它成为游神队伍中极具辨识度的存在。',
 storyHref: 'deities.html#section3',
 modelUrl: 'assets/实时渲染模型/七爷动作.glb',
 motionEnabled: true,
 supportLabel: '可动捕',
 },
 {
 name: '武判官',
 english: 'Martial Judge',
 role: 'Ritual Officer',
 code: 'Judge figure, martial presence, procession authority',
 movement: 'Firm, upright, commanding',
 story: '武判官在巡游系统中带有审判、押解与护卫意味。它的动作应更沉稳有力，像是在把人的身体动作转译成塔骨中的仪式姿态。',
 storyHref: 'deities.html#section8',
 modelUrl: 'assets/实时渲染模型/武判官动作.glb',
 motionEnabled: true,
 supportLabel: '可动捕',
 },
];

const AUTO_MIRROR = true;
const RETARGET_OPTIONS = {
 // Match the mirrored selfie preview: screen-left/screen-right motion on
 // the camera should read the same on the deity model.
 mirror: true,
 screenSpaceMirror: true,
 flipX: false,
 flipY: true,
 // MediaPipe depth is opposite to the avatar stage depth in this scene:
 // a hand reaching toward the camera needs to become a forward reach.
 flipZ: true,
 humanForward: new THREE.Vector3(0, 0, 1),
 // After avatarStage rotates this GLB for display, +Z is the deity face
 // direction. This is the model's front axis for retargeting.
 avatarForward: new THREE.Vector3(0, 0, 1),
 smoothing: 0.38,
 drive: {
 arms: true,
 legs: true,
 spine: true,
 head: true,
 },
};

const els = {
 page: document.getElementById('motionPage'),
 status: document.getElementById('motionStatus'),
 modelStatus: document.getElementById('modelStatus'),
 video: document.getElementById('cameraVideo'),
 poseCanvas: document.getElementById('poseCanvas'),
 rigCanvas: document.getElementById('rigCanvas'),
 deitySelector: document.getElementById('deitySelector'),
 deityName: document.getElementById('deityName'),
 deityEnglish: document.getElementById('deityEnglish'),
 deityRole: document.getElementById('deityRole'),
 deityCode: document.getElementById('deityCode'),
 deityMovement: document.getElementById('deityMovement'),
 deityStory: document.getElementById('deityStory'),
 deitySupport: document.getElementById('deitySupport'),
 storyLink: document.getElementById('storyLink'),
 enterSelectionButton: document.getElementById('enterSelectionButton'),
 showGuideButton: document.getElementById('showGuideButton'),
 tryCarryButton: document.getElementById('tryCarryButton'),
 enableCameraButton: document.getElementById('enableCameraButton'),
 renderLabel: document.getElementById('renderLabel'),
 cameraPane: document.querySelector('.motion-camera'),
 renderPane: document.querySelector('.motion-render'),
};

const poseCtx = els.poseCanvas.getContext('2d');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
camera.position.set(0, 0.04, 4.9);
camera.lookAt(0, 0.02, 0);

const renderer = new THREE.WebGLRenderer({
 canvas: els.rigCanvas,
 antialias: true,
 alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const avatarStage = new THREE.Group();
avatarStage.rotation.y = -Math.PI / 2;
scene.add(avatarStage);

scene.add(new THREE.HemisphereLight(0xffffff, 0x2b0800, 1.5));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
keyLight.position.set(2.8, 4.8, 4.2);
scene.add(keyLight);

let poseTracker;
let retargeter;
let currentAvatarRoot = null;
let currentSkeletonHelper = null;
let selectedDeityIndex = 0;
let cameraStarted = false;
let experienceRequested = false;
let lastDrivenCount = -1;

init();

async function init() {
 setStatus('请先选择一尊可动捕神明');
 resizeRenderer();
 resizePoseCanvas();
 window.addEventListener('resize', () => {
 resizeRenderer();
 resizePoseCanvas();
 });

 if (AUTO_MIRROR) els.cameraPane.classList.add('is-mirrored');

 setupDeitySelector();
 els.enterSelectionButton.addEventListener('click', enterSelection);
 els.showGuideButton.addEventListener('click', showGuide);
 els.tryCarryButton.addEventListener('click', showCalibration);
 els.enableCameraButton.addEventListener('click', startCameraAutomatically);

 animate();
 loadAvatar(selectedDeityIndex);
}

function setupDeitySelector() {
 els.deitySelector.innerHTML = '';
 DEITIES.forEach((deity, index) => {
 const button = document.createElement('button');
 const isReady = deity.motionEnabled && deity.modelUrl;
 button.className = `deity-option${index === selectedDeityIndex ? ' is-active' : ''}${isReady ? '' : ' is-unavailable'}`;
 button.type = 'button';
 button.disabled = !isReady;
 button.setAttribute('aria-label', `${deity.name}，${isReady ? '可动捕' : '动作适配中'}`);
 button.innerHTML = `
 <span class="deity-option-copy"><strong>${deity.name}</strong><span>${deity.english}</span></span>
 <em>${isReady ? deity.supportLabel : '适配中'}</em>
 `;
 if (isReady) button.addEventListener('click', () => selectDeity(index));
 els.deitySelector.appendChild(button);
 });

 const futureSlot = document.createElement('div');
 futureSlot.className = 'deity-option future-slot';
 futureSlot.innerHTML = '<span class="deity-option-copy"><strong>更多神明</strong><span>Future avatar slots</span></span><em>待加入</em>';
 els.deitySelector.appendChild(futureSlot);
 updateDeityCopy();
}

function enterSelection() {
 els.page.classList.add('has-entered');
 els.page.classList.remove('showing-guide');
 els.status.textContent = '请选择一尊可动捕神明';
 window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showGuide() {
 els.page.classList.add('showing-guide');
 window.scrollTo({ top: 0, behavior: 'smooth' });
}

function selectDeity(index) {
 if (index === selectedDeityIndex) return;
 selectedDeityIndex = index;
 experienceRequested = false;
 cameraStarted = false;
 poseTracker?.stopCamera();
 poseTracker = null;
 retargeter = null;
 lastDrivenCount = -1;
 els.page.classList.remove('is-calibrating', 'is-live');
 els.renderLabel.textContent = 'Digital Tǎgǔ Preview';
 setupDeitySelector();
 loadAvatar(selectedDeityIndex);
}

function updateDeityCopy() {
 const deity = DEITIES[selectedDeityIndex];
 els.deityName.textContent = deity.name;
 els.deityEnglish.textContent = deity.english;
 els.deityRole.textContent = deity.role;
 els.deityCode.textContent = deity.code;
 els.deityMovement.textContent = deity.movement;
 els.deityStory.textContent = deity.story;
 els.deitySupport.textContent = deity.motionEnabled ? '可动捕 — MOTION READY' : '动作适配中 — COMING SOON';
 els.deitySupport.classList.toggle('is-pending', !deity.motionEnabled);
 els.storyLink.href = deity.storyHref;
 els.tryCarryButton.disabled = !deity.motionEnabled;
}

function showCalibration() {
 experienceRequested = true;
 els.page.classList.add('is-calibrating');
 els.status.textContent = '请站入互动区域，并允许摄像头权限';
 els.enableCameraButton.focus();
}

async function loadAvatar(index = selectedDeityIndex) {
 try {
 const deity = DEITIES[index];
 els.renderPane.classList.remove('is-ready');
 setModelStatus(`${deity.name} 模型加载中`);
 clearAvatar();

 const loader = new AvatarLoader({
 modelUrl: new URL(deity.modelUrl, import.meta.url).href,
 targetHeight: 2.35,
 });
 const avatar = await loader.load();
 currentAvatarRoot = avatar.root;
 avatarStage.add(currentAvatarRoot);
 avatarStage.updateMatrixWorld(true);

 // Keep the real GLB skeleton available in the console/debug tooling,
 // but do not show extra UI on the page.
 currentSkeletonHelper = new THREE.SkeletonHelper(avatar.root);
 currentSkeletonHelper.visible = false;
 scene.add(currentSkeletonHelper);

 retargeter = new HumanoidRetargeter({
 avatarRoot: avatarStage,
 boneNameMap: avatar.boneNameMap,
 ...RETARGET_OPTIONS,
 });

 console.table(loader.getBoneDebugRows());
 console.table(loader.getMappingRows());
 els.renderPane.classList.add('is-ready');
 setModelStatus(`${deity.name} 模型已加载`);
 setStatus(cameraStarted ? '摄像头运行中，正在同步动作' : `已选择 ${deity.name}`);
 } catch (error) {
 console.error(error);
 setModelStatus('3D 神像加载失败');
 setStatus('请检查实时渲染模型路径');
 }
}

function clearAvatar() {
 if (currentAvatarRoot) {
 avatarStage.remove(currentAvatarRoot);
 currentAvatarRoot = null;
 }

 if (currentSkeletonHelper) {
 scene.remove(currentSkeletonHelper);
 currentSkeletonHelper = null;
 }
}

async function startCameraAutomatically() {
 if (cameraStarted) return;

 try {
 setStatus('正在请求摄像头权限');
 poseTracker = new PoseTracker({ video: els.video });
 await poseTracker.init();
 await poseTracker.startCamera();
 cameraStarted = true;
 els.page.classList.remove('is-calibrating');
 els.page.classList.add('is-live');
 els.renderLabel.textContent = '3D Retargeted Tǎgǔ';
 setStatus(retargeter ? '摄像头运行中，正在同步动作' : '摄像头已启动，正在加载 3D 神像');
 } catch (error) {
 console.error(error);
 setStatus(getCameraErrorMessage(error));
 }
}

function animate(timestamp = performance.now()) {
 resizeRenderer();
 resizePoseCanvas();

 if (poseTracker && cameraStarted && experienceRequested) {
 const frame = poseTracker.detect(timestamp);
 if (frame) {
 drawCameraPose(frame);

 if (retargeter && frame.worldLandmarks) {
 retargeter.update(frame.worldLandmarks, frame.validWorldLandmarks);
 const drivenCount = retargeter.lastUpdateStats?.driven?.length ?? 0;
 if (drivenCount !== lastDrivenCount) {
 setStatus(drivenCount > 0 ? `动作同步中 — ${drivenCount} 根骨骼` : '等待可靠人体关键点');
 lastDrivenCount = drivenCount;
 }
 } else {
 setStatus('等待人体进入画面');
 }
 }
 }

 renderer.render(scene, camera);
 requestAnimationFrame(animate);
}

function drawCameraPose(frame) {
 poseCtx.clearRect(0, 0, els.poseCanvas.width, els.poseCanvas.height);
 const landmarks = frame.landmarks;
 if (!landmarks) return;

 poseCtx.lineWidth = 4;
 poseCtx.lineCap = 'round';
 poseCtx.strokeStyle = 'rgba(192, 57, 43, 0.9)';
 poseCtx.fillStyle = 'rgba(192, 57, 43, 0.96)';

 POSE_CONNECTIONS.forEach(([a, b]) => {
 if (!frame.validLandmarks[a] || !frame.validLandmarks[b]) return;
 const pa = landmarks[a];
 const pb = landmarks[b];
 poseCtx.beginPath();
 poseCtx.moveTo(pa.x * els.poseCanvas.width, pa.y * els.poseCanvas.height);
 poseCtx.lineTo(pb.x * els.poseCanvas.width, pb.y * els.poseCanvas.height);
 poseCtx.stroke();
 });

 landmarks.forEach((landmark, index) => {
 if (!frame.validLandmarks[index]) return;
 poseCtx.beginPath();
 poseCtx.arc(
 landmark.x * els.poseCanvas.width,
 landmark.y * els.poseCanvas.height,
 5,
 0,
 Math.PI * 2
 );
 poseCtx.fill();
 });
}

function resizeRenderer() {
 const rect = els.rigCanvas.parentElement.getBoundingClientRect();
 const width = Math.max(Math.floor(rect.width), 1);
 const height = Math.max(Math.floor(rect.height), 1);
 if (els.rigCanvas.width !== width || els.rigCanvas.height !== height) {
 renderer.setSize(width, height, false);
 camera.aspect = width / height;
 camera.updateProjectionMatrix();
 }
}

function resizePoseCanvas() {
 const rect = els.poseCanvas.parentElement.getBoundingClientRect();
 const width = Math.max(Math.floor(rect.width), 1);
 const height = Math.max(Math.floor(rect.height), 1);
 if (els.poseCanvas.width !== width || els.poseCanvas.height !== height) {
 els.poseCanvas.width = width;
 els.poseCanvas.height = height;
 }
}

function setStatus(text) {
 els.status.textContent = text;
}

function setModelStatus(text) {
 els.modelStatus.textContent = text;
}

function getCameraErrorMessage(error) {
 if (error?.name === 'NotAllowedError') return '摄像头权限被拒绝，请允许浏览器访问摄像头';
 if (error?.name === 'NotFoundError') return '未找到摄像头';
 if (error?.name === 'NotReadableError') return '摄像头被其他程序占用';
 return '摄像头或识别模型启动失败';
}
