import * as THREE from 'https://solraczo.github.io/solarandroid/libs/three.module.js';
import { ARButton } from 'https://solraczo.github.io/solarandroid/libs/ARButton.js';
import { GLTFLoader } from 'https://solraczo.github.io/solarandroid/libs/GLTFLoader.js';
import { RGBELoader } from 'https://solraczo.github.io/solarandroid/libs/RGBELoader.js';

// Variables globales
let mixerGLTF;
let clock = new THREE.Clock();
const animationSpeed = 0.5;

// Escena, cámara y renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.setClearColor(0x000000, 0); // Fondo transparente
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

// Verificar soporte de WebXR AR
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

// Cargar el modelo GLTF y activar animaciones
const gltfLoader = new GLTFLoader();
gltfLoader.load(
    'https://solraczo.github.io/ARedadsolar/android/models/edadsolar_6.gltf',
    (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.5, 0.5, 0.5);
        model.position.set(0, 0, 0);
        scene.add(model);

        // Configurar el mixer para las animaciones
        mixerGLTF = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => {
            const action = mixerGLTF.clipAction(clip);
            action.setLoop(THREE.LoopRepeat); // Repetir en bucle
            action.clampWhenFinished = false;
            action.timeScale = animationSpeed; // Velocidad de la animación
            action.play();
        });

        console.log('Modelo GLTF cargado y animaciones activadas.');
    },
    (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% cargado'),
    (error) => console.error('Error al cargar el modelo GLTF:', error)
);

// Función de animación
const animate = () => {
    if (mixerGLTF) {
        const delta = clock.getDelta();
        mixerGLTF.update(delta * animationSpeed); // Actualizar animaciones
    }
    renderer.render(scene, camera);
};

// Configurar el bucle de renderizado para WebXR
renderer.setAnimationLoop(animate);
