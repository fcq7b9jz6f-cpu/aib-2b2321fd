import * as THREE from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';

// --- BASIC SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('webgl-canvas'),
    antialias: true,
    alpha: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// --- CURSOR FISH (METABALLS) ---
const resolution = 28;
const material = new THREE.MeshStandardMaterial({ 
    color: 0xFF5F3C, 
    roughness: 0.4,
    metalness: 0.1
});

const effect = new MarchingCubes(resolution, material, true, true, 100000);
effect.position.set(0, 0, 0);
effect.scale.set(1, 1, 1);
scene.add(effect);

// Metaball setup
const numBlobs = 4;
const blobs = [];
for (let i = 0; i < numBlobs; i++) {
    blobs.push({
        pos: new THREE.Vector3(),
        strength: 0.2 + Math.random() * 0.2,
        subtract: 12
    });
}

// Mouse tracking
const mouse = new THREE.Vector2();
const target = new THREE.Vector2();
const windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);

document.addEventListener('mousemove', (event) => {
    target.x = (event.clientX - windowHalf.x) * 0.005;
    target.y = (event.clientY - windowHalf.y) * 0.005;
});

// --- BUBBLE PARTICLES ---
const particleCount = 200;
const particles = new THREE.BufferGeometry();
const pPositions = new Float32Array(particleCount * 3);
const pVelocities = [];

for (let i = 0; i < particleCount; i++) {
    pPositions[i * 3] = 0;
    pPositions[i * 3 + 1] = 0;
    pPositions[i * 3 + 2] = 0;
    pVelocities.push({ 
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.02, Math.random() * 0.05 + 0.02, (Math.random() - 0.5) * 0.02),
        life: 0
    });
}

particles.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
const particleMaterial = new THREE.PointsMaterial({ 
    color: 0xD1C7BC, 
    size: 0.05,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.7
});
const particleSystem = new THREE.Points(particles, particleMaterial);
scene.add(particleSystem);

let lastScrollY = 0;
let scrollDelta = 0;

export function onScroll(scrollY) {
    scrollDelta += Math.abs(scrollY - lastScrollY) * 0.00005;
    lastScrollY = scrollY;
}

function emitParticle(x, y, z) {
    for (let i = 0; i < particleCount; i++) {
        if (pVelocities[i].life <= 0) {
            const positions = particleSystem.geometry.attributes.position.array;
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            pVelocities[i].life = Math.random() * 50 + 50;
            pVelocities[i].velocity.set((Math.random() - 0.5) * 0.02, Math.random() * 0.05 + 0.02, (Math.random() - 0.5) * 0.02);
            return;
        }
    }
}

// --- ANIMATION LOOP ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // Lerp mouse position for smooth follow
    const damp = 0.08;
    mouse.x += (target.x - mouse.x) * damp;
    mouse.y += (target.y - mouse.y) * damp;

    // Animate metaballs (the fish)
    effect.reset();
    const fishBasePos = new THREE.Vector3(mouse.x, -mouse.y, 0);

    blobs[0].pos.copy(fishBasePos);

    // Tail movement
    blobs[1].pos.set(
        fishBasePos.x - 0.3 + Math.sin(time * 3) * 0.1,
        fishBasePos.y + Math.cos(time * 4) * 0.05,
        fishBasePos.z
    );
     blobs[2].pos.set(
        fishBasePos.x - 0.6 + Math.sin(time * 2.5) * 0.15,
        fishBasePos.y,
        fishBasePos.z
    );
    blobs[3].pos.set(
        fishBasePos.x - 0.9 + Math.sin(time * 2) * 0.2,
        fishBasePos.y,
        fishBasePos.z
    );
    
    for (let i = 0; i < numBlobs; i++) {
        const b = blobs[i];
        effect.addBall(b.pos, b.strength, b.subtract);
    }

    // Emit particles on scroll
    if (scrollDelta > 0.001) {
        emitParticle(fishBasePos.x, fishBasePos.y, fishBasePos.z - 0.2);
        scrollDelta *= 0.95;
    }

    // Update particles
    const positions = particleSystem.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
        if (pVelocities[i].life > 0) {
            positions[i * 3] += pVelocities[i].velocity.x;
            positions[i * 3 + 1] += pVelocities[i].velocity.y;
            positions[i * 3 + 2] += pVelocities[i].velocity.z;
            pVelocities[i].life -= 1;
            if (pVelocities[i].life <= 0) {
                 positions[i * 3 + 1] = -1000; // Hide particle
            }
        }
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
}

// --- RESIZE HANDLER ---
function onWindowResize() {
    windowHalf.set(window.innerWidth / 2, window.innerHeight / 2);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

// Start animation
animate();
