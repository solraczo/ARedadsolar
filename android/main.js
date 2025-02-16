import * as THREE from 'https://solraczo.github.io/solarandroid/libs/three.module.js';
import { ARButton } from 'https://solraczo.github.io/solarandroid/libs/ARButton.js';
import { GLTFLoader } from 'https://solraczo.github.io/solarandroid/libs/GLTFLoader.js';
import { RGBELoader } from 'https://solraczo.github.io/solarandroid/libs/RGBELoader.js';

let mixerGLTF, model, hitTestSource = null, hitTestSourceRequested = false;
let reticle;
let modelPlaced = false; // 🔥 Controla que el modelo solo se coloque una vez
let clock = new THREE.Clock();
const animationSpeed = 0.75;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

// Botón AR
document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

// Iluminación
const light = new THREE.PointLight(0xffffff, 0.2);
light.position.set(0, 0.2, 0.2);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

// Cargar HDRI
new RGBELoader().load('https://solraczo.github.io/solarandroid/models/brown_photostudio_02_2k.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = null;
});

// Cargar el modelo GLTF
const gltfLoader = new GLTFLoader();
gltfLoader.load('https://solraczo.github.io/ARedadsolar/android/models/edadsolar_13.gltf', (gltf) => {
    model = gltf.scene;
    model.scale.set(1, 1, 1);
    model.visible = false;
    scene.add(model);

    // Animaciones
    mixerGLTF = new THREE.AnimationMixer(model);
    gltf.animations.forEach((clip) => {
        const action = mixerGLTF.clipAction(clip);
        action.setLoop(THREE.LoopRepeat);
        action.timeScale = animationSpeed;
        action.play();
    });

    console.log("✅ Modelo 3D cargado correctamente.");
});

// Retículo más pequeño y más tenue
const reticleGeometry = new THREE.RingGeometry(0.05, 0.08, 32);
reticleGeometry.rotateX(-Math.PI / 2);
const reticleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, opacity: 0.5, transparent: true });
reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
reticle.visible = false;
scene.add(reticle);

// Detectar el hit test en la sesión AR
renderer.xr.addEventListener('sessionstart', () => {
    hitTestSourceRequested = true;
    const session = renderer.xr.getSession();
    session.requestReferenceSpace('viewer').then((referenceSpace) => {
        session.requestHitTestSource({ space: referenceSpace }).then((source) => {
            hitTestSource = source;
        });
    });

    session.addEventListener('end', () => {
        hitTestSourceRequested = false;
        hitTestSource = null;
        reticle.visible = false;
    });
});

// Colocar el modelo en la superficie detectada al tocar la pantalla (SOLO UNA VEZ)
window.addEventListener('click', () => {
    if (!modelPlaced && reticle.visible && model) {
        model.position.set(reticle.position.x, reticle.position.y, reticle.position.z);
        model.visible = true;
        modelPlaced = true; // 🔥 Bloquear futuros movimientos
        reticle.visible = false; // 🔥 Ocultar el retículo

        // 🔥 Desactivar el hit test después de colocar el modelo
        hitTestSourceRequested = false;
        hitTestSource = null;

        console.log("📌 Modelo colocado en:", model.position);
    }
});

// Animación y hit testing en cada frame
renderer.setAnimationLoop(() => {
    const delta = clock.getDelta();
    if (mixerGLTF) mixerGLTF.update(delta * animationSpeed);

    if (!modelPlaced && renderer.xr.getSession() && hitTestSource) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        renderer.xr.getSession().requestAnimationFrame((_, frame) => {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const pose = hit.getPose(referenceSpace);
                reticle.visible = true;
                reticle.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
            } else {
                reticle.visible = false;
            }
        });
    }

    renderer.render(scene, camera);
});
