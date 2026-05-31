import * as THREE from 'three';
import { POSE_LANDMARKS } from '../pose/PoseTracker.js';
import { RETARGET_ROLES } from './AvatarLoader.js';

const EPSILON = 1e-6;
const DEFAULT_SMOOTHING = 0.42;

const ROLE_GROUP = {
    hips: 'spine',
    spine: 'spine',
    chest: 'spine',
    neck: 'head',
    head: 'head',
    leftUpperArm: 'arms',
    leftForearm: 'arms',
    rightUpperArm: 'arms',
    rightForearm: 'arms',
    leftThigh: 'legs',
    leftShin: 'legs',
    rightThigh: 'legs',
    rightShin: 'legs',
    leftFoot: 'legs',
    rightFoot: 'legs',
};

const ROLE_LIMITS_DEGREES = {
    hips: 28,
    spine: 36,
    chest: 36,
    neck: 42,
    head: 52,
    leftUpperArm: 130,
    rightUpperArm: 130,
    leftForearm: 145,
    rightForearm: 145,
    leftThigh: 95,
    rightThigh: 95,
    leftShin: 130,
    rightShin: 130,
    leftFoot: 65,
    rightFoot: 65,
};

const END_ROLE_BY_ROLE = {
    hips: 'spine',
    spine: 'chest',
    chest: 'neck',
    neck: 'head',
    leftUpperArm: 'leftForearm',
    rightUpperArm: 'rightForearm',
    leftThigh: 'leftShin',
    rightThigh: 'rightShin',
    leftShin: 'leftFoot',
    rightShin: 'rightFoot',
};

export class HumanoidRetargeter {
    constructor(options = {}) {
        this.avatarRoot = options.avatarRoot ?? null;
        this.boneNameMap = options.boneNameMap ?? {};
        this.options = {
            mirror: options.mirror ?? false,
            screenSpaceMirror: options.screenSpaceMirror ?? true,
            flipX: options.flipX ?? false,
            flipY: options.flipY ?? true,
            flipZ: options.flipZ ?? true,
            humanForward: normalizeOptionVector(options.humanForward, new THREE.Vector3(0, 0, 1)),
            avatarForward: normalizeOptionVector(options.avatarForward, new THREE.Vector3(0, 0, 1)),
            smoothing: options.smoothing ?? DEFAULT_SMOOTHING,
            drive: {
                arms: true,
                legs: true,
                spine: true,
                head: true,
                ...options.drive,
            },
        };

        this.restPose = new Map();
        this.missingFrames = new Map();
        this.avatarRestBasis = new THREE.Quaternion();
        this.lastUpdateStats = { driven: [], skipped: [] };

        if (this.avatarRoot && this.boneNameMap) {
            this.initialize(this.avatarRoot, this.boneNameMap);
        }
    }

    initialize(avatarRoot, boneNameMap) {
        this.avatarRoot = avatarRoot;
        this.boneNameMap = boneNameMap;
        this.captureRestPose();
    }

    setOptions(options = {}) {
        if ('mirror' in options) this.options.mirror = options.mirror;
        if ('screenSpaceMirror' in options) this.options.screenSpaceMirror = options.screenSpaceMirror;
        if ('flipX' in options) this.options.flipX = options.flipX;
        if ('flipY' in options) this.options.flipY = options.flipY;
        if ('flipZ' in options) this.options.flipZ = options.flipZ;
        if ('humanForward' in options) this.options.humanForward = normalizeOptionVector(options.humanForward, this.options.humanForward);
        if ('avatarForward' in options) this.options.avatarForward = normalizeOptionVector(options.avatarForward, this.options.avatarForward);
        if ('smoothing' in options) this.options.smoothing = options.smoothing;
        if (options.drive) this.options.drive = { ...this.options.drive, ...options.drive };
    }

    captureRestPose() {
        this.restPose.clear();
        this.avatarRoot?.updateMatrixWorld(true);

        RETARGET_ROLES.forEach((role) => {
            const bone = this.boneNameMap[role];
            if (!bone) return;

            const restWorldQuaternion = new THREE.Quaternion();
            bone.getWorldQuaternion(restWorldQuaternion);
            const restWorldPosition = bone.getWorldPosition(new THREE.Vector3());
            const restDirection = this.computeAvatarRestDirection(role, bone);
            if (!restDirection) return;

            this.restPose.set(role, {
                bone,
                restLocalQuaternion: bone.quaternion.clone(),
                restWorldQuaternion,
                restWorldPosition,
                restDirection,
            });
        });

        this.avatarRestBasis = this.computeAvatarBodyBasis();
        console.table(this.getActiveMappingRows());
    }

    resetToRest(alpha = 1) {
        this.restPose.forEach((rest) => {
            rest.bone.quaternion.slerp(rest.restLocalQuaternion, alpha);
        });
        this.avatarRoot?.updateMatrixWorld(true);
    }

    update(worldLandmarks, validWorldLandmarks = {}) {
        if (!worldLandmarks) return false;

        const directions = this.computeHumanDirections(worldLandmarks, validWorldLandmarks);
        const humanBasis = this.computeHumanBodyBasis(worldLandmarks);
        const humanToAvatar = this.avatarRestBasis.clone().multiply(humanBasis.invert()).normalize();
        const alpha = THREE.MathUtils.clamp(1 - this.options.smoothing, 0.05, 1);
        const driven = [];
        const skipped = [];

        RETARGET_ROLES.forEach((role) => {
            if (!this.shouldDriveRole(role)) {
                skipped.push(role);
                return;
            }

            const rest = this.restPose.get(role);
            const humanDirection = directions[role];
            if (!rest || !humanDirection?.valid) {
                if (rest) this.handleMissingRole(role, rest, alpha);
                skipped.push(role);
                return;
            }

            this.missingFrames.set(role, 0);
            const targetDirection = humanDirection.vector.clone().applyQuaternion(humanToAvatar).normalize();
            const delta = new THREE.Quaternion()
                .setFromUnitVectors(rest.restDirection, targetDirection)
                .normalize();
            clampQuaternion(delta, THREE.MathUtils.degToRad(ROLE_LIMITS_DEGREES[role] ?? 90));

            const targetWorldQuaternion = delta.multiply(rest.restWorldQuaternion).normalize();
            const parentWorldQuaternion = new THREE.Quaternion();
            rest.bone.parent?.getWorldQuaternion(parentWorldQuaternion);
            const targetLocalQuaternion = parentWorldQuaternion.invert().multiply(targetWorldQuaternion).normalize();

            rest.bone.quaternion.slerp(targetLocalQuaternion, alpha);
            rest.bone.updateMatrixWorld(true);
            driven.push(role);
        });

        this.avatarRoot?.updateMatrixWorld(true);
        this.lastUpdateStats = { driven, skipped };
        return driven.length > 0;
    }

    shouldDriveRole(role) {
        const group = ROLE_GROUP[role];
        return !group || this.options.drive[group];
    }

    handleMissingRole(role, rest, alpha) {
        const missing = (this.missingFrames.get(role) ?? 0) + 1;
        this.missingFrames.set(role, missing);
        if (missing > 10) {
            rest.bone.quaternion.slerp(rest.restLocalQuaternion, alpha * 0.12);
        }
    }

    computeAvatarRestDirection(role, bone) {
        const start = bone.getWorldPosition(new THREE.Vector3());
        if (role === 'head') {
            const neckBone = this.boneNameMap.neck ?? this.boneNameMap.chest;
            if (neckBone && neckBone !== bone) {
                return safeDirection(neckBone.getWorldPosition(new THREE.Vector3()), start);
            }
        }

        const endRole = END_ROLE_BY_ROLE[role];
        const endBone = endRole ? this.boneNameMap[endRole] : null;
        if (endBone) {
            return safeDirection(start, endBone.getWorldPosition(new THREE.Vector3()));
        }

        const child = findBestDirectionChild(bone);
        if (child) {
            return safeDirection(start, child.getWorldPosition(new THREE.Vector3()));
        }

        return null;
    }

    computeHumanDirections(worldLandmarks, validWorldLandmarks = {}) {
        const point = (index) => this.convertMediaPipeToThree(worldLandmarks[index]);
        const reliable = (...indexes) => indexes.every((index) => Boolean(worldLandmarks[index]) && validWorldLandmarks[index] !== false);

        const leftHip = point(POSE_LANDMARKS.leftHip);
        const rightHip = point(POSE_LANDMARKS.rightHip);
        const leftShoulder = point(POSE_LANDMARKS.leftShoulder);
        const rightShoulder = point(POSE_LANDMARKS.rightShoulder);
        const leftArm = {
            shoulder: leftShoulder,
            elbow: point(POSE_LANDMARKS.leftElbow),
            wrist: point(POSE_LANDMARKS.leftWrist),
            upperReliable: reliable(11, 13),
            forearmReliable: reliable(13, 15),
        };
        const rightArm = {
            shoulder: rightShoulder,
            elbow: point(POSE_LANDMARKS.rightElbow),
            wrist: point(POSE_LANDMARKS.rightWrist),
            upperReliable: reliable(12, 14),
            forearmReliable: reliable(14, 16),
        };
        const leftLeg = {
            hip: leftHip,
            knee: point(POSE_LANDMARKS.leftKnee),
            ankle: point(POSE_LANDMARKS.leftAnkle),
            heel: point(POSE_LANDMARKS.leftHeel),
            footIndex: point(POSE_LANDMARKS.leftFootIndex),
            thighReliable: reliable(23, 25),
            shinReliable: reliable(25, 27),
            footReliable: reliable(29, 31),
        };
        const rightLeg = {
            hip: rightHip,
            knee: point(POSE_LANDMARKS.rightKnee),
            ankle: point(POSE_LANDMARKS.rightAnkle),
            heel: point(POSE_LANDMARKS.rightHeel),
            footIndex: point(POSE_LANDMARKS.rightFootIndex),
            thighReliable: reliable(24, 26),
            shinReliable: reliable(26, 28),
            footReliable: reliable(30, 32),
        };
        const [screenLeftArm, screenRightArm] = this.options.screenSpaceMirror
            ? screenPair(leftArm, rightArm, 'shoulder')
            : [leftArm, rightArm];
        const [screenLeftLeg, screenRightLeg] = this.options.screenSpaceMirror
            ? screenPair(leftLeg, rightLeg, 'hip')
            : [leftLeg, rightLeg];
        const hipCenter = midpoint(leftHip, rightHip);
        const shoulderCenter = midpoint(leftShoulder, rightShoulder);
        const spineVector = shoulderCenter.clone().sub(hipCenter);
        const stableHeadProxy = shoulderCenter.clone().add(safeNormalize(spineVector, new THREE.Vector3(0, 1, 0)));

        return {
            hips: direction(hipCenter, shoulderCenter, reliable(23, 24, 11, 12)),
            spine: direction(hipCenter, shoulderCenter, reliable(23, 24, 11, 12)),
            chest: direction(hipCenter, shoulderCenter, reliable(23, 24, 11, 12)),
            // Keep sparse head/neck bones aligned to the torso. Raw nose depth
            // makes this deity rig lean backward even in a neutral stance.
            neck: direction(shoulderCenter, stableHeadProxy, reliable(23, 24, 11, 12)),
            head: direction(shoulderCenter, stableHeadProxy, reliable(23, 24, 11, 12)),

            // The deity faces the viewer, so its anatomical right arm appears
            // on screen-left. For a mirror effect, route screen-left input to
            // avatar right, and screen-right input to avatar left.
            leftUpperArm: direction(screenRightArm.shoulder, screenRightArm.elbow, screenRightArm.upperReliable),
            leftForearm: direction(screenRightArm.elbow, screenRightArm.wrist, screenRightArm.forearmReliable),
            rightUpperArm: direction(screenLeftArm.shoulder, screenLeftArm.elbow, screenLeftArm.upperReliable),
            rightForearm: direction(screenLeftArm.elbow, screenLeftArm.wrist, screenLeftArm.forearmReliable),

            leftThigh: direction(screenRightLeg.hip, screenRightLeg.knee, screenRightLeg.thighReliable),
            leftShin: direction(screenRightLeg.knee, screenRightLeg.ankle, screenRightLeg.shinReliable),
            rightThigh: direction(screenLeftLeg.hip, screenLeftLeg.knee, screenLeftLeg.thighReliable),
            rightShin: direction(screenLeftLeg.knee, screenLeftLeg.ankle, screenLeftLeg.shinReliable),

            leftFoot: direction(screenRightLeg.heel, screenRightLeg.footIndex, screenRightLeg.footReliable),
            rightFoot: direction(screenLeftLeg.heel, screenLeftLeg.footIndex, screenLeftLeg.footReliable),
        };
    }

    computeHumanBodyBasis(worldLandmarks) {
        const point = (index) => this.convertMediaPipeToThree(worldLandmarks[index]);
        const leftHip = point(POSE_LANDMARKS.leftHip);
        const rightHip = point(POSE_LANDMARKS.rightHip);
        const leftShoulder = point(POSE_LANDMARKS.leftShoulder);
        const rightShoulder = point(POSE_LANDMARKS.rightShoulder);
        const hipCenter = midpoint(leftHip, rightHip);
        const shoulderCenter = midpoint(leftShoulder, rightShoulder);

        return basisFromAxes(
            rightShoulder.clone().sub(leftShoulder),
            shoulderCenter.clone().sub(hipCenter),
            this.options.humanForward
        );
    }

    computeAvatarBodyBasis() {
        const leftShoulder = this.restPose.get('leftUpperArm')?.restWorldPosition;
        const rightShoulder = this.restPose.get('rightUpperArm')?.restWorldPosition;
        const leftHip = this.restPose.get('leftThigh')?.restWorldPosition;
        const rightHip = this.restPose.get('rightThigh')?.restWorldPosition;

        if (leftShoulder && rightShoulder && leftHip && rightHip) {
            const shoulderCenter = midpoint(leftShoulder, rightShoulder);
            const hipCenter = midpoint(leftHip, rightHip);
            return basisFromAxes(
                rightShoulder.clone().sub(leftShoulder),
                shoulderCenter.clone().sub(hipCenter),
                this.options.avatarForward
            );
        }

        const rootQuaternion = new THREE.Quaternion();
        this.avatarRoot?.getWorldQuaternion(rootQuaternion);
        return rootQuaternion;
    }

    convertMediaPipeToThree(landmark) {
        if (!landmark) return new THREE.Vector3();
        let x = landmark.x;
        let y = landmark.y;
        let z = landmark.z;

        if (this.options.mirror) x *= -1;
        if (this.options.flipX) x *= -1;
        if (this.options.flipY) y *= -1;
        if (this.options.flipZ) z *= -1;

        return new THREE.Vector3(x, y, z);
    }

    getActiveMappingRows() {
        return [...this.restPose.entries()].map(([role, rest]) => ({
            role,
            bone: rest.bone.name,
            restDirection: `${rest.restDirection.x.toFixed(3)}, ${rest.restDirection.y.toFixed(3)}, ${rest.restDirection.z.toFixed(3)}`,
        }));
    }
}

function direction(start, end, reliable) {
    const vector = end.clone().sub(start);
    const valid = reliable && vector.lengthSq() > EPSILON;
    if (!valid) return { valid: false, vector: new THREE.Vector3(0, 1, 0) };
    return { valid: true, vector: vector.normalize() };
}

function safeDirection(start, end) {
    const vector = end.clone().sub(start);
    if (vector.lengthSq() < EPSILON) return null;
    return vector.normalize();
}

function findBestDirectionChild(bone) {
    const boneChildren = bone.children.filter((child) => child.isBone);
    if (!boneChildren.length) return null;

    return boneChildren.find((child) => /hand|foot|toe/i.test(child.name))
        ?? boneChildren.find((child) => !/twist/i.test(child.name))
        ?? boneChildren[0];
}

function midpoint(a, b) {
    return a.clone().add(b).multiplyScalar(0.5);
}

function screenPair(a, b, key) {
    return a[key].x <= b[key].x ? [a, b] : [b, a];
}

function basisFromAxes(xHint, yHint, frontHint = null) {
    const yAxis = safeNormalize(yHint, new THREE.Vector3(0, 1, 0));
    let xAxis = xHint.clone().sub(yAxis.clone().multiplyScalar(xHint.dot(yAxis)));
    xAxis = safeNormalize(xAxis, new THREE.Vector3(1, 0, 0));
    let zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis);
    zAxis = safeNormalize(zAxis, new THREE.Vector3(0, 0, 1));

    // Shoulder/up cross products can point to the character's back depending
    // on the rig's facing direction. Align the basis depth axis with the
    // explicit forward hint: MediaPipe depth for the user, deity face for GLB.
    if (frontHint && zAxis.dot(safeNormalize(frontHint, zAxis)) < 0) {
        xAxis.negate();
        zAxis.negate();
    }

    xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis).normalize();

    return new THREE.Quaternion()
        .setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis))
        .normalize();
}

function safeNormalize(vector, fallback) {
    if (!vector || vector.lengthSq() < EPSILON) return fallback.clone().normalize();
    return vector.clone().normalize();
}

function normalizeOptionVector(value, fallback) {
    if (Array.isArray(value)) {
        return safeNormalize(new THREE.Vector3(value[0] ?? 0, value[1] ?? 0, value[2] ?? 0), fallback);
    }

    if (value?.isVector3) {
        return safeNormalize(value, fallback);
    }

    return fallback.clone().normalize();
}

function clampQuaternion(quaternion, maxAngle) {
    quaternion.normalize();
    if (quaternion.w < 0) {
        quaternion.x *= -1;
        quaternion.y *= -1;
        quaternion.z *= -1;
        quaternion.w *= -1;
    }

    const angle = 2 * Math.acos(THREE.MathUtils.clamp(quaternion.w, -1, 1));
    if (angle <= maxAngle || angle < EPSILON) return quaternion;

    const axis = new THREE.Vector3(quaternion.x, quaternion.y, quaternion.z);
    if (axis.lengthSq() < EPSILON) return quaternion.identity();
    return quaternion.setFromAxisAngle(axis.normalize(), maxAngle);
}
