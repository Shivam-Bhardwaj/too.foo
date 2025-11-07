import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { basisFromApex, ECLIPTIC_TILT, PHYSICAL_SCALES, HELIOSPHERE_NOSE } from "./apex";
import { FAMOUS_STARS, raDecToCartesian } from "./starCatalog";
import { 
  HELIOSPHERIC_DISTANCES, 
  HELIOSPHERIC_VELOCITIES,
  solarWindDensity,
  solarWindVelocity,
  heliopauseDistance,
  terminationShockDistance
} from "./heliosphericPhysics";

type Direction = 1 | -1;

export type ComponentVisibility = {
  heliosphere: boolean;
  helioglow: boolean;
  terminationShock: boolean;
  solarWind: boolean;
  interstellarWind: boolean;
  planets: boolean;
  orbits: boolean;
  moon: boolean;
  stars: boolean;
  famousStars: boolean;
};

export type SceneAPI = {
  canvas: HTMLCanvasElement;
  update: (year: number, direction: Direction, motionEnabled: boolean) => void;
  resize: (w: number, h: number) => void;
  dispose: () => void;
  toggleComponent: (component: keyof ComponentVisibility, visible: boolean) => void;
  getVisibility: () => ComponentVisibility;
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
  
  // Interactive camera controls
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; // Smooth camera movement
  controls.dampingFactor = 0.05;
  controls.enableZoom = true;
  controls.enablePan = true;
  controls.minDistance = 3; // Don't zoom too close
  controls.maxDistance = 50; // Don't zoom too far
  controls.target.set(0, 0, 0); // Look at heliosphere center
  controls.update();
  
  // Camera panning state (optional auto-panning)
  let cameraTime = 0;
  const cameraRadius = 12;
  const cameraSpeed = 0.0001; // Slow panning
  let autoPanning = false; // Disabled by default, user controls camera

  // ===== Fixed heliosphere basis (screen +X = upwind/nose direction) =====
  // The heliosphere nose points into the interstellar wind at ecliptic λ≈255.4°, β≈5.2°
  const apexBasis = basisFromApex(); // X-axis points toward interstellar upwind

  // ===== Starfield (galactic background streaming past) =====
  // Stars represent the Milky Way galaxy streaming past as the heliosphere moves through it
  // We're viewing from a distance: heliosphere is fixed, stars stream past
  // Distribution based on Gaia catalog statistics for solar neighborhood
  const starMat = new THREE.PointsMaterial({ 
    size: 0.018,  // Larger, more visible stars
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
  stars.name = 'stars';
  scene.add(stars);
  
  // ===== Famous Stars (labeled landmarks) =====
  const famousStarsGroup = new THREE.Group();
  famousStarsGroup.name = 'famousStars';
  FAMOUS_STARS.forEach((star) => {
    const [x, y, z] = raDecToCartesian(star.ra, star.dec, star.distance * 0.1); // Scale distance
    const pos = new THREE.Vector3(x, y, z).applyMatrix4(apexBasis);
    
    // Create star point
    const starGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0)]);
    const starMat = new THREE.PointsMaterial({
      size: 0.035 * (1 + (2.5 - star.magnitude) * 0.15), // Larger, brighter stars
      color: star.color,
      transparent: true,
      opacity: 1.0,  // Fully opaque
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
    
    // Realistic heliosphere material - brighter for visibility
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x2a4a6e),  // Brighter blue-grey
      emissive: new THREE.Color(0x1a2a4a), // Brighter helioglow
      transmission: 0.75,  // Less transparent for more presence
      thickness: 0.4,
      roughness: 0.95,
      metalness: 0.0,
      transparent: true,
      opacity: 0.5,  // Much more visible
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(g, m);
    mesh.setRotationFromMatrix(apexBasis); // nose → +X (upwind direction)
    mesh.name = 'heliosphere';
    scene.add(mesh);
    
    // Add subtle helioglow effect (faint emission from UV interactions)
    const glowGeometry = g.clone();
    glowGeometry.scale(1.1, 1.1, 1.1); // Slightly larger
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x2a4a6a),
      transparent: true,
      opacity: 0.08,  // Very subtle glow
      side: THREE.DoubleSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.setRotationFromMatrix(apexBasis);
    glow.name = 'helioglow';
    scene.add(glow);
    
    return { mesh, glow };
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
    size: 0.020,  // Larger particles
    transparent: true,
    opacity: 0.8,  // Much brighter
    vertexColors: true,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
  });
  
  const ismWind = new THREE.Points(ismWindGeo, ismWindMat);
  ismWind.name = 'interstellarWind';
  scene.add(ismWind);

  // ===== Solar system (MOVES sideways through heliosphere) =====
  const sol = new THREE.Group(); // this group will translate along +X
  scene.add(sol);

  // Sun
  const sunGeometry = new THREE.SphereGeometry(0.45, 32, 32);
  const sunMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffaa,  // Brighter yellow-white
    emissive: 0xffaa44,  // Add emissive glow
    emissiveIntensity: 1.5
  });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sol.add(sun);
  
  // Sun glow/halo
  const sunGlowGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const sunGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffaa44,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  });
  const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
  sol.add(sunGlow);
  
  // ===== Solar Wind Streams (fine threads with accurate physics) =====
  // Solar wind streams outward from the Sun and curves when hitting interstellar medium
  const solarWindGroup = new THREE.Group();
  solarWindGroup.name = 'solarWind';
  sol.add(solarWindGroup);
  
  const SOLAR_WIND_STREAMS = 150; // More streams for better visualization
  
  interface SolarWindStream {
    direction: THREE.Vector3;
    points: THREE.Vector3[];
    line: THREE.Line;
    age: number;
    heliopauseDist: number;
    terminationShockDist: number;
  }
  
  const solarWindStreams: SolarWindStream[] = [];
  const noseDirection = new THREE.Vector3(1, 0, 0); // Upwind direction (+X)
  
  // Create fine thread-like streams with accurate physics
  for (let i = 0; i < SOLAR_WIND_STREAMS; i++) {
    // Random direction from sun
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const direction = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi)
    ).normalize();
    
    // Calculate accurate distances for this direction
    const heliopauseDist = heliopauseDistance(direction, noseDirection) * 0.03; // Scale to scene units
    const terminationShockDist = terminationShockDistance(direction, noseDirection) * 0.03;
    
    // Create stream with multiple points for smooth curves
    const streamPoints: THREE.Vector3[] = [];
    const segments = 60; // More segments for smoother curves
    
    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      const maxDist = heliopauseDist * 1.5; // Extend beyond heliopause
      const distance = t * maxDist;
      
      // Start from sun surface
      const basePos = direction.clone().multiplyScalar(0.5 + distance);
      
      // Physics: Different behavior in different regions
      if (distance < terminationShockDist) {
        // Inner heliosphere: supersonic, straight radial flow
        // Velocity decreases slightly with distance
        const velocity = solarWindVelocity(distance / 0.03) / HELIOSPHERIC_VELOCITIES.SOLAR_WIND_OUTER;
        basePos.multiplyScalar(1.0 + (1.0 - velocity) * 0.1);
      } else if (distance < heliopauseDist) {
        // Heliosheath: compressed, turbulent, subsonic
        const excessDist = distance - terminationShockDist;
        const sheathWidth = heliopauseDist - terminationShockDist;
        const compression = 1.0 + (excessDist / sheathWidth) * 0.3; // Compressed
        
        // Turbulent deflection in heliosheath
        const turbulence = Math.sin(excessDist * 5) * 0.05 * (excessDist / sheathWidth);
        const perp = new THREE.Vector3().crossVectors(direction, noseDirection).normalize();
        if (perp.length() > 0.1) {
          basePos.add(perp.multiplyScalar(turbulence));
        }
        
        basePos.multiplyScalar(compression);
      } else {
        // Beyond heliopause: curve due to ISM pressure and flow
        const excessDist = distance - heliopauseDist;
        const curveAmount = Math.min(excessDist * 0.25, 2.0);
        
        // ISM flows from +X, deflects solar wind
        const ismFlowDir = new THREE.Vector3(-1, 0, 0);
        
        // Deflect perpendicular to both directions
        const perp1 = new THREE.Vector3().crossVectors(direction, ismFlowDir).normalize();
        if (perp1.length() < 0.1) {
          perp1.set(-direction.y, direction.x, 0).normalize();
        }
        const perp2 = new THREE.Vector3().crossVectors(direction, perp1).normalize();
        
        // Curved deflection with exponential decay
        const deflectionStrength = curveAmount * Math.exp(-excessDist * 0.4);
        const phase = excessDist * 2.0;
        const deflection = perp1.clone().multiplyScalar(
          Math.sin(phase) * deflectionStrength
        ).add(
          perp2.clone().multiplyScalar(
            Math.cos(phase) * deflectionStrength * 0.7
          )
        );
        
        basePos.add(deflection);
      }
      
      streamPoints.push(basePos.clone());
    }
    
    // Density-based opacity (denser near Sun, thinner far out)
    const density = solarWindDensity(streamPoints[streamPoints.length - 1].length() / 0.03);
    const opacity = Math.min(0.7, Math.max(0.2, density / 10));
    
    // Create line geometry for fine threads
    const geometry = new THREE.BufferGeometry().setFromPoints(streamPoints);
    const material = new THREE.LineBasicMaterial({
      color: 0xffffaa,
      transparent: true,
      opacity: opacity,
      linewidth: 0.5
    });
    
    const line = new THREE.Line(geometry, material);
    solarWindGroup.add(line);
    
    solarWindStreams.push({
      direction: direction,
      points: streamPoints,
      line: line,
      age: Math.random(),
      heliopauseDist: heliopauseDist,
      terminationShockDist: terminationShockDist
    });
  }
  
  // ===== Termination Shock Visualization =====
  // Show the boundary where solar wind slows from supersonic to subsonic
  const terminationShockGroup = new THREE.Group();
  terminationShockGroup.name = 'terminationShock';
  scene.add(terminationShockGroup);
  
  // Create termination shock surface (simplified visualization)
  const tsGeometry = new THREE.SphereGeometry(HELIOSPHERIC_DISTANCES.TERMINATION_SHOCK_NOSE * 0.03, 32, 32);
  tsGeometry.scale(0.7, 1.0, 1.0); // Compressed on nose side
  const tsMaterial = new THREE.MeshBasicMaterial({
    color: 0xffaa44,
    transparent: true,
    opacity: 0.15,
    wireframe: true,
    side: THREE.DoubleSide
  });
  const terminationShock = new THREE.Mesh(tsGeometry, tsMaterial);
  terminationShock.setRotationFromMatrix(apexBasis);
  terminationShockGroup.add(terminationShock);

  // Brighter lighting for better visibility
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));  // Increased ambient
  const sunLight = new THREE.DirectionalLight(0xffffaa, 0.8);  // Brighter sunlight
  sunLight.position.set(2, 1, 2);
  scene.add(sunLight);
  
  // Add brighter fill light for heliosphere visibility
  const fillLight = new THREE.DirectionalLight(0x6a7a9a, 0.3);
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

  // Orbits group (thin), tilted by ecliptic
  const orbitsGroup = new THREE.Group();
  orbitsGroup.name = 'orbits';
  sol.add(orbitsGroup);
  
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
    orbitsGroup.add(line);
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

  // Create planets + orbits with more realistic materials
  const planetsGroup = new THREE.Group();
  planetsGroup.name = 'planets';
  sol.add(planetsGroup);
  
  const planetMeshes: Record<string, THREE.Mesh> = {};
  const earthMeshRef: { current: THREE.Mesh | null } = { current: null };
  
  Object.entries(PLANET_RADII).forEach(([name, R]) => {
    makeOrbit(R);
    
    // More realistic planet colors and materials
    let color, emissive, metalness, roughness;
    const size = name === "Jupiter" ? 0.12 : name === "Saturn" ? 0.11 : 0.08;
    
    switch(name) {
      case "Mercury":
        color = 0x8c7853;
        emissive = 0x000000;
        metalness = 0.1;
        roughness = 0.9;
        break;
      case "Venus":
        color = 0xffc649;
        emissive = 0x332200;
        metalness = 0.0;
        roughness = 0.95;
        break;
      case "Earth":
        color = 0x4a90e2;
        emissive = 0x001122;
        metalness = 0.0;
        roughness = 0.7;
        break;
      case "Mars":
        color = 0xcd5c5c;
        emissive = 0x000000;
        metalness = 0.1;
        roughness = 0.9;
        break;
      case "Jupiter":
        color = 0xd8ca9d;
        emissive = 0x221100;
        metalness = 0.0;
        roughness = 0.8;
        break;
      case "Saturn":
        color = 0xfad5a5;
        emissive = 0x221100;
        metalness = 0.0;
        roughness = 0.85;
        break;
      case "Uranus":
        color = 0x4fd0e7;
        emissive = 0x001122;
        metalness = 0.0;
        roughness = 0.9;
        break;
      case "Neptune":
        color = 0x4166f5;
        emissive = 0x000011;
        metalness = 0.0;
        roughness = 0.9;
        break;
      default:
        color = 0x888888;
        emissive = 0x000000;
        metalness = 0.0;
        roughness = 0.95;
    }
    
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 32, 32), // More segments for smoother appearance
      new THREE.MeshStandardMaterial({ 
        color, 
        emissive,
        metalness, 
        roughness 
      })
    );
    mesh.userData.radius = R;
    mesh.userData.period = PERIOD_Y[name as keyof typeof PERIOD_Y];
    mesh.rotation.z = ECLIPTIC_TILT;
    planetsGroup.add(mesh);
    planetMeshes[name] = mesh;
    
    // Store Earth reference for Moon
    if (name === "Earth") {
      earthMeshRef.current = mesh;
    }
  });
  
  // ===== Moon orbiting Earth =====
  const moonGroup = new THREE.Group();
  moonGroup.name = 'moon';
  sol.add(moonGroup);
  
  const moonGeometry = new THREE.SphereGeometry(0.02, 16, 16);
  const moonMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    emissive: 0x000000,
    metalness: 0.0,
    roughness: 0.9
  });
  const moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moonGroup.add(moon);
  
  // Moon orbit radius (relative to Earth)
  const MOON_ORBIT_RADIUS = 0.15;
  const MOON_PERIOD_DAYS = 27.32; // Sidereal month in days
  const MOON_PERIOD_YEARS = MOON_PERIOD_DAYS / 365.25;

  // ==== Component visibility state (astronomer controls) ====
  const visibility: ComponentVisibility = {
    heliosphere: true,
    helioglow: true,
    terminationShock: true,
    solarWind: true,
    interstellarWind: true,
    planets: true,
    orbits: true,
    moon: true,
    stars: true,
    famousStars: true,
  };
  
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
    let earthPosition = new THREE.Vector3();
    
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
      
      // Store Earth position for Moon
      if (name === "Earth") {
        earthPosition.copy(mesh.position);
      }
    });
    
    // Position Moon orbiting Earth
    if (earthMeshRef.current) {
      // Moon's orbital phase (27.32 day period)
      let normalizedMoonYear = (year % MOON_PERIOD_YEARS);
      if (normalizedMoonYear < 0) normalizedMoonYear += MOON_PERIOD_YEARS;
      const moonTheta = (normalizedMoonYear / MOON_PERIOD_YEARS) * Math.PI * 2;
      
      // Moon orbits in Earth's orbital plane (ecliptic)
      const moonOffset = new THREE.Vector3(
        Math.cos(moonTheta) * MOON_ORBIT_RADIUS,
        0,
        Math.sin(moonTheta) * MOON_ORBIT_RADIUS
      );
      moonOffset.applyAxisAngle(Z_AXIS, ECLIPTIC_TILT);
      
      // Position moon group at Earth + Moon offset
      moonGroup.position.copy(earthPosition).add(moonOffset);
    }
  }

  function update(year: number, dir: Direction, enableMotion: boolean) {
    direction = dir;
    motionEnabled = enableMotion;

    // Smooth interpolation to target year (keeps scrub smooth)
    const alpha = 0.15;
    currentYear = currentYear + (year - currentYear) * alpha;

    // Planet placement (planets orbit within heliosphere)
    placePlanets(currentYear);

    // Animate solar wind streams with accurate physics
    if (motionEnabled) {
      let streamTime = (currentYear % 1) * 0.1; // Slow animation based on year
      
      solarWindStreams.forEach((stream) => {
        // Update stream points with accurate physics
        const segments = 60;
        const newPoints: THREE.Vector3[] = [];
        const maxDist = stream.heliopauseDist * 1.5;
        
        for (let j = 0; j <= segments; j++) {
          const t = j / segments;
          const distance = t * maxDist;
          
          // Add time-based flow offset
          const flowOffset = streamTime * 0.3;
          const effectiveDist = distance + flowOffset;
          
          // Start from sun surface
          const basePos = stream.direction.clone().multiplyScalar(0.5 + effectiveDist);
          
          // Accurate physics: Different behavior in different regions
          if (effectiveDist < stream.terminationShockDist) {
            // Inner heliosphere: supersonic, straight radial flow
            const velocity = solarWindVelocity(effectiveDist / 0.03) / HELIOSPHERIC_VELOCITIES.SOLAR_WIND_OUTER;
            basePos.multiplyScalar(1.0 + (1.0 - velocity) * 0.1);
          } else if (effectiveDist < stream.heliopauseDist) {
            // Heliosheath: compressed, turbulent, subsonic
            const excessDist = effectiveDist - stream.terminationShockDist;
            const sheathWidth = stream.heliopauseDist - stream.terminationShockDist;
            const compression = 1.0 + (excessDist / sheathWidth) * 0.3;
            
            // Turbulent deflection in heliosheath
            const turbulence = Math.sin(excessDist * 5 + stream.age * Math.PI * 2) * 0.05 * (excessDist / sheathWidth);
            const perp = new THREE.Vector3().crossVectors(stream.direction, noseDirection).normalize();
            if (perp.length() > 0.1) {
              basePos.add(perp.multiplyScalar(turbulence));
            }
            
            basePos.multiplyScalar(compression);
          } else {
            // Beyond heliopause: curve due to ISM pressure and flow
            const excessDist = effectiveDist - stream.heliopauseDist;
            const curveAmount = Math.min(excessDist * 0.25, 2.0);
            
            // ISM flows from +X, deflects solar wind
            const ismFlowDir = new THREE.Vector3(-1, 0, 0);
            
            // Deflect perpendicular to both directions
            const perp1 = new THREE.Vector3().crossVectors(stream.direction, ismFlowDir).normalize();
            if (perp1.length() < 0.1) {
              perp1.set(-stream.direction.y, stream.direction.x, 0).normalize();
            }
            const perp2 = new THREE.Vector3().crossVectors(stream.direction, perp1).normalize();
            
            // Curved deflection with exponential decay
            const deflectionStrength = curveAmount * Math.exp(-excessDist * 0.4);
            const phase = excessDist * 2.0 + stream.age * Math.PI * 2;
            const deflection = perp1.clone().multiplyScalar(
              Math.sin(phase) * deflectionStrength
            ).add(
              perp2.clone().multiplyScalar(
                Math.cos(phase) * deflectionStrength * 0.7
              )
            );
            
            basePos.add(deflection);
          }
          
          newPoints.push(basePos);
        }
        
        // Update line geometry
        stream.line.geometry.setFromPoints(newPoints);
        stream.line.geometry.attributes.position.needsUpdate = true;
        
        // Update opacity based on density
        const density = solarWindDensity(newPoints[newPoints.length - 1].length() / 0.03);
        const opacity = Math.min(0.7, Math.max(0.2, density / 10));
        (stream.line.material as THREE.LineBasicMaterial).opacity = opacity;
      });
      
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
      
      // Optional auto-panning (disabled by default - user controls camera)
      if (autoPanning) {
        cameraTime += cameraSpeed;
        const camAngle = cameraTime;
        camera.position.x = Math.cos(camAngle) * cameraRadius;
        camera.position.y = 2.2 + Math.sin(camAngle * 0.5) * 1.5;
        camera.position.z = Math.sin(camAngle) * cameraRadius;
        camera.lookAt(0, 0, 0);
      }
    }
    
    // Update camera controls (for smooth damping)
    controls.update();
    
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
    controls.dispose();
    renderer.dispose();
    starGeo.dispose();
    starMat.dispose();
  }
  
  // Toggle component visibility (astronomer controls)
  function toggleComponent(component: keyof ComponentVisibility, visible: boolean) {
    visibility[component] = visible;
    
    switch(component) {
      case 'heliosphere':
        helio.mesh.visible = visible;
        break;
      case 'helioglow':
        helio.glow.visible = visible;
        break;
      case 'terminationShock':
        terminationShockGroup.visible = visible;
        break;
      case 'solarWind':
        solarWindGroup.visible = visible;
        break;
      case 'interstellarWind':
        ismWind.visible = visible;
        break;
      case 'planets':
        planetsGroup.visible = visible;
        break;
      case 'orbits':
        orbitsGroup.visible = visible;
        break;
      case 'moon':
        moonGroup.visible = visible;
        break;
      case 'stars':
        stars.visible = visible;
        break;
      case 'famousStars':
        famousStarsGroup.visible = visible;
        break;
    }
  }
  
  function getVisibility(): ComponentVisibility {
    return { ...visibility };
  }

  return { canvas, update, resize, dispose, toggleComponent, getVisibility };
}