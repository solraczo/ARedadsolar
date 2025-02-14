import * as THREE from 'https://solraczo.github.io/solarandroid/libs/three.module.js';
import { ARButton } from 'https://solraczo.github.io/solarandroid/libs/ARButton.js';
import { GLTFLoader } from 'https://solraczo.github.io/solarandroid/libs/GLTFLoader.js';
import { RGBELoader } from 'https://solraczo.github.io/solarandroid/libs/RGBELoader.js';

let mixerGLTF;
let actionsGLTF = {};
let clock = new THREE.Clock();
let modelLoaded = false;
const animationSpeed = 0.99;

// Escena, cámara y renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

// Verificar soporte de WebXR
if ('xr' in navigator) {
    navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        if (supported) {
            document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));
        } else {
            alert('WebXR AR no es soportado en este dispositivo.');
        }
    }).catch((error) => {
        console.error('Error al verificar soporte de WebXR AR:', error);
    });
} else {
    alert('WebXR no está disponible en este navegador.');
}

// Iluminación
const light = new THREE.PointLight(0xffffff, 0.15);
light.position.set(0, 0.08, 0.1);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Cargar HDRI como entorno
const rgbeLoader = new RGBELoader();
rgbeLoader.load(
    'https://solraczo.github.io/solarandroid/models/brown_photostudio_02_2k.hdr',
    (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        scene.background = null;
        console.log('HDRI cargado correctamente.');
    },
    undefined,
    (error) => console.error('Error al cargar el HDRI:', error)
);

// Cargar las texturas
const textureLoader = new THREE.TextureLoader();
const texture1 = textureLoader.load('https://solraczo.github.io/ARedadsolar/android/models/2k_sun.jpg');
const texture2 = textureLoader.load('https://solraczo.github.io/ARedadsolar/android/models/2k_sun-red.jpg');

// Shader personalizado para mezclar texturas
const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform sampler2D texture1;
    uniform sampler2D texture2;
    uniform float mixFactor;

    varying vec2 vUv;

    void main() {
        vec4 color1 = texture2D(texture1, vUv);
        vec4 color2 = texture2D(texture2, vUv);
        gl_FragColor = mix(color1, color2, mixFactor);
    }
`;

// Crear el material con el shader personalizado
const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
        texture1: { value: texture1 },
        texture2: { value: texture2 },
        mixFactor: { value: 0.0 } // Factor de mezcla (0 = textura1, 1 = textura2)
    }
});

// Cargar el modelo GLTF
const gltfLoader = new GLTFLoader();
gltfLoader.load(
    'https://solraczo.github.io/ARedadsolar/android/models/edadsolar_1.gltf',
    (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.02, 0.02, 0.02);
        model.position.set(0, 0, 0);

        // Aplicar el material personalizado a la esfera
        model.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        });

        scene.add(model);

        mixerGLTF = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => {
            const action = mixerGLTF.clipAction(clip);
            action.setLoop(THREE.LoopRepeat);
            action.clampWhenFinished = false;
            action.timeScale = animationSpeed;
            action.play();
            actionsGLTF[clip.name] = action;
        });

        modelLoaded = true;
        console.log('Animaciones GLTF disponibles y activadas en loop:', Object.keys(actionsGLTF));
    },
    (xhr) => console.log('GLTF loaded:', (xhr.loaded / xhr.total) * 100 + '%'),
    (error) => console.error('Error al cargar el modelo GLTF:', error)
);

// Variables para la animación de textura y escala
let mixFactor = 0;
let increasing = true;
let scaleFactor = 1;

// Animar cada frame
renderer.setAnimationLoop((timestamp, frame) => {
    const delta = clock.getDelta();

    // Actualizar el factor de mezcla de texturas (más lento)
    if (increasing) {
        mixFactor += 0.001; // Cambiado de 0.01 a 0.001 para una transición más lenta
        if (mixFactor >= 1.0) increasing = false;
    } else {
        mixFactor -= 0.001; // Cambiado de 0.01 a 0.001 para una transición más lenta
        if (mixFactor <= 0.0) increasing = true;
    }

    // Pasar el valor de mixFactor al shader
    material.uniforms.mixFactor.value = mixFactor;

    // Actualizar la escala de la esfera
    scaleFactor += 0.01;
    if (scaleFactor > 5) scaleFactor = 1;

    // Aplicar la escala al modelo
    if (modelLoaded) {
        scene.traverse((child) => {
            if (child.isMesh) {
                child.scale.set(scaleFactor, scaleFactor, scaleFactor);
            }
        });
    }

    // Actualizar animaciones GLTF
    if (mixerGLTF) mixerGLTF.update(delta * animationSpeed);

    // Renderizar la escena
    renderer.render(scene, camera);
});
