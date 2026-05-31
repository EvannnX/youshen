import * as THREE from 'three';
import { PoseTracker, POSE_CONNECTIONS } from './src/pose/PoseTracker.js?v=20260531-13';
import { AvatarLoader } from './src/avatar/AvatarLoader.js?v=20260531-13';
import { HumanoidRetargeter } from './src/avatar/HumanoidRetargeter.js?v=20260531-13';

const MODEL_URL = new URL('assets/实时渲染模型/七爷动作.glb', import.meta.url).href;

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
    status: document.getElementById('motionStatus'),
    modelStatus: document.getElementById('modelStatus'),
    video: document.getElementById('cameraVideo'),
    poseCanvas: document.getElementById('poseCanvas'),
    rigCanvas: document.getElementById('rigCanvas'),
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
let cameraStarted = false;
let lastDrivenCount = -1;

init();

async function init() {
    setStatus('正在准备摄像头和 3D 神像');
    resizeRenderer();
    resizePoseCanvas();
    window.addEventListener('resize', () => {
        resizeRenderer();
        resizePoseCanvas();
    });

    if (AUTO_MIRROR) els.cameraPane.classList.add('is-mirrored');

    animate();
    loadAvatar();
    startCameraAutomatically();
}

async function loadAvatar() {
    try {
        const loader = new AvatarLoader({
            modelUrl: MODEL_URL,
            targetHeight: 2.35,
        });
        const avatar = await loader.load();
        avatarStage.add(avatar.root);
        avatarStage.updateMatrixWorld(true);

        // Keep the real GLB skeleton available in the console/debug tooling,
        // but do not show extra UI on the page.
        const skeletonHelper = new THREE.SkeletonHelper(avatar.root);
        skeletonHelper.visible = false;
        scene.add(skeletonHelper);

        retargeter = new HumanoidRetargeter({
            avatarRoot: avatarStage,
            boneNameMap: avatar.boneNameMap,
            ...RETARGET_OPTIONS,
        });

        console.table(loader.getBoneDebugRows());
        console.table(loader.getMappingRows());
        els.renderPane.classList.add('is-ready');
        setModelStatus('3D 神像已加载');
        setStatus(cameraStarted ? '摄像头运行中，正在同步动作' : '3D 神像已加载，等待摄像头权限');
    } catch (error) {
        console.error(error);
        setModelStatus('3D 神像加载失败');
        setStatus('请检查实时渲染模型路径');
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
        setStatus(retargeter ? '摄像头运行中，正在同步动作' : '摄像头已启动，正在加载 3D 神像');
    } catch (error) {
        console.error(error);
        setStatus(getCameraErrorMessage(error));
    }
}

function animate(timestamp = performance.now()) {
    resizeRenderer();
    resizePoseCanvas();

    if (poseTracker && cameraStarted) {
        const frame = poseTracker.detect(timestamp);
        if (frame) {
            drawCameraPose(frame);

            if (retargeter && frame.worldLandmarks) {
                retargeter.update(frame.worldLandmarks, frame.validWorldLandmarks);
                const drivenCount = retargeter.lastUpdateStats?.driven?.length ?? 0;
                if (drivenCount !== lastDrivenCount) {
                    setStatus(drivenCount > 0 ? `动作同步中 · ${drivenCount} 根骨骼` : '等待可靠人体关键点');
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
    poseCtx.strokeStyle = 'rgba(212, 175, 55, 0.88)';
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
