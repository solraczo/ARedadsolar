import * as THREE from 'https://solraczo.github.io/solarandroid/libs/three.module.js';
import { ARButton } from 'https://solraczo.github.io/solarandroid/libs/ARButton.js';
import { GLTFLoader } from 'https://solraczo.github.io/solarandroid/libs/GLTFLoader.js';
import { RGBELoader } from 'https://solraczo.github.io/solarandroid/libs/RGBELoader.js';

let mixerGLTF;
let actionsGLTF = {};
let clock = new THREE.Clock();
let modelLoaded = false;
const animationSpeed = 0.75;
let gltfModel = null; // Guardamos el modelo sin agregarlo a la escena

// Escena, cámara y renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

// Iluminación
const light = new THREE.PointLight(0xffffff, 0.2);
light.position.set(0, 0.2, 0.2);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
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

// Cargar el modelo GLTF pero NO lo agregamos a la escena de inmediato
gltfLoader.load(
    'https://solraczo.github.io/ARedadsolar/android/models/edadsolar_13.gltf',
    (gltf) => {
        gltfModel = gltf.scene;
        gltfModel.scale.set(0.5, 0.5, 0.5);
        gltfModel.position.set(0, 0, 0);

        // Preparamos las animaciones sin agregarlas a la escena
        mixerGLTF = new THREE.AnimationMixer(gltfModel);
        gltf.animations.forEach((clip) => {
            const action = mixerGLTF.clipAction(clip);
            action.setLoop(THREE.LoopRepeat);
            action.clampWhenFinished = false;
            action.timeScale = animationSpeed;
            action.play();
            actionsGLTF[clip.name] = action;
        });

        modelLoaded = true;
        console.log('Modelo cargado, pero no agregado aún.');
    },
    (xhr) => console.log('GLTF loaded:', (xhr.loaded / xhr.total) * 100 + '%'),
    (error) => console.error('Error al cargar el modelo GLTF:', error)
);

// Verificar soporte de WebXR y configurar el botón AR
if ('xr' in navigator) {
    navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        if (supported) {
            const arButton = ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] });
            document.body.appendChild(arButton);

            arButton.addEventListener('sessionstart', () => {
                console.log("Sesión AR iniciada, agregando el modelo a la escena.");
                if (gltfModel) scene.add(gltfModel);
            });

            arButton.addEventListener('sessionend', () => {
                console.log("Sesión AR finalizada, eliminando el modelo de la escena.");
                if (gltfModel) scene.remove(gltfModel);
            });
        } else {
            alert('WebXR AR no es soportado en este dispositivo.');
        }
    }).catch((error) => {
        console.error('Error al verificar soporte de WebXR AR:', error);
    });
} else {
    alert('WebXR no está disponible en este navegador.');
}

// Animar cada frame
renderer.setAnimationLoop((timestamp, frame) => {
    const delta = clock.getDelta();
    if (mixerGLTF) mixerGLTF.update(delta * animationSpeed);
    renderer.render(scene, camera);
});
