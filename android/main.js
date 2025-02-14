import * as THREE from 'https://solraczo.github.io/solarandroid/libs/three.module.js';
import { ARButton } from 'https://solraczo.github.io/solarandroid/libs/ARButton.js';
import { GLTFLoader } from 'https://solraczo.github.io/solarandroid/libs/GLTFLoader.js';
import { RGBELoader } from 'https://solraczo.github.io/solarandroid/libs/RGBELoader.js';

let mixerGLTF;
let actionsGLTF = {};
let clock = new THREE.Clock();
let model;
let modelLoaded = false;
const animationSpeed = 0.2;
const animationDuration = 10000; // Duración más larga para mayor suavidad

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

const light = new THREE.PointLight(0xffffff, 0.15);
light.position.set(0, 0.08, 0.1);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const rgbeLoader = new RGBELoader();
rgbeLoader.load(
    'https://solraczo.github.io/solarandroid/models/brown_photostudio_02_2k.hdr',
    (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
    }
);

const textureLoader = new THREE.TextureLoader();
const texture1 = textureLoader.load('https://solraczo.github.io/ARedadsolar/android/models/2k_sun.jpg');
const texture2 = textureLoader.load('https://solraczo.github.io/ARedadsolar/android/models/2k_sun-red.jpg');

const material = new THREE.ShaderMaterial({
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D texture1;
        uniform sampler2D texture2;
        uniform float mixFactor;
        varying vec2 vUv;
        void main() {
            vec4 color1 = texture2D(texture1, vUv);
            vec4 color2 = texture2D(texture2, vUv);
            gl_FragColor = mix(color1, color2, mixFactor);
        }
    `,
    uniforms: {
        texture1: { value: texture1 },
        texture2: { value: texture2 },
        mixFactor: { value: 0.0 }
    }
});

const gltfLoader = new GLTFLoader();
gltfLoader.load(
    'https://solraczo.github.io/ARedadsolar/android/models/edadsolar_1.gltf',
    (gltf) => {
        model = gltf.scene;
        model.scale.set(0.005, 0.005, 0.005);
        model.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        });
        scene.add(model);

        mixerGLTF = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => {
            const action = mixerGLTF.clipAction(clip);
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            actionsGLTF[clip.name] = action;
        });

        modelLoaded = true;
        startAnimationLoop();
    }
);

function startAnimationLoop() {
    if (!model) return;
    model.visible = true;
    for (let action of Object.values(actionsGLTF)) {
        action.reset().play();
    }
    setTimeout(() => {
        model.visible = false;
        setTimeout(startAnimationLoop, animationDuration);
    }, animationDuration);
}

let mixFactor = 0;
let increasing = true;
let scaleFactor = 0.005;

renderer.setAnimationLoop(() => {
    if (!modelLoaded) return;

    mixFactor += increasing ? 0.0004 : -0.0004;
    if (mixFactor >= 1.0 || mixFactor <= 0.0) increasing = !increasing;
    material.uniforms.mixFactor.value = mixFactor;

    scaleFactor += increasing ? 0.0005 : -0.0005;
    if (scaleFactor >= 0.02 || scaleFactor <= 0.005) increasing = !increasing;
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);

    if (mixerGLTF) mixerGLTF.update(clock.getDelta() * animationSpeed);
    renderer.render(scene, camera);
});
