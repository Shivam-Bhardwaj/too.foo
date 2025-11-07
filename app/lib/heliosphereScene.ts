import * as THREE from 'three';
import { basisFromApex, ECLIPTIC_TILT } from './apex';

type Direction = 1 | -1;

export type SceneAPI = {
  el: HTMLCanvasElement;
  update(normTime: number, direction: Direction, motionEnabled: boolean): void;
  resize(w: number, h: number): void;
  dispose(): void;
};

export function createScene(canvas: HTMLCanvasElement): SceneAPI {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0f1a);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2000);
  camera.position.set(0, 2.2, 9);
  camera.lookAt(0, 0, 0);

  const resize = (w: number, h: number) => {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const initialWidth = canvas.clientWidth || canvas.width || 800;
  const initialHeight = canvas.clientHeight || canvas.height || 600;
  resize(initialWidth, initialHeight);

  const apexBasis = basisFromApex();

  // ---- Starfield ---------------------------------------------------------
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({
    size: 0.015,
    transparent: true,
    opacity: 0.9,
    color: 0x99e6ff,
  });

  const starCount = 5000;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const dBin = Math.random();
    const r = 80 + 220 * dBin * dBin; // 80..300-ish, biased to nearer

    const u = Math.random() * 2 * Math.PI;
    const v = Math.acos(2 * Math.random() - 1);

    const x = r * Math.sin(v) * Math.cos(u);
    const y = r * Math.sin(v) * Math.sin(u);
    const z = r * Math.cos(v);

    const pos = new THREE.Vector3(x, y, z).applyMatrix4(apexBasis);
    starPositions[i * 3 + 0] = pos.x;
    starPositions[i * 3 + 1] = pos.y;
    starPositions[i * 3 + 2] = pos.z;
  }
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // ---- Heliosphere + Sun -------------------------------------------------
  const helioGeometry = new THREE.SphereGeometry(3.2, 48, 48);
  helioGeometry.scale(0.85, 1.05, 1.1); // blunt upwind (+X)

  const helioMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x133e5b),
    emissive: new THREE.Color(0x0a1a28),
    transmission: 1,
    thickness: 0.25,
    roughness: 0.9,
    transparent: true,
    opacity: 0.35,
  });

  const heliosphere = new THREE.Mesh(helioGeometry, helioMaterial);
  heliosphere.setRotationFromMatrix(apexBasis);
  scene.add(heliosphere);

  const sunGeometry = new THREE.SphereGeometry(0.45, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfff2cc });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);

  // ---- Orbit & Earth -----------------------------------------------------
  const orbitPoints: THREE.Vector3[] = new Array(256).fill(0).map((_, i) => {
    const t = (i / 256) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(t) * 3, 0, Math.sin(t) * 3);
  });

  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  const orbitMaterial = new THREE.LineBasicMaterial({
    color: 0x80d8ff,
    transparent: true,
    opacity: 0.08,
  });
  const orbit = new THREE.LineLoop(orbitGeometry, orbitMaterial);
  orbit.rotation.z = ECLIPTIC_TILT;
  scene.add(orbit);

  const earthGeometry = new THREE.SphereGeometry(0.08, 16, 16);
  const earthMaterial = new THREE.MeshStandardMaterial({
    color: 0x7fbfff,
    metalness: 0,
    roughness: 0.9,
  });
  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  earth.rotation.z = ECLIPTIC_TILT;
  scene.add(earth);

  // ---- Lighting ----------------------------------------------------------
  const ambient = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.6);
  keyLight.position.set(2, 2, 2);
  scene.add(keyLight);

  // ---- Animation state ---------------------------------------------------
  let tLogical = 0.5; // Earth phase defaults to half orbit
  let driftX = 0;

  const driftVector = new THREE.Vector3();
  const earthBase = new THREE.Vector3();
  const eclipticAxis = new THREE.Vector3(0, 0, 1);

  const update = (normTime: number, direction: Direction, motionEnabled: boolean) => {
    // Ease logical time toward the requested normalized time.
    const alpha = 0.15;
    tLogical += (normTime - tLogical) * alpha;

    // Earth position on ecliptic (radius ~3, illustrative, not to scale)
    const theta = tLogical * Math.PI * 2;
    earthBase.set(Math.cos(theta) * 3, 0, Math.sin(theta) * 3);
    earthBase.applyAxisAngle(eclipticAxis, ECLIPTIC_TILT);

    if (motionEnabled) {
      driftX += 0.004 * direction; // slow sideways drift along +X (apex)
    }

    driftVector.set(driftX, 0, 0);
    sun.position.copy(driftVector);
    heliosphere.position.copy(driftVector);
    orbit.position.copy(driftVector);
    earth.position.copy(earthBase).add(driftVector);

    renderer.render(scene, camera);
  };

  const dispose = () => {
    renderer.dispose();
    starGeometry.dispose();
    starMaterial.dispose();
    helioGeometry.dispose();
    helioMaterial.dispose();
    sunGeometry.dispose();
    sunMaterial.dispose();
    orbitGeometry.dispose();
    orbitMaterial.dispose();
    earthGeometry.dispose();
    earthMaterial.dispose();
  };

  // Seed initial frame with Earth at phase 0.5 and no drift.
  update(tLogical, 1, false);

  return {
    el: canvas,
    update,
    resize,
    dispose,
  };
}

