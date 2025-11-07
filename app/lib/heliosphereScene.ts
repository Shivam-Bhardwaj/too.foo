import * as THREE from "three";
import { basisFromApex, ECLIPTIC_TILT, PHYSICAL_SCALES, HELIOSPHERE_NOSE } from "./apex";
import { FAMOUS_STARS, raDecToCartesian } from "./starCatalog";

type Direction = 1 | -1;

export type SceneAPI = {
  canvas: HTMLCanvasElement;
  update: (year: number, direction: Direction, motionEnabled: boolean) => void;
  resize: (w: number, h: number) => void;
  dispose: () => void;
};

export function createScene(canvas: HTMLCanvasElement): SceneAPI {
  // Renderer / Scene / Camera
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  // Deep space black - no atmospheric scattering in interstellar space
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 3000);
  camera.position.set(0, 2.2, 10);
  camera.lookAt(0, 0, 0);
  
  // Camera panning state
  let cameraTime = 0;
  const cameraRadius = 12;
  const cameraSpeed = 0.0001; // Slow panning

  // ===== Fixed heliosphere basis (screen +X = upwind/nose direction) =====
  // The heliosphere nose points into the interstellar wind at ecliptic λ≈255.4°, β≈5.2°
  const apexBasis = basisFromApex(); // X-axis points toward interstellar upwind

  // ===== Starfield (galactic background streaming past) =====
  // Stars represent the Milky Way galaxy streaming past as the heliosphere moves through it
  // We're viewing from a distance: heliosphere is fixed, stars stream past
  // Distribution based on Gaia catalog statistics for solar neighborhood
  const starMat = new THREE.PointsMaterial({ 
    size: 0.012,  // Sharper, more realistic star size
    transparent: true, 
    opacity: 1.0,
    sizeAttenuation: true,  // Stars get smaller with distance
    vertexColors: true
  });
  const starGeo = new THREE.BufferGeometry();
  {
    const N = 8000; // Increased for richer field
    const pos = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    
    for (let i = 0; i < N; i++) {
      // Realistic distance distribution (parsecs converted to scene units)
      // Most stars within 100-500 pc, following inverse square law
      const r = 120 + Math.pow(Math.random(), 0.6) * 380;
      
      // Galactic plane concentration (stars cluster near galactic equator)
      const galacticLat = (Math.random() - 0.5) * Math.PI * 0.3; // ±27° concentration
      const galacticLon = Math.random() * 2 * Math.PI;
      
      // Convert galactic to equatorial-ish for display
      const theta = galacticLon;
      const phi = Math.PI/2 + galacticLat;
      
      const p = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ).applyMatrix4(apexBasis);
      
      pos[i * 3 + 0] = p.x; 
      pos[i * 3 + 1] = p.y; 
      pos[i * 3 + 2] = p.z;
      
      // Realistic star colors (based on spectral types)
      // Most stars are red dwarfs, some yellow like Sun, few blue giants
      const spectralRand = Math.random();
      if (spectralRand < 0.76) {
        // M-type red dwarfs (76% of stars)
        colors[i * 3 + 0] = 1.0;
        colors[i * 3 + 1] = 0.8;
        colors[i * 3 + 2] = 0.7;
      } else if (spectralRand < 0.88) {
        // K-type orange dwarfs (12%)
        colors[i * 3 + 0] = 1.0;
        colors[i * 3 + 1] = 0.9;
        colors[i * 3 + 2] = 0.8;
      } else if (spectralRand < 0.96) {
        // G-type yellow dwarfs like Sun (8%)
        colors[i * 3 + 0] = 1.0;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 0.9;
      } else {
        // F, A, B, O-type blue/white stars (4%)
        colors[i * 3 + 0] = 0.9;
        colors[i * 3 + 1] = 0.95;
        colors[i * 3 + 2] = 1.0;
      }
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);
  
  // ===== Famous Stars (labeled landmarks) =====
  const famousStarsGroup = new THREE.Group();
  FAMOUS_STARS.forEach((star) => {
    const [x, y, z] = raDecToCartesian(star.ra, star.dec, star.distance * 0.1); // Scale distance
    const pos = new THREE.Vector3(x, y, z).applyMatrix4(apexBasis);
    
    // Create star point
    const starGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0)]);
    const starMat = new THREE.PointsMaterial({
      size: 0.025 * (1 + (2.5 - star.magnitude) * 0.1), // Brighter stars are larger
      color: star.color,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true
    });
    const starPoint = new THREE.Points(starGeo, starMat);
    starPoint.position.copy(pos);
    famousStarsGroup.add(starPoint);
    
    // Add label sprite (optional - can be toggled)
    // For now, we'll just mark them with slightly larger/bright stars
  });
  scene.add(famousStarsGroup);

  // ===== Heliosphere (FIXED - comet-like teardrop shape) =====
  // The heliosphere is completely fixed in our view
  // We're observing it from a distance as it moves through the galaxy
  // Stars stream past to show our 230 km/s orbital motion around Milky Way center
  // Shape: Compressed nose (ram pressure) + elongated tail (flow stretching)
  const helio = (() => {
    // Create teardrop/comet shape geometry
    const createTeardropGeometry = () => {
      const segments = 64;
      const rings = 48;
      const radius = 3.6;
      const noseCompression = 0.65;  // Nose compressed by ram pressure
      const tailStretch = 2.2;        // Tail elongated by flow
      
      const geometry = new THREE.BufferGeometry();
      const vertices: number[] = [];
      const normals: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];
      
      // Generate vertices in teardrop shape
      for (let ring = 0; ring <= rings; ring++) {
        const v = ring / rings; // 0 to 1
        // Map v to teardrop profile: compressed at front (v=0), stretched at back (v=1)
        const profileX = v < 0.5 
          ? noseCompression * (1 - Math.pow(2 * v, 1.5))  // Compressed nose
          : -tailStretch * Math.pow(2 * (v - 0.5), 0.7);  // Elongated tail
        
        const profileRadius = Math.sqrt(1 - Math.pow(v - 0.5, 2) * 4) * radius;
        
        for (let seg = 0; seg <= segments; seg++) {
          const u = seg / segments;
          const theta = u * Math.PI * 2;
          
          const x = profileX;
          const y = Math.cos(theta) * profileRadius;
          const z = Math.sin(theta) * profileRadius;
          
          vertices.push(x, y, z);
          
          // Calculate normals for smooth shading
          const normal = new THREE.Vector3(x - profileX, y, z).normalize();
          normals.push(normal.x, normal.y, normal.z);
          
          uvs.push(u, v);
        }
      }
      
      // Generate indices for faces
      for (let ring = 0; ring < rings; ring++) {
        for (let seg = 0; seg < segments; seg++) {
          const a = ring * (segments + 1) + seg;
          const b = ring * (segments + 1) + seg + 1;
          const c = (ring + 1) * (segments + 1) + seg;
          const d = (ring + 1) * (segments + 1) + seg + 1;
          
          indices.push(a, c, b);
          indices.push(b, c, d);
        }
      }
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      
      return geometry;
    };
    
    const g = createTeardropGeometry();
    
    // Realistic heliosphere material - subtle glow from helioglow effect
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x0a1a2e),  // Very dark blue-grey
      emissive: new THREE.Color(0x040810), // Subtle helioglow
      transmission: 0.85,  // Less transparent for more presence
      thickness: 0.4,
      roughness: 0.98,
      metalness: 0.0,
      transparent: true,
      opacity: 0.25,  // More subtle
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(g, m);
    mesh.setRotationFromMatrix(apexBasis); // nose → +X (upwind direction)
    scene.add(mesh);
    
    // Add subtle helioglow effect (faint emission from UV interactions)
    const glowGeometry = g.clone();
    glowGeometry.scale(1.15, 1.15, 1.15); // Slightly larger
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x1a2a4a),
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.setRotationFromMatrix(apexBasis);
    scene.add(glow);
    
    return mesh;
  })();
  
  // ===== Interstellar Wind Particles =====
  // Interstellar medium flows into the heliosphere from the upwind direction (+X)
  const ismWindCount = 1500;
  const ismWindGeo = new THREE.BufferGeometry();
  const ismWindPositions = new Float32Array(ismWindCount * 3);
  const ismWindVelocities = new Float32Array(ismWindCount * 3);
  const ismWindColors = new Float32Array(ismWindCount * 3);
  
  for (let i = 0; i < ismWindCount; i++) {
    // Start from upwind direction (positive X, spread out)
    const spread = 8 + Math.random() * 4; // Start 8-12 units away
    const offsetY = (Math.random() - 0.5) * 6;
    const offsetZ = (Math.random() - 0.5) * 6;
    
    ismWindPositions[i * 3 + 0] = spread;
    ismWindPositions[i * 3 + 1] = offsetY;
    ismWindPositions[i * 3 + 2] = offsetZ;
    
    // Flow toward heliosphere (negative X direction)
    const speed = 0.015 + Math.random() * 0.01;
    ismWindVelocities[i * 3 + 0] = -speed;
    ismWindVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
    ismWindVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
    
    // Interstellar medium color (blue-purple, cooler than solar wind)
    ismWindColors[i * 3 + 0] = 0.6;
    ismWindColors[i * 3 + 1] = 0.7;
    ismWindColors[i * 3 + 2] = 1.0;
  }
  
  ismWindGeo.setAttribute('position', new THREE.BufferAttribute(ismWindPositions, 3));
  ismWindGeo.setAttribute('color', new THREE.BufferAttribute(ismWindColors, 3));
  
  const ismWindMat = new THREE.PointsMaterial({
    size: 0.012,
    transparent: true,
    opacity: 0.5,
    vertexColors: true,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
  });
  
  const ismWind = new THREE.Points(ismWindGeo, ismWindMat);
  scene.add(ismWind);

  // ===== Solar system (MOVES sideways through heliosphere) =====
  const sol = new THREE.Group(); // this group will translate along +X
  scene.add(sol);

  // Sun
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xfff2cc })
  );
  sol.add(sun);
  
  // ===== Solar Wind Particles =====
  // Solar wind streams outward from the Sun in all directions
  const solarWindCount = 2000;
  const solarWindGeo = new THREE.BufferGeometry();
  const solarWindPositions = new Float32Array(solarWindCount * 3);
  const solarWindVelocities = new Float32Array(solarWindCount * 3);
  const solarWindColors = new Float32Array(solarWindCount * 3);
  const solarWindAges = new Float32Array(solarWindCount);
  
  for (let i = 0; i < solarWindCount; i++) {
    // Random direction from sun
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = 0.02 + Math.random() * 0.03; // Solar wind speed
    
    solarWindVelocities[i * 3 + 0] = Math.sin(phi) * Math.cos(theta) * speed;
    solarWindVelocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
    solarWindVelocities[i * 3 + 2] = Math.cos(phi) * speed;
    
    // Start at sun surface
    solarWindPositions[i * 3 + 0] = solarWindVelocities[i * 3 + 0] * 0.5;
    solarWindPositions[i * 3 + 1] = solarWindVelocities[i * 3 + 1] * 0.5;
    solarWindPositions[i * 3 + 2] = solarWindVelocities[i * 3 + 2] * 0.5;
    
    // Solar wind color (yellow-white plasma)
    solarWindColors[i * 3 + 0] = 1.0;
    solarWindColors[i * 3 + 1] = 0.95;
    solarWindColors[i * 3 + 2] = 0.8;
    
    solarWindAges[i] = Math.random(); // Random age
  }
  
  solarWindGeo.setAttribute('position', new THREE.BufferAttribute(solarWindPositions, 3));
  solarWindGeo.setAttribute('color', new THREE.BufferAttribute(solarWindColors, 3));
  
  const solarWindMat = new THREE.PointsMaterial({
    size: 0.015,
    transparent: true,
    opacity: 0.6,
    vertexColors: true,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
  });
  
  const solarWind = new THREE.Points(solarWindGeo, solarWindMat);
  sol.add(solarWind);

  // Subtle lighting for deep space - minimal ambient, directional from Sun
  scene.add(new THREE.AmbientLight(0xffffff, 0.1));  // Very subtle ambient
  const sunLight = new THREE.DirectionalLight(0xfff2cc, 0.4);  // Warm sunlight
  sunLight.position.set(2, 1, 2);
  scene.add(sunLight);
  
  // Add subtle fill light for heliosphere visibility
  const fillLight = new THREE.DirectionalLight(0x4a5a7a, 0.15);
  fillLight.position.set(-2, -1, -2);
  scene.add(fillLight);
  
  // ===== Reference Frame Indicators (optional scientific markers) =====
  // These show the various reference frames for educational purposes
  const createReferenceArrow = (direction: THREE.Vector3, color: number, length: number = 5) => {
    const origin = new THREE.Vector3(0, 0, 0);
    const arrowHelper = new THREE.ArrowHelper(direction, origin, length, color, length * 0.3, length * 0.15);
    arrowHelper.line.material = new THREE.LineBasicMaterial({ 
      color, 
      transparent: true, 
      opacity: 0.3,
      linewidth: 2 
    });
    arrowHelper.cone.material = new THREE.MeshBasicMaterial({ 
      color, 
      transparent: true, 
      opacity: 0.3 
    });
    return arrowHelper;
  };
  
  // Add reference indicators (can be toggled in a production version)
  const referenceGroup = new THREE.Group();
  referenceGroup.visible = false; // Hidden by default - could be toggled via UI
  
  // Interstellar wind direction (heliosphere nose) - already aligned with +X
  const windArrow = createReferenceArrow(new THREE.Vector3(1, 0, 0), 0x00ffff, 6);
  referenceGroup.add(windArrow);
  
  // Galactic center direction (approximate)
  const galacticDir = new THREE.Vector3(-0.05, -0.87, -0.48).normalize();
  const galacticArrow = createReferenceArrow(galacticDir, 0xff00ff, 4);
  referenceGroup.add(galacticArrow);
  
  scene.add(referenceGroup);

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
  let currentYear = 2024.0;   // Start at current year (can be adjusted)
  let driftX = 0;              // solar-system sideways drift inside fixed heliosphere
  let starDriftX = 0;         // starfield drift accumulator for parallax
  let direction: Direction = 1;
  let motionEnabled = true;
  
  // Realistic velocity ratios based on astronomical data
  // We're showing the heliosphere moving through the galaxy
  // Stars represent the galactic background streaming past us
  const VELOCITY_SCALE = 0.0003; // Scaling factor for screen units/frame
  const GALACTIC_MOTION = 230;   // km/s - Sun's orbital speed around Milky Way
  const STAR_STREAM_SPEED = GALACTIC_MOTION * VELOCITY_SCALE; // Stars stream past (galaxy motion)
  const SOLAR_DRIFT_SPEED = 0.001; // Minimal solar system drift within heliosphere (optional)

  // Helpers
  const Z_AXIS = new THREE.Vector3(0, 0, 1);

  function placePlanets(year: number) {
    // Calculate planet positions based on actual year
    // Each planet's angle = (year / period) * 2π
    Object.entries(planetMeshes).forEach(([name, mesh]) => {
      const R = mesh.userData.radius as number;
      const period = mesh.userData.period as number;
      // Handle negative years and wrap properly
      let normalizedYear = year % period;
      if (normalizedYear < 0) normalizedYear += period;
      const theta = (normalizedYear / period) * Math.PI * 2;
      // base ecliptic (x,0,z), then tilt
      mesh.position.set(Math.cos(theta) * R, 0, Math.sin(theta) * R);
      mesh.position.applyAxisAngle(Z_AXIS, ECLIPTIC_TILT);
    });
  }

  function update(year: number, dir: Direction, enableMotion: boolean) {
    direction = dir;
    motionEnabled = enableMotion;

    // Smooth interpolation to target year (keeps scrub smooth)
    const alpha = 0.15;
    currentYear = currentYear + (year - currentYear) * alpha;

    // Planet placement (planets orbit within heliosphere)
    placePlanets(currentYear);

    // Animate solar wind particles
    if (motionEnabled) {
      const solarWindPos = solarWindGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < solarWindCount; i++) {
        const idx = i * 3;
        // Update position based on velocity
        solarWindPos[idx + 0] += solarWindVelocities[idx + 0];
        solarWindPos[idx + 1] += solarWindVelocities[idx + 1];
        solarWindPos[idx + 2] += solarWindVelocities[idx + 2];
        
        // Reset particles that have traveled too far
        const dist = Math.sqrt(
          solarWindPos[idx + 0] ** 2 + 
          solarWindPos[idx + 1] ** 2 + 
          solarWindPos[idx + 2] ** 2
        );
        if (dist > 5) {
          // Reset to sun surface
          solarWindPos[idx + 0] = solarWindVelocities[idx + 0] * 0.5;
          solarWindPos[idx + 1] = solarWindVelocities[idx + 1] * 0.5;
          solarWindPos[idx + 2] = solarWindVelocities[idx + 2] * 0.5;
        }
      }
      solarWindGeo.attributes.position.needsUpdate = true;
      
      // Animate interstellar wind particles
      const ismWindPos = ismWindGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < ismWindCount; i++) {
        const idx = i * 3;
        // Update position
        ismWindPos[idx + 0] += ismWindVelocities[idx + 0];
        ismWindPos[idx + 1] += ismWindVelocities[idx + 1];
        ismWindPos[idx + 2] += ismWindVelocities[idx + 2];
        
        // Reset particles that have passed through heliosphere
        if (ismWindPos[idx + 0] < -5) {
          const spread = 8 + Math.random() * 4;
          ismWindPos[idx + 0] = spread;
          ismWindPos[idx + 1] = (Math.random() - 0.5) * 6;
          ismWindPos[idx + 2] = (Math.random() - 0.5) * 6;
        }
      }
      ismWindGeo.attributes.position.needsUpdate = true;
      
      // Stars stream past the fixed heliosphere (galaxy background moves)
      starDriftX += STAR_STREAM_SPEED * direction;
      
      // Optional: minimal solar system drift within heliosphere (ISM interaction)
      driftX += SOLAR_DRIFT_SPEED * direction;
      
      // Camera panning - slow orbital motion around heliosphere
      cameraTime += cameraSpeed;
      const camAngle = cameraTime;
      camera.position.x = Math.cos(camAngle) * cameraRadius;
      camera.position.y = 2.2 + Math.sin(camAngle * 0.5) * 1.5;
      camera.position.z = Math.sin(camAngle) * cameraRadius;
      camera.lookAt(0, 0, 0);
    }
    
    // Solar system has minimal drift within fixed heliosphere
    sol.position.set(driftX, 0, 0);
    
    // Stars stream past the fixed heliosphere (showing galactic motion)
    stars.position.set(-starDriftX, 0, 0);
    famousStarsGroup.position.set(-starDriftX, 0, 0);
    
    // Heliosphere stays at origin (0,0,0) - completely fixed

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