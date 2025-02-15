<!DOCTYPE html>
<html>
  <head>
    <script src="https://aframe.io/releases/1.2.0/aframe.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/aframe-animation-component@5.1.2/dist/aframe-animation-component.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/aframe-extras@6.1.1/dist/aframe-extras.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/aframe-environment-component@1.1.0/dist/aframe-environment-component.min.js"></script>
  </head>
  <body>
    <a-scene
      vr-mode-ui="enabled: false"
      renderer="colorManagement: true; alpha: true;"
      arjs="sourceType: webcam; debugUIEnabled: false;"
    >
      <!-- Cargar el modelo GLTF -->
      <a-entity
        gltf-model="https://solraczo.github.io/ARedadsolar/android/models/edadsolar_5.gltf"
        scale="0.5 0.5 0.5"
        position="0 0 0"
        animation-mixer="loop: repeat"
      ></a-entity>

      <!-- Configurar el entorno HDRI -->
      <a-entity
        environment="preset: none; lighting: none; background: none;"
        light="type: ambient; color: #FFFFFF; intensity: 1"
      ></a-entity>

      <!-- Configurar la cámara AR -->
      <a-entity camera></a-entity>
    </a-scene>
  </body>
</html>
