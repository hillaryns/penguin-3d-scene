
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';

const mount = document.querySelector('#scene');
const loaderScreen = document.querySelector('#loader');

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x10080d, 0.032);

const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
camera.position.set(0, 0.35, 8.4);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
mount.appendChild(renderer.domElement);

// Lighting
scene.add(new THREE.HemisphereLight(0xffe9e9, 0x292027, 2.0));

const moonLight = new THREE.DirectionalLight(0xffe7e7, 3.0);
moonLight.position.set(-4, 7, 5);
scene.add(moonLight);

const warmLight = new THREE.PointLight(0xff4b5f, 42, 16);
warmLight.position.set(3, 1.8, 4);
scene.add(warmLight);

const rimLight = new THREE.PointLight(0xc8d9ee, 38, 18);
rimLight.position.set(-4, 1, -3);
scene.add(rimLight);

// Moon
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(0.82, 48, 48),
  new THREE.MeshStandardMaterial({
    color: 0xf0dfe2,
    roughness: 1,
    emissive: 0x40212a,
    emissiveIntensity: 0.22
  })
);

moon.position.set(2.65, 2.35, -3.5);
scene.add(moon);

const moonGlow = new THREE.Mesh(
  new THREE.SphereGeometry(1.08, 32, 32),
  new THREE.MeshBasicMaterial({
    color: 0xe7aeb6,
    transparent: true,
    opacity: 0.075,
    side: THREE.BackSide
  })
);

moon.add(moonGlow);

// Stars
const starCount = 180;
const starPositions = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
  starPositions[i * 3] = (Math.random() - 0.5) * 15;
  starPositions[i * 3 + 1] = (Math.random() - 0.5) * 9;
  starPositions[i * 3 + 2] = -2 - Math.random() * 7;
}

const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute(
  'position',
  new THREE.BufferAttribute(starPositions, 3)
);

scene.add(
  new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({
      color: 0xffe8ec,
      size: 0.025,
      transparent: true,
      opacity: 0.8
    })
  )
);

// Snowy platform
const platform = new THREE.Group();
scene.add(platform);

const rock = new THREE.Mesh(
  new THREE.CylinderGeometry(1.65, 1.82, 0.48, 64),
  new THREE.MeshStandardMaterial({
    color: 0x252027,
    roughness: 0.92
  })
);

rock.position.y = -1.75;
platform.add(rock);

const snowCap = new THREE.Mesh(
  new THREE.CylinderGeometry(1.68, 1.7, 0.12, 64),
  new THREE.MeshStandardMaterial({
    color: 0xf3e8e8,
    roughness: 0.96
  })
);

snowCap.position.y = -1.48;
platform.add(snowCap);

const snowTop = new THREE.Mesh(
  new THREE.CircleGeometry(1.66, 64),
  new THREE.MeshStandardMaterial({
    color: 0xfff7f5,
    roughness: 1,
    side: THREE.DoubleSide
  })
);

snowTop.rotation.x = -Math.PI / 2;
snowTop.position.y = -1.415;
platform.add(snowTop);

// Penguin model
const penguinPivot = new THREE.Group();
scene.add(penguinPivot);

let penguinModel = null;

// IMPORTANT: This works both locally and on GitHub Pages.
const modelUrl = `${import.meta.env.BASE_URL}models/penguin.glb`;

const loader = new GLTFLoader();

loader.load(
  modelUrl,

  (gltf) => {
    penguinModel = gltf.scene;

    penguinModel.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(penguinModel);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    bounds.getSize(size);
    bounds.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 3.25 / maxDim;

    penguinModel.scale.setScalar(scale);
    penguinModel.position.sub(center.multiplyScalar(scale));

    // Place the penguin's feet on the snowy platform.
    const fitted = new THREE.Box3().setFromObject(penguinModel);
    penguinModel.position.y += -1.40 - fitted.min.y;

    penguinPivot.add(penguinModel);

    loaderScreen.classList.add('fade-out');
    setTimeout(() => loaderScreen.remove(), 800);

    console.log('Penguin loaded successfully:', modelUrl);
  },

  (progress) => {
    if (progress.total > 0) {
      console.log(
        `Loading penguin: ${Math.round(
          (progress.loaded / progress.total) * 100
        )}%`
      );
    }
  },

  (error) => {
    console.error('Penguin model failed to load:', modelUrl, error);

    loaderScreen.innerHTML =
      '<span></span> MODEL FAILED TO LOAD — CHECK THE CONSOLE';
  }
);

// Orbital rings
const orbit = new THREE.Group();
scene.add(orbit);

const ringMaterials = [
  new THREE.MeshStandardMaterial({
    color: 0xd83b50,
    emissive: 0x7a1023,
    emissiveIntensity: 0.85,
    metalness: 0.55,
    roughness: 0.3
  }),

  new THREE.MeshStandardMaterial({
    color: 0xf4e9e8,
    emissive: 0x6b343b,
    emissiveIntensity: 0.35,
    metalness: 0.35,
    roughness: 0.32
  })
];

for (let i = 0; i < 3; i++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.0 + i * 0.24, 0.012, 8, 180),
    ringMaterials[i % 2]
  );

  ring.rotation.x = Math.PI / 2.5 + i * 0.19;
  ring.rotation.y = i * 0.72;

  orbit.add(ring);
}

for (let i = 0; i < 6; i++) {
  const bead = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 16, 16),
    new THREE.MeshBasicMaterial({
      color: i % 2 ? 0xffe9e9 : 0xff596b
    })
  );

  const a = (i / 6) * Math.PI * 2;

  bead.position.set(
    Math.cos(a) * 2.45,
    Math.sin(a) * 0.52,
    Math.sin(a) * 1.25
  );

  orbit.add(bead);
}

// Falling snow
const snowCount = 1700;
const snowPositions = new Float32Array(snowCount * 3);
const snowSpeeds = new Float32Array(snowCount);

for (let i = 0; i < snowCount; i++) {
  snowPositions[i * 3] = (Math.random() - 0.5) * 12;
  snowPositions[i * 3 + 1] = Math.random() * 9 - 3;
  snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 8;

  snowSpeeds[i] = 0.45 + Math.random() * 1.15;
}

const snowGeo = new THREE.BufferGeometry();

snowGeo.setAttribute(
  'position',
  new THREE.BufferAttribute(snowPositions, 3)
);

const snow = new THREE.Points(
  snowGeo,
  new THREE.PointsMaterial({
    color: 0xf2f7ff,
    size: 0.035,
    transparent: true,
    opacity: 0.82,
    depthWrite: false
  })
);

scene.add(snow);

// Floor glow
const floorGlow = new THREE.Mesh(
  new THREE.CircleGeometry(2.5, 64),
  new THREE.MeshBasicMaterial({
    color: 0xc94759,
    transparent: true,
    opacity: 0.10,
    side: THREE.DoubleSide
  })
);

floorGlow.rotation.x = -Math.PI / 2;
floorGlow.position.y = -1.39;
scene.add(floorGlow);

// Mouse controls
let pointerX = 0;
let pointerY = 0;
let targetX = 0;
let targetY = 0;

let dragging = false;
let lastX = 0;
let lastY = 0;

const canvas = renderer.domElement;

canvas.addEventListener('pointerdown', (e) => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;

  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  if (dragging) {
    targetY += (e.clientX - lastX) * 0.008;
    targetX += (e.clientY - lastY) * 0.006;

    targetX = THREE.MathUtils.clamp(targetX, -0.35, 0.35);

    lastX = e.clientX;
    lastY = e.clientY;
  }

  const rect = mount.getBoundingClientRect();

  pointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
  pointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
});

canvas.addEventListener('pointerup', () => dragging = false);
canvas.addEventListener('pointercancel', () => dragging = false);

canvas.addEventListener(
  'wheel',
  (e) => {
    camera.position.z = THREE.MathUtils.clamp(
      camera.position.z + e.deltaY * 0.004,
      6.2,
      11
    );
  },
  { passive: true }
);

// Resize
const clock = new THREE.Clock();

function resize() {
  const width = mount.clientWidth || 1;
  const height = mount.clientHeight || 1;

  renderer.setSize(width, height, false);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
resize();

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  const t = clock.getElapsedTime();
  const autoTurn = t * 0.16;

  // Slow automatic rotation, with manual drag control.
  penguinPivot.rotation.y +=
    (targetY + autoTurn - penguinPivot.rotation.y) * 0.045;

  penguinPivot.rotation.x +=
    (targetX - penguinPivot.rotation.x) * 0.045;

  // Gentle floating movement.
  penguinPivot.position.y = Math.sin(t * 1.1) * 0.035;

  // Orbital movement.
  orbit.rotation.y = t * 0.13;
  orbit.rotation.z = Math.sin(t * 0.22) * 0.035;

  moon.rotation.y = t * 0.025;

  // Snow movement.
  const positions = snowGeo.attributes.position.array;

  for (let i = 0; i < snowCount; i++) {
    const idx = i * 3;

    positions[idx + 1] -= snowSpeeds[i] * 0.012;
    positions[idx] += Math.sin(t * 0.6 + i) * 0.0018;

    if (positions[idx + 1] < -2.1) {
      positions[idx + 1] = 5.8 + Math.random() * 2;
      positions[idx] = (Math.random() - 0.5) * 12;
    }
  }

  snowGeo.attributes.position.needsUpdate = true;

  // Subtle camera parallax.
  camera.position.x += (pointerX * 0.16 - camera.position.x) * 0.018;
  camera.position.y += (0.35 - pointerY * 0.12 - camera.position.y) * 0.018;

  camera.lookAt(0, 0.05, 0);

  renderer.render(scene, camera);
}

animate();
