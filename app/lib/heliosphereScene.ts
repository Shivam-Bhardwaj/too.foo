import * as THREE from 'three';
import { APEX_DIR, ECLIPTIC_TILT } from './apex';

type Direction = 1 | -1;

export type SceneAPI = {
  el: HTMLCanvasElement;
  dispose(): void;
  update(normTime: number, direction: Direction, motionEnabled: boolean): void;
  resize(w: number, h: number): void;
};

function sampleMagnitude(): number {
  const u = Math.random();
  return Math.pow(u, 1.8);
}

function tempBinToRGB(bin: 0 | 1 | 2 | 3): [number, number, number] {
  switch (bin) {
    case 0:
      return [0.78, 0.86, 1.0]; // hot blue-white
    case 1:
      return [0.94, 0.97, 1.0]; // white
    case 2:
      return [1.0, 0.97, 0.89]; // yellow-white
    default:
      return [1.0, 0.9, 0.78]; // warm amber
  }
}

// Simple 3D noise function
function snoise(p: THREE.Vector3): number {
  const x = Math.sin(p.x * 12.9898 + p.y * 78.233 + p.z * 45.164) * 43758.5453;
  return (x - Math.floor(x)) * 2.0 - 1.0;
}

export function createScene(canvas: HTMLCanvasElement): SceneAPI {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0f1a);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  // Get actual canvas dimensions
  const width = canvas.clientWidth || canvas.width || 800;
  const height = canvas.clientHeight || canvas.height || 600;
  renderer.setSize(width, height);

  const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
  camera.position.set(0, 0, 15);
  camera.lookAt(0, 0, 0);

  // Starfield
  const starCount = 5000;
  const starGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const distBins = new Float32Array(starCount);
  const magnitudes = new Float32Array(starCount);

  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const r = 20 + Math.random() * 180;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const distBin = Math.floor(Math.random() * 4);
    distBins[i] = distBin;
    const tempBin = Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3;
    const rgb = tempBinToRGB(tempBin);
    const mag = sampleMagnitude();

    colors[i * 3] = rgb[0] * mag;
    colors[i * 3 + 1] = rgb[1] * mag;
    colors[i * 3 + 2] = rgb[2] * mag;
    magnitudes[i] = mag;
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  starGeometry.setAttribute('distBin', new THREE.BufferAttribute(distBins, 1));
  starGeometry.setAttribute('magnitude', new THREE.BufferAttribute(magnitudes, 1));

  const starMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      attribute float distBin;
      attribute float magnitude;
      uniform float u_time;
      uniform vec3 u_apexDir;
      uniform float u_motionEnabled;
      
      varying vec3 v_color;
      
      void main() {
        vec3 pos = position;
        
        float parallaxAmp = mix(0.012, 0.002, distBin / 3.0);
        float drift = u_motionEnabled * u_time;
        pos += u_apexDir * parallaxAmp * sin(6.2831 * drift);
        
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = mix(1.0, 2.5, magnitude);
        v_color = color;
      }
    `,
    fragmentShader: `
      varying vec3 v_color;
      
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        gl_FragColor = vec4(v_color, alpha * 0.8);
      }
    `,
    uniforms: {
      u_time: { value: 0 },
      u_apexDir: { value: new THREE.Vector3(...APEX_DIR) },
      u_motionEnabled: { value: 1 },
    },
    vertexColors: true,
    transparent: true,
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // Heliosphere mesh
  const helioGeometry = new THREE.SphereGeometry(8, 64, 64);
  const helioMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(cameraPosition - worldPos.xyz);
        
        // Anisotropic scaling: shorter upwind (toward apex), broader cross-field
        vec3 scaledPos = position;
        float upwindScale = 0.85;
        float crossFieldScale = 1.1;
        scaledPos *= vec3(crossFieldScale, crossFieldScale, upwindScale);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(scaledPos, 1.0);
      }
    `,
    fragmentShader: `
      uniform float u_time;
      uniform float u_direction;
      uniform float u_motionEnabled;
      
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      
      float rim(vec3 N, vec3 V) {
        float r = 1.0 - max(dot(normalize(N), normalize(V)), 0.0);
        return pow(r, 1.5);
      }
      
      float flowNoise(vec3 p) {
        vec3 seed = p * 0.45;
        float x = sin(seed.x * 12.9898 + seed.y * 78.233 + seed.z * 45.164) * 43758.5453;
        return (fract(x) * 2.0 - 1.0) * 0.05;
      }
      
      void main() {
        vec3 base = vec3(0.08, 0.13, 0.22);
        vec3 accent = vec3(0.60, 0.90, 1.0);
        float rimTerm = rim(vNormal, vViewDir);
        
        float motion = u_motionEnabled;
        float phase = u_time * u_direction * motion;
        float n = flowNoise(vWorldPos * 0.6 + vec3(phase * 0.15));
        
        float alpha = 0.22 + 0.10 * rimTerm + 0.05 * n;
        vec3 col = mix(base, accent, 0.15 * rimTerm + 0.05 * n);
        
        gl_FragColor = vec4(col, clamp(alpha, 0.08, 0.45));
      }
    `,
    uniforms: {
      u_time: { value: 0 },
      u_direction: { value: 1 },
      u_motionEnabled: { value: 1 },
    },
    transparent: true,
    side: THREE.DoubleSide,
  });

  const heliosphere = new THREE.Mesh(helioGeometry, helioMaterial);
  scene.add(heliosphere);

  // Sun
  const sunGeometry = new THREE.SphereGeometry(0.3, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xfff8e7,
  });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);

  // Orbit arcs (ecliptic plane)
  const orbitGeometry = new THREE.BufferGeometry();
  const orbitPoints: number[] = [];
  const planetCount = 8;
  
  for (let p = 0; p < planetCount; p++) {
    const radius = 1.5 + p * 0.8;
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      orbitPoints.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * Math.sin(ECLIPTIC_TILT),
        Math.sin(angle) * radius * Math.cos(ECLIPTIC_TILT)
      );
    }
  }
  
  orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
  const orbitMaterial = new THREE.LineBasicMaterial({
    color: 0x4a5568,
    transparent: true,
    opacity: 0.2,
  });
  const orbits = new THREE.LineSegments(orbitGeometry, orbitMaterial);
  scene.add(orbits);

  let animationFrameId: number | null = null;
  let isAnimating = false;

  function animate() {
    if (!isAnimating) return;
    animationFrameId = requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  return {
    el: canvas,
    dispose() {
      isAnimating = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      starGeometry.dispose();
      starMaterial.dispose();
      helioGeometry.dispose();
      helioMaterial.dispose();
      sunGeometry.dispose();
      sunMaterial.dispose();
      orbitGeometry.dispose();
      orbitMaterial.dispose();
      renderer.dispose();
    },
    update(normTime: number, direction: Direction, motionEnabled: boolean) {
      starMaterial.uniforms.u_time.value = normTime;
      starMaterial.uniforms.u_motionEnabled.value = motionEnabled ? 1 : 0;
      helioMaterial.uniforms.u_time.value = normTime;
      helioMaterial.uniforms.u_direction.value = direction;
      helioMaterial.uniforms.u_motionEnabled.value = motionEnabled ? 1 : 0;
      
      // Subtle camera drift
      if (motionEnabled) {
        const driftAmount = normTime * direction * 0.5;
        camera.position.x = APEX_DIR[0] * driftAmount;
        camera.position.y = APEX_DIR[1] * driftAmount;
        camera.position.z = 15 + APEX_DIR[2] * driftAmount;
        camera.lookAt(0, 0, 0);
      }
      
      if (!isAnimating) {
        isAnimating = true;
        animate();
      }
    },
    resize(w: number, h: number) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    },
  };
}

