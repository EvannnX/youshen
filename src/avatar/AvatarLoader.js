import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const RETARGET_ROLES = [
    'hips',
    'spine',
    'chest',
    'neck',
    'head',
    'leftUpperArm',
    'leftForearm',
    'rightUpperArm',
    'rightForearm',
    'leftThigh',
    'leftShin',
    'rightThigh',
    'rightShin',
    'leftFoot',
    'rightFoot',
];

export const DEFAULT_BONE_MAP = {
    hips: ['Hips', 'Hip', 'Pelvis', 'Root', 'root', 'Armature'],
    spine: ['Spine', 'spine', 'Bone', 'Body', 'Torso', 'Waist', 'Spine01'],
    chest: ['Chest', 'UpperChest', 'Spine1', 'Spine2', 'Spine02'],

    neck: ['Neck', 'NeckTwist01', 'NeckTwist02'],
    head: ['Head'],

    leftUpperArm: ['LeftArm', 'LeftUpperArm', 'upper_arm.L', 'Arm_L', 'L_UpperArm', 'L_Upperarm'],
    leftForearm: ['LeftForeArm', 'LeftForearm', 'lower_arm.L', 'Forearm_L', 'L_Forearm'],
    rightUpperArm: ['RightArm', 'RightUpperArm', 'upper_arm.R', 'Arm_R', 'R_UpperArm', 'R_Upperarm'],
    rightForearm: ['RightForeArm', 'RightForearm', 'lower_arm.R', 'Forearm_R', 'R_Forearm'],

    leftThigh: ['LeftUpLeg', 'LeftThigh', 'thigh.L', 'Leg_L', 'L_Thigh'],
    leftShin: ['LeftLeg', 'LeftShin', 'shin.L', 'Calf_L', 'L_Shin', 'L_Calf'],
    rightThigh: ['RightUpLeg', 'RightThigh', 'thigh.R', 'Leg_R', 'R_Thigh'],
    rightShin: ['RightLeg', 'RightShin', 'shin.R', 'Calf_R', 'R_Shin', 'R_Calf'],

    leftFoot: ['LeftFoot', 'foot.L', 'L_Foot'],
    rightFoot: ['RightFoot', 'foot.R', 'R_Foot'],
};

export class AvatarLoader {
    constructor(options = {}) {
        this.modelUrl = options.modelUrl;
        this.boneMapConfig = options.boneMap ?? DEFAULT_BONE_MAP;
        this.targetHeight = options.targetHeight ?? 2.35;
        this.normalize = options.normalize ?? true;
        this.logger = options.logger ?? console;
        this.loader = new GLTFLoader();

        this.gltf = null;
        this.root = null;
        this.skinnedMeshes = [];
        this.skeleton = null;
        this.bones = [];
        this.bonesByName = new Map();
        this.boneNameMap = {};
        this.warnedMissingRoles = new Set();
    }

    async load(modelUrl = this.modelUrl) {
        if (!modelUrl) throw new Error('AvatarLoader requires a model URL.');

        this.gltf = await this.loader.loadAsync(modelUrl);
        this.root = this.gltf.scene;
        this.collectSkeletonData();

        if (!this.skinnedMeshes.length) {
            throw new Error('No SkinnedMesh was found in the GLB. The avatar must already be rigged.');
        }

        if (this.normalize) this.normalizeAvatar(this.root);
        this.boneNameMap = this.resolveBoneNameMap(this.boneMapConfig);
        this.printBoneNames();

        return {
            gltf: this.gltf,
            root: this.root,
            skinnedMeshes: this.skinnedMeshes,
            skeleton: this.skeleton,
            bones: this.bones,
            bonesByName: this.bonesByName,
            boneNameMap: this.boneNameMap,
        };
    }

    collectSkeletonData() {
        this.root.traverse((object) => {
            if (object.isSkinnedMesh) {
                object.frustumCulled = false;
                this.skinnedMeshes.push(object);
                this.skeleton ??= object.skeleton;
                forceDoubleSided(object.material);
            }
        });

        const unique = new Map();
        this.skinnedMeshes.forEach((mesh) => {
            mesh.skeleton?.bones?.forEach((bone) => {
                if (!bone?.uuid) return;
                unique.set(bone.uuid, bone);
            });
        });

        this.bones = [...unique.values()];
        this.bonesByName = new Map(this.bones.map((bone) => [bone.name, bone]));
    }

    normalizeAvatar(root) {
        root.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const height = Math.max(size.y, 0.001);
        const scale = this.targetHeight / height;

        root.scale.multiplyScalar(scale);
        root.position.sub(center).multiplyScalar(scale);
        root.position.y -= 0.04;
        root.updateMatrixWorld(true);
    }

    resolveBoneNameMap(config = this.boneMapConfig, manualBoneMap = {}) {
        const normalizedLookup = new Map();
        this.bones.forEach((bone) => {
            normalizedLookup.set(normalizeBoneName(bone.name), bone);
        });

        const resolved = {};
        RETARGET_ROLES.forEach((role) => {
            const manualName = manualBoneMap[role];
            if (manualName === '__none__') {
                resolved[role] = null;
                return;
            }

            const aliases = manualName ? [manualName] : (config[role] ?? []);
            const bone = aliases
                .map((alias) => this.bonesByName.get(alias) ?? normalizedLookup.get(normalizeBoneName(alias)))
                .find(Boolean) ?? null;

            resolved[role] = bone ?? null;
            if (!bone) this.warnMissingBone(role, aliases);
        });

        this.boneNameMap = resolved;
        return resolved;
    }

    warnMissingBone(role, aliases) {
        if (this.warnedMissingRoles.has(role)) return;
        this.warnedMissingRoles.add(role);
        this.logger.warn?.(
            `[AvatarLoader] No existing GLB bone mapped for "${role}". Candidates: ${(aliases ?? []).join(', ') || 'none'}. This slot will be skipped.`
        );
    }

    getBoneListText() {
        return this.bones
            .map((bone, index) => {
                const pos = formatVector(bone.position);
                return `${String(index).padStart(2, '0')}  ${bone.name}  parent=${bone.parent?.name ?? 'none'}  pos=${pos}`;
            })
            .join('\n');
    }

    getBoneDebugRows() {
        return this.bones.map((bone) => ({
            name: bone.name,
            parent: bone.parent?.name ?? '',
            position: formatVector(bone.position),
            uuid: bone.uuid,
        }));
    }

    getMappingRows() {
        return Object.entries(this.boneNameMap).map(([role, bone]) => ({
            role,
            boneName: bone?.name ?? 'NOT FOUND',
        }));
    }

    printBoneNames() {
        this.logger.groupCollapsed?.('Actual GLB skeleton.bones');
        this.logger.table?.(this.getBoneDebugRows());
        this.logger.groupEnd?.();
        this.logger.table?.(this.getMappingRows());
    }
}

function normalizeBoneName(name) {
    return String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function forceDoubleSided(material) {
    if (!material) return;
    const materials = Array.isArray(material) ? material : [material];
    materials.forEach((item) => {
        item.side = THREE.DoubleSide;
        item.needsUpdate = true;
    });
}

function formatVector(vector) {
    return `${vector.x.toFixed(4)}, ${vector.y.toFixed(4)}, ${vector.z.toFixed(4)}`;
}
