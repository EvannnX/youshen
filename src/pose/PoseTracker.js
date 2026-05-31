import { FilesetResolver, PoseLandmarker } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';

export const POSE_LANDMARKS = {
    nose: 0,
    leftEyeInner: 1,
    leftEye: 2,
    leftEyeOuter: 3,
    rightEyeInner: 4,
    rightEye: 5,
    rightEyeOuter: 6,
    leftEar: 7,
    rightEar: 8,
    mouthLeft: 9,
    mouthRight: 10,
    leftShoulder: 11,
    rightShoulder: 12,
    leftElbow: 13,
    rightElbow: 14,
    leftWrist: 15,
    rightWrist: 16,
    leftPinky: 17,
    rightPinky: 18,
    leftIndex: 19,
    rightIndex: 20,
    leftThumb: 21,
    rightThumb: 22,
    leftHip: 23,
    rightHip: 24,
    leftKnee: 25,
    rightKnee: 26,
    leftAnkle: 27,
    rightAnkle: 28,
    leftHeel: 29,
    rightHeel: 30,
    leftFootIndex: 31,
    rightFootIndex: 32,
};

export const POSE_CONNECTIONS = [
    [11, 12], [11, 13], [13, 15], [15, 19], [15, 17],
    [12, 14], [14, 16], [16, 20], [16, 18],
    [11, 23], [12, 24], [23, 24],
    [23, 25], [25, 27], [27, 29], [27, 31],
    [24, 26], [26, 28], [28, 30], [28, 32],
    [0, 11], [0, 12],
];

const CORE_LANDMARKS = [
    POSE_LANDMARKS.leftShoulder,
    POSE_LANDMARKS.rightShoulder,
    POSE_LANDMARKS.leftHip,
    POSE_LANDMARKS.rightHip,
];

export class PoseTracker {
    constructor(options = {}) {
        this.video = options.video;
        this.minVisibility = options.minVisibility ?? 0.35;
        this.minPresence = options.minPresence ?? 0.35;
        this.modelAssetPath = options.modelAssetPath
            ?? 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';
        this.wasmPath = options.wasmPath
            ?? 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
        this.delegate = options.delegate ?? 'GPU';
        this.poseLandmarker = null;
        this.stream = null;
        this.lastVideoTime = -1;
        this.lastFrame = null;
    }

    async init() {
        if (this.poseLandmarker) return this.poseLandmarker;

        const vision = await FilesetResolver.forVisionTasks(this.wasmPath);
        try {
            this.poseLandmarker = await this.createLandmarker(vision, this.delegate);
        } catch (error) {
            console.warn('PoseLandmarker GPU init failed; falling back to CPU.', error);
            this.poseLandmarker = await this.createLandmarker(vision, 'CPU');
        }

        return this.poseLandmarker;
    }

    createLandmarker(vision, delegate) {
        return PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: this.modelAssetPath,
                delegate,
            },
            runningMode: 'VIDEO',
            numPoses: 1,
            minPoseDetectionConfidence: 0.45,
            minPosePresenceConfidence: 0.45,
            minTrackingConfidence: 0.45,
        });
    }

    async startCamera(constraints = {}) {
        if (!this.video) throw new Error('PoseTracker requires a video element.');
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error('getUserMedia is unavailable in this browser context.');
        }

        this.stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                width: { ideal: constraints.width ?? 1280 },
                height: { ideal: constraints.height ?? 720 },
                facingMode: constraints.facingMode ?? 'user',
            },
        });

        this.video.srcObject = this.stream;
        await this.video.play();
        return this.stream;
    }

    stopCamera() {
        this.stream?.getTracks().forEach((track) => track.stop());
        this.stream = null;
        if (this.video) this.video.srcObject = null;
    }

    detect(timestamp = performance.now()) {
        if (!this.poseLandmarker || !this.video || this.video.readyState < 2) return this.lastFrame;
        if (this.video.currentTime === this.lastVideoTime) return this.lastFrame;

        this.lastVideoTime = this.video.currentTime;
        const result = this.poseLandmarker.detectForVideo(this.video, timestamp);
        const landmarks = result.landmarks?.[0] ?? null;
        const worldLandmarks = result.worldLandmarks?.[0] ?? null;
        const validLandmarks = this.buildValidityMap(landmarks);
        const validWorldLandmarks = this.buildValidityMap(worldLandmarks);
        const hasCoreLandmarks = CORE_LANDMARKS.every((index) => validLandmarks[index]);
        const hasCoreWorldLandmarks = CORE_LANDMARKS.every((index) => validWorldLandmarks[index]);

        this.lastFrame = {
            landmarks,
            worldLandmarks,
            validLandmarks,
            validWorldLandmarks,
            hasPose: Boolean(landmarks && worldLandmarks && hasCoreLandmarks && hasCoreWorldLandmarks),
            timestamp,
        };

        return this.lastFrame;
    }

    buildValidityMap(landmarks) {
        const valid = {};
        if (!landmarks) return valid;
        landmarks.forEach((landmark, index) => {
            valid[index] = this.isReliableLandmark(landmark);
        });
        return valid;
    }

    isReliableLandmark(landmark) {
        if (!landmark) return false;
        const visibilityOk = landmark.visibility === undefined || landmark.visibility >= this.minVisibility;
        const presenceOk = landmark.presence === undefined || landmark.presence >= this.minPresence;
        return visibilityOk && presenceOk;
    }
}
