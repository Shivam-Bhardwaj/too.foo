import * as THREE from "three";
import { basisFromApex, ECLIPTIC_TILT } from "./apex";

type Direction = 1 | -1;

export type SceneAPI = {
  canvas: HTMLCanvasElement;
  update: (normTime: number, direction: Direction, motionEnabled: boolean) => void;
  resize: (w: number, h: number) => void;
  dispose: () => void;
};

export function createScene(canvas: HTMLCanvasElement): SceneAPI {
  // Renderer / Scene / Camera
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0f1a);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 3000);
  camera.position.set(0, 2.2, 10);
  camera.lookAt(0, 0, 0);

  // ===== Fixed apex basis (screen +X = upwind/apex) =====
  const apexBasis = basisFromApex(); // columns are (x=apex, y=up, z=depth)

  // ===== Starfield (fixed in the interstellar frame) =====
  const starMat = new THREE.PointsMaterial({ size: 0.015, transparent: true, opacity: 0.9 });
  const starGeo = new THREE.BufferGeometry();
  {
    const N = 6000;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      // distance shells: 120..400
      const r = 120 + Math.pow(Math.random(), 0.7) * 280;
      const u = Math.random() * 2 * Math.PI;
      const v = Math.acos(2 * Math.random() - 1);
      const p = new THREE.Vector3(
        r * Math.sin(v) * Math.cos(u),
        r * Math.sin(v) * Math.sin(u),
        r * Math.cos(v)
      ).applyMatrix4(apexBasis); // oriented so +X is apex
      pos[i * 3 + 0] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  }
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // ===== Heliosphere (FIXED, oriented, does NOT move) =====
  const helio = (() => {
    const g = new THREE.SphereGeometry(3.6, 64, 64);
    // Anisotropy: slightly blunted nose toward +X (apex)
    g.scale(0.82, 1.08, 1.10);
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x10273b),
      emissive: new THREE.Color(0x091724),
      transmission: 1,
      thickness: 0.3,
      roughness: 0.95,
      transparent: true,
      opacity: 0.40
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.setRotationFromMatrix(apexBasis); // nose → +X
    scene.add(mesh);
    return mesh;
  })();

  // ===== Solar system (MOVES sideways through heliosphere) =====
  const sol = new THREE.Group(); // this group will translate along +X
  scene.add(sol);

  // Sun
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xfff2cc })
  );
  sol.add(sun);

  // Ambient + key light for planets
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  const key = new THREE.DirectionalLight(0xffffff, 0.6);
  key.position.set(2, 2, 2);
  scene.add(key);

  // Orbits (thin), tilted by ecliptic
  function makeOrbit(radius: number) {
    const pts = 256;
    const geom = new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: pts }, (_, i) => {
        const t = (i / pts) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(t) * radius, 0, Math.sin(t) * radius);
      })
    );
    const line = new THREE.LineLoop(
      geom,
      new THREE.LineBasicMaterial({ color: 0x80d8ff, transparent: true, opacity: 0.07 })
    );
    line.rotation.z = ECLIPTIC_TILT;
    sol.add(line);
    return line;
  }

  // Simple circular "not to scale" radii (in scene units)
  const PLANET_RADII = {
    Mercury: 0.75,
    Venus: 1.2,
    Earth: 1.6,
    Mars: 2.0,
    Jupiter: 2.8,
    Saturn: 3.4,
    Uranus: 3.9,
    Neptune: 4.4
  } as const;

  // Orbital periods in Earth years (for relative angular speeds)
  const PERIOD_Y = {
    Mercury: 0.241,
    Venus: 0.615,
    Earth: 1.0,
    Mars: 1.881,
    Jupiter: 11.86,
    Saturn: 29.46,
    Uranus: 84.01,
    Neptune: 164.8
  } as const;

  // Create planets + orbits
  const planetMeshes: Record<string, THREE.Mesh> = {};
  Object.entries(PLANET_RADII).forEach(([name, R]) => {
    makeOrbit(R);
    const color =
      name === "Mars" ? 0xd36b4d :
      name === "Venus" ? 0xe6d8b0 :
      name === "Jupiter" ? 0xd9c3a5 :
      name === "Saturn" ? 0xd8c7a6 :
      name === "Uranus" ? 0x9fd4e8 :
      name === "Neptune" ? 0x88a6f2 :
      name === "Mercury" ? 0xbfb7ae :
      0x7fbfff; // Earth
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(name === "Jupiter" ? 0.12 : name === "Saturn" ? 0.11 : 0.08, 16, 16),
      new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: 0.95 })
    );
    mesh.userData.radius = R;
    mesh.userData.period = PERIOD_Y[name as keyof typeof PERIOD_Y];
    mesh.rotation.z = ECLIPTIC_TILT;
    sol.add(mesh);
    planetMeshes[name] = mesh;
  });

  // ==== Animation state ====
  let logicalTime = 0.5;     // Earth phase default = 0.5 (π radians)
  let driftX = 0;            // solar-system sideways drift inside fixed heliosphere
  let starDriftX = 0;        // starfield drift accumulator for parallax
  let direction: Direction = 1;
  let motionEnabled = true;
  
  const STAR_DRIFT_SPEED = 0.0015;  // subtle parallax; tune to taste
  const SOLAR_DRIFT_SPEED = 0.008;  // faster than before (was 0.004)

  // Helpers
  const Z_AXIS = new THREE.Vector3(0, 0, 1);

  function placePlanets(tNorm: number) {
    // tNorm is "Earth years" normalized to [0..1]; Earth theta = 2π tNorm
    Object.entries(planetMeshes).forEach(([name, mesh]) => {
      const R = mesh.userData.radius as number;
      const period = mesh.userData.period as number;
      const theta = (tNorm / period) * Math.PI * 2; // ω = 2π / period
      // base ecliptic (x,0,z), then tilt
      mesh.position.set(Math.cos(theta) * R, 0, Math.sin(theta) * R);
      mesh.position.applyAxisAngle(Z_AXIS, ECLIPTIC_TILT);
    });
  }

  function update(normTime: number, dir: Direction, enableMotion: boolean) {
    direction = dir;
    motionEnabled = enableMotion;

    // ease logical time toward target (keeps scrub smooth)
    const alpha = 0.15;
    logicalTime = logicalTime + (normTime - logicalTime) * alpha;

    // Planet placement
    placePlanets(logicalTime);

    // Sideways drift of the solar system and stars (for parallax effect)
    if (motionEnabled) {
      driftX += SOLAR_DRIFT_SPEED * direction;  // faster solar drift
      starDriftX += STAR_DRIFT_SPEED * direction;  // subtle star drift
    }
    
    // Solar system moves
    sol.position.set(driftX, 0, 0);
    
    // Stars drift opposite direction for cinematic parallax
    // (heliosphere stays fixed as the reference frame)
    stars.position.set(-starDriftX, 0, 0);

    renderer.render(scene, camera);
  }

  function resize(w: number, h: number) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function dispose() {
    renderer.dispose();
    starGeo.dispose();
    starMat.dispose();
  }

  return { canvas, update, resize, dispose };
}