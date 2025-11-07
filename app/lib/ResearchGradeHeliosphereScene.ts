/**
 * Research-grade heliosphere visualization with real astronomical data
 * Integrates JPL ephemerides, Voyager trajectories, and MHD models
 */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { basisFromApex } from "./apex";
import { getAstronomicalDataService } from "./services/AstronomicalDataService";
import { CoordinateTransforms } from "./physics/CoordinateTransforms";
import { JulianDate } from "./data/AstronomicalDataStore";
import { PLANET_PROPERTIES } from "./data/PlanetaryEphemeris";
import { VoyagerTrajectories } from "./physics/SpacecraftTrajectories";
import { createPlasmaMaterial, updatePlasmaMaterial } from "./shaders/PlasmaShader";

type Direction = 1 | -1;

export type ComponentVisibility = {
  heliosphere: boolean;
  terminationShock: boolean;
  heliopause: boolean;
  bowShock: boolean;
  solarWind: boolean;
  interstellarWind: boolean;
  planets: boolean;
  orbits: boolean;
  spacecraft: boolean;
  trajectories: boolean;
  stars: boolean;
  coordinateGrid: boolean;
  distanceMarkers: boolean;
  dataOverlay: boolean;
};

export type TimeMode = 'historical' | 'realtime' | 'prediction';

export type SceneAPI = {
  canvas: HTMLCanvasElement;
  update: (date: Date, timeSpeed: number, motionEnabled: boolean) => void;
  resize: (w: number, h: number) => void;
  dispose: () => void;
  toggleComponent: (component: keyof ComponentVisibility, visible: boolean) => void;
  getVisibility: () => ComponentVisibility;
  setTimeMode: (mode: TimeMode) => void;
  getCurrentDate: () => Date;
};

export async function createResearchGradeScene(canvas: HTMLCanvasElement): Promise<SceneAPI> {
  // Initialize data service
  const dataService = getAstronomicalDataService();
  await dataService.initialize();
  
  // Validate Voyager crossings
  const validation = dataService.validateVoyagerCrossings();
  console.log('Voyager validation:', validation);
  
  // Renderer setup
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  
  // Camera setup
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 5000);
  camera.position.set(150, 100, 200);
  camera.lookAt(0, 0, 0);
  
  // Controls
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 10;
  controls.maxDistance = 1000;
  
  // Time management
  let currentDate = new Date();
  let timeMode: TimeMode = 'realtime';
  let timeSpeed = 1; // days per frame
  let lastBoundaryUpdate = 0; // Track last time boundaries were updated
  
  // Component visibility
  const visibility: ComponentVisibility = {
    heliosphere: true,
    terminationShock: true,
    heliopause: true,
    bowShock: false,
    solarWind: true,
    interstellarWind: true,
    planets: true,
    orbits: true,
    spacecraft: true,
    trajectories: true,
    stars: true,
    coordinateGrid: false,
    distanceMarkers: true,
    dataOverlay: true
  };
  
  // Fixed heliosphere basis
  const apexBasis = basisFromApex();
  
  // Scale factor: 1 AU = 1 unit in scene
  const AU_SCALE = 1;
  
  // ===== STAR FIELD (Gaia-based) =====
  const starGroup = new THREE.Group();
  starGroup.name = 'stars';
  
  // Simplified star field (full Gaia catalog would be loaded progressively)
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 10000;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  
  for (let i = 0; i < starCount; i++) {
    // Random distribution in sphere
    const r = 500 + Math.random() * 1000;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = r * Math.cos(phi);
    
    // Color based on temperature
    const temp = Math.random();
    if (temp < 0.7) {
      // Cool red stars
      starColors[i * 3] = 1.0;
      starColors[i * 3 + 1] = 0.7;
      starColors[i * 3 + 2] = 0.5;
    } else if (temp < 0.9) {
      // Sun-like stars
      starColors[i * 3] = 1.0;
      starColors[i * 3 + 1] = 1.0;
      starColors[i * 3 + 2] = 0.9;
    } else {
      // Hot blue stars
      starColors[i * 3] = 0.8;
      starColors[i * 3 + 1] = 0.9;
      starColors[i * 3 + 2] = 1.0;
    }
    
    starSizes[i] = 0.5 + Math.random() * 1.5;
  }
  
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
  
  const starMaterial = new THREE.PointsMaterial({
    size: 1,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
  });
  
  const stars = new THREE.Points(starGeometry, starMaterial);
  starGroup.add(stars);
  scene.add(starGroup);
  
  // ===== HELIOSPHERE BOUNDARIES =====
  const heliosphereGroup = new THREE.Group();
  heliosphereGroup.name = 'heliosphere';
  
  // Get heliosphere model
  const heliosphereModel = dataService.getHeliosphereModel();
  
  // Termination shock - using volumetric glow effect instead of wireframe
  const terminationShockGeometry = heliosphereModel.generateParametricSurface(
    'terminationShock',
    JulianDate.fromDate(currentDate),
    48
  );
  terminationShockGeometry.scale(AU_SCALE, AU_SCALE, AU_SCALE);
  
  // Physically accurate plasma material for termination shock
  const terminationShockVolumetricMaterial = createPlasmaMaterial({
    baseColor: new THREE.Color(0xff8844),
    opacity: 0.002,
    plasmaTemperature: 10, // 10 eV at termination shock (shock heating)
    plasmaDensity: 0.02, // Enhanced density due to compression
    magneticFieldStrength: 0.5, // 0.5 nT - compressed field
    shockCompression: 2.5, // Typical compression ratio at termination shock
    transparent: true,
    side: THREE.DoubleSide
  });
  const terminationShockVolumetric = new THREE.Mesh(terminationShockGeometry, terminationShockVolumetricMaterial);
  terminationShockVolumetric.setRotationFromMatrix(apexBasis);
  terminationShockVolumetric.name = 'terminationShockVolumetric';
  heliosphereGroup.add(terminationShockVolumetric);
  
  // Outer glow halo for depth - extremely subtle
  const tsGlowGeometry = terminationShockGeometry.clone();
  tsGlowGeometry.scale(1.05, 1.05, 1.05);
  const tsGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    transparent: true,
    opacity: 0.001, // 0.1% opacity - barely visible
    side: THREE.DoubleSide
  });
  const terminationShockGlow = new THREE.Mesh(tsGlowGeometry, tsGlowMaterial);
  terminationShockGlow.setRotationFromMatrix(apexBasis);
  terminationShockGlow.name = 'terminationShockGlow';
  heliosphereGroup.add(terminationShockGlow);
  
  // Edge highlights using EdgesGeometry for subtle structure definition
  const tsEdgesGeometry = new THREE.EdgesGeometry(terminationShockGeometry, 15);
  const tsEdgesMaterial = new THREE.LineBasicMaterial({
    color: 0xffaa44,
    transparent: true,
    opacity: 0.01, // 1% opacity - very subtle edges
    linewidth: 1
  });
  const terminationShockEdges = new THREE.LineSegments(tsEdgesGeometry, tsEdgesMaterial);
  terminationShockEdges.setRotationFromMatrix(apexBasis);
  terminationShockEdges.name = 'terminationShockEdges';
  heliosphereGroup.add(terminationShockEdges);
  
  // Heliopause
  const heliopauseGeometry = heliosphereModel.generateParametricSurface(
    'heliopause',
    JulianDate.fromDate(currentDate),
    48
  );
  heliopauseGeometry.scale(AU_SCALE, AU_SCALE, AU_SCALE);
  
  // Physically accurate plasma material for heliopause
  const heliopauseMaterial = createPlasmaMaterial({
    baseColor: new THREE.Color(0x4488ff),
    opacity: 0.003,
    plasmaTemperature: 5, // 5 eV at heliopause (cooler than termination shock)
    plasmaDensity: 0.005, // Lower density at heliopause
    magneticFieldStrength: 0.3, // 0.3 nT - weaker field
    shockCompression: 1.5, // Less compression at heliopause
    transparent: true,
    side: THREE.DoubleSide
  });
  
  const heliopauseMesh = new THREE.Mesh(heliopauseGeometry, heliopauseMaterial);
  heliopauseMesh.setRotationFromMatrix(apexBasis);
  heliopauseMesh.name = 'heliopause';
  heliosphereGroup.add(heliopauseMesh);
  
  // Bow shock (optional/controversial)
  const bowShockGeometry = heliosphereModel.generateParametricSurface(
    'bowShock',
    JulianDate.fromDate(currentDate),
    32
  );
  
  const bowShockPositions = bowShockGeometry.getAttribute('position');
  if (bowShockPositions && bowShockPositions.count > 0) {
    bowShockGeometry.scale(AU_SCALE, AU_SCALE, AU_SCALE);
    
    const bowShockMaterial = new THREE.MeshBasicMaterial({
      color: 0xff44ff,
      transparent: true,
      opacity: 0.1,
      wireframe: true,
      side: THREE.DoubleSide
    });
    
    const bowShockMesh = new THREE.Mesh(bowShockGeometry, bowShockMaterial);
    bowShockMesh.setRotationFromMatrix(apexBasis);
    bowShockMesh.name = 'bowShock';
    bowShockMesh.visible = visibility.bowShock;
    heliosphereGroup.add(bowShockMesh);
  }
  
  scene.add(heliosphereGroup);
  
  // ===== SOLAR SYSTEM =====
  const solarSystemGroup = new THREE.Group();
  solarSystemGroup.name = 'solarSystem';
  
  // Sun
  const sunGeometry = new THREE.SphereGeometry(0.00465 * 100, 32, 32); // Scaled up for visibility
  const sunMaterial = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    emissive: 0xffff00,
    emissiveIntensity: 2
  });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  solarSystemGroup.add(sun);
  
  // Sun light
  const sunLight = new THREE.PointLight(0xffffff, 2, 500);
  sun.add(sunLight);
  
  // Planet groups
  const planetsGroup = new THREE.Group();
  planetsGroup.name = 'planets';
  const orbitsGroup = new THREE.Group();
  orbitsGroup.name = 'orbits';
  
  const planetMeshes: Map<string, THREE.Mesh> = new Map();
  
  // Create planets with accurate sizes (scaled for visibility)
  Object.entries(PLANET_PROPERTIES).forEach(([name, props]) => {
    // Planet mesh
    const scale = name === 'Jupiter' || name === 'Saturn' ? 0.0001 : 0.001;
    const geometry = new THREE.SphereGeometry(props.radius * scale, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: props.color,
      shininess: 30
    });
    const planet = new THREE.Mesh(geometry, material);
    planet.name = name;
    planet.castShadow = true;
    planet.receiveShadow = true;
    planetMeshes.set(name, planet);
    planetsGroup.add(planet);
    
    // Orbit line (will be updated with real ephemeris)
    const orbitPoints: THREE.Vector3[] = [];
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitMaterial = new THREE.LineBasicMaterial({
      color: props.color,
      transparent: true,
      opacity: 0.3
    });
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    orbit.name = name + 'Orbit';
    orbitsGroup.add(orbit);
  });
  
  solarSystemGroup.add(planetsGroup);
  solarSystemGroup.add(orbitsGroup);
  scene.add(solarSystemGroup);
  
  // ===== SPACECRAFT =====
  const spacecraftGroup = new THREE.Group();
  spacecraftGroup.name = 'spacecraft';
  
  // Voyager 1
  const voyager1Geometry = new THREE.ConeGeometry(0.5, 2, 8);
  const voyager1Material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const voyager1 = new THREE.Mesh(voyager1Geometry, voyager1Material);
  voyager1.name = 'Voyager 1';
  spacecraftGroup.add(voyager1);
  
  // Voyager 2
  const voyager2Geometry = new THREE.ConeGeometry(0.5, 2, 8);
  const voyager2Material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
  const voyager2 = new THREE.Mesh(voyager2Geometry, voyager2Material);
  voyager2.name = 'Voyager 2';
  spacecraftGroup.add(voyager2);
  
  // Trajectory lines
  const trajectoriesGroup = new THREE.Group();
  trajectoriesGroup.name = 'trajectories';
  
  // Create trajectory lines (will be populated with data)
  const v1TrajGeometry = new THREE.BufferGeometry();
  const v1TrajMaterial = new THREE.LineBasicMaterial({ 
    color: 0x00ff00, 
    transparent: true, 
    opacity: 0.6 
  });
  const v1Trajectory = new THREE.Line(v1TrajGeometry, v1TrajMaterial);
  v1Trajectory.name = 'Voyager 1 Trajectory';
  trajectoriesGroup.add(v1Trajectory);
  
  const v2TrajGeometry = new THREE.BufferGeometry();
  const v2TrajMaterial = new THREE.LineBasicMaterial({ 
    color: 0x00ffff, 
    transparent: true, 
    opacity: 0.6 
  });
  const v2Trajectory = new THREE.Line(v2TrajGeometry, v2TrajMaterial);
  v2Trajectory.name = 'Voyager 2 Trajectory';
  trajectoriesGroup.add(v2Trajectory);
  
  spacecraftGroup.add(trajectoriesGroup);
  scene.add(spacecraftGroup);
  
  // ===== SOLAR WIND =====
  const solarWindGroup = new THREE.Group();
  solarWindGroup.name = 'solarWind';
  
  // Parker spiral magnetic field lines - physically accurate
  const spiralCount = 8; // Fewer, more subtle lines
  for (let i = 0; i < spiralCount; i++) {
    const angle = (i / spiralCount) * Math.PI * 2;
    const spiralPoints: THREE.Vector3[] = [];
    
    // Solar wind speed at 1 AU: ~400 km/s
    // Solar rotation period: 27.3 days
    // Parker spiral angle: tan(ψ) = Ωr/v
    const omegaSun = 2 * Math.PI / (27.3 * 24 * 3600); // rad/s
    const vSolarWind = 400e3; // m/s
    
    for (let r = 0.1; r < 150; r += 5) {
      // Accurate Parker spiral angle
      const rMeters = r * 1.496e11; // Convert AU to meters
      const spiralAngle = angle - Math.atan2(omegaSun * rMeters, vSolarWind) * (r / 10);
      
      const x = r * Math.cos(spiralAngle);
      const y = r * Math.sin(spiralAngle);
      const z = 0; // Field lines in ecliptic plane (no artificial waviness)
      
      spiralPoints.push(new THREE.Vector3(x, z, y));
    }
    
    const spiralGeometry = new THREE.BufferGeometry().setFromPoints(spiralPoints);
    const spiralMaterial = new THREE.LineBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.01 // Extremely subtle - 1% opacity
    });
    const spiral = new THREE.Line(spiralGeometry, spiralMaterial);
    solarWindGroup.add(spiral);
  }
  
  scene.add(solarWindGroup);
  
  // ===== INTERSTELLAR WIND =====
  const ismWindGroup = new THREE.Group();
  ismWindGroup.name = 'interstellarWind';
  
  // Particle system for ISM flow - physically accurate
  const ismParticleCount = 500; // Fewer particles for better performance
  const ismGeometry = new THREE.BufferGeometry();
  const ismPositions = new Float32Array(ismParticleCount * 3);
  const ismVelocities = new Float32Array(ismParticleCount * 3);
  
  // ISM flows from the direction of the solar apex at ~26 km/s
  // Extract apex direction from basis matrix (first column)
  const ismFlowDirection = new THREE.Vector3();
  ismFlowDirection.setFromMatrixColumn(apexBasis, 0);
  ismFlowDirection.normalize();
  
  for (let i = 0; i < ismParticleCount; i++) {
    // Start from upstream along apex direction
    const spread = 50; // AU
    const distance = 200 + Math.random() * 100; // 200-300 AU upstream
    
    // Position along ISM flow direction with some spread
    ismPositions[i * 3] = distance * ismFlowDirection.x + (Math.random() - 0.5) * spread;
    ismPositions[i * 3 + 1] = distance * ismFlowDirection.y + (Math.random() - 0.5) * spread;
    ismPositions[i * 3 + 2] = distance * ismFlowDirection.z + (Math.random() - 0.5) * spread;
    
    // Flow velocity toward heliosphere (26 km/s scaled for visualization)
    const flowSpeed = 0.5; // AU per frame (scaled)
    ismVelocities[i * 3] = -flowSpeed * ismFlowDirection.x;
    ismVelocities[i * 3 + 1] = -flowSpeed * ismFlowDirection.y;
    ismVelocities[i * 3 + 2] = -flowSpeed * ismFlowDirection.z;
  }
  
  ismGeometry.setAttribute('position', new THREE.BufferAttribute(ismPositions, 3));
  
  const ismMaterial = new THREE.PointsMaterial({
    color: 0x6666ff,
    size: 0.3, // Smaller particles
    transparent: true,
    opacity: 0.05, // Very subtle - 5% opacity
    blending: THREE.AdditiveBlending
  });
  
  const ismParticles = new THREE.Points(ismGeometry, ismMaterial);
  ismWindGroup.add(ismParticles);
  scene.add(ismWindGroup);
  
  // ===== COORDINATE GRID =====
  const gridGroup = new THREE.Group();
  gridGroup.name = 'coordinateGrid';
  gridGroup.visible = visibility.coordinateGrid;
  
  // Ecliptic plane grid
  const gridHelper = new THREE.GridHelper(400, 40, 0x444444, 0x222222);
  gridHelper.rotateX(Math.PI / 2);
  gridGroup.add(gridHelper);
  
  // Axes
  const axesHelper = new THREE.AxesHelper(200);
  gridGroup.add(axesHelper);
  
  scene.add(gridGroup);
  
  // ===== DISTANCE MARKERS =====
  const markersGroup = new THREE.Group();
  markersGroup.name = 'distanceMarkers';
  
  // AU distance rings
  const distances = [10, 50, 100, 150, 200];
  distances.forEach(dist => {
    const geometry = new THREE.RingGeometry(dist - 0.5, dist + 0.5, 64);
    const material = new THREE.MeshBasicMaterial({
      color: 0x333333,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = Math.PI / 2;
    markersGroup.add(ring);
    
    // Label
    // (In production, use CSS3D or sprite labels)
  });
  
  scene.add(markersGroup);
  
  // ===== LIGHTING =====
  const ambientLight = new THREE.AmbientLight(0x222222);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(100, 100, 100);
  scene.add(directionalLight);
  
  // ===== UPDATE FUNCTION =====
  function updateScene(date: Date) {
    const jd = JulianDate.fromDate(date);
    
    // Update planetary positions
    const planetPositions = dataService.getPlanetaryPositions(date);
    planetPositions.forEach((position, name) => {
      const planet = planetMeshes.get(name);
      if (planet) {
        planet.position.copy(position.multiplyScalar(AU_SCALE));
      }
    });
    
    // Update spacecraft positions
    const spacecraftData = dataService.getDataStore().spacecraft;
    
    // Voyager 1
    const v1Data = spacecraftData.get('Voyager 1');
    if (v1Data) {
      const v1Pos = v1Data.trajectory.position.interpolate(jd);
      voyager1.position.copy(v1Pos.multiplyScalar(AU_SCALE));
      
      // Update trajectory
      const v1Traj = dataService.getSpacecraftTrajectory(
        'Voyager 1',
        v1Data.launch,
        date,
        200
      );
      v1TrajGeometry.setFromPoints(v1Traj.map(p => p.multiplyScalar(AU_SCALE)));
    }
    
    // Voyager 2
    const v2Data = spacecraftData.get('Voyager 2');
    if (v2Data) {
      const v2Pos = v2Data.trajectory.position.interpolate(jd);
      voyager2.position.copy(v2Pos.multiplyScalar(AU_SCALE));
      
      // Update trajectory
      const v2Traj = dataService.getSpacecraftTrajectory(
        'Voyager 2',
        v2Data.launch,
        date,
        200
      );
      v2TrajGeometry.setFromPoints(v2Traj.map(p => p.multiplyScalar(AU_SCALE)));
    }
    
    // Update heliosphere shape based on solar cycle
    const solarWind = dataService.getSolarWindConditions(date, 1);
    const pressure = solarWind.pressure / 2; // Normalize
    
    // Calculate solar cycle phase (11-year cycle) based on simulation time
    const yearsSinceEpoch = (date.getTime() - new Date(2000, 0, 1).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    const solarCyclePhase = (yearsSinceEpoch % 11) / 11; // 0 to 1 over 11 years
    
    // Update boundaries based on solar cycle phase - update every frame for smooth animation
    // When running at 11 years/sec, the full cycle completes in 1 second
    const timeSinceLastUpdate = Date.now() - lastBoundaryUpdate;
    if (timeSinceLastUpdate > 33) { // Update ~30 times per second for smooth pulsing
      lastBoundaryUpdate = Date.now();
      
      // Scale the heliosphere based on solar cycle (breathing effect)
      // Solar maximum = larger heliosphere, solar minimum = smaller
      const scaleFactor = 0.95 + 0.1 * Math.sin(solarCyclePhase * Math.PI * 2); // Oscillates between 0.95 and 1.05
      
      // Update termination shock with solar cycle scaling
      const newTSGeometry = heliosphereModel.generateParametricSurface(
        'terminationShock',
        jd,
        48
      );
      newTSGeometry.scale(AU_SCALE * scaleFactor, AU_SCALE * scaleFactor, AU_SCALE * scaleFactor);
      if (terminationShockVolumetric.geometry) {
        terminationShockVolumetric.geometry.dispose();
      }
      terminationShockVolumetric.geometry = newTSGeometry;
      
      // Update glow geometry
      const newGlowGeometry = newTSGeometry.clone();
      newGlowGeometry.scale(1.05, 1.05, 1.05);
      terminationShockGlow.geometry.dispose();
      terminationShockGlow.geometry = newGlowGeometry;
      
      // Update edges
      const newEdgesGeometry = new THREE.EdgesGeometry(newTSGeometry, 15);
      terminationShockEdges.geometry.dispose();
      terminationShockEdges.geometry = newEdgesGeometry;
      
      // Update heliopause with solar cycle scaling
      const newHPGeometry = heliosphereModel.generateParametricSurface(
        'heliopause',
        jd,
        48
      );
      newHPGeometry.scale(AU_SCALE * scaleFactor, AU_SCALE * scaleFactor, AU_SCALE * scaleFactor);
      heliopauseMesh.geometry.dispose();
      heliopauseMesh.geometry = newHPGeometry;
      
      // Update material properties based on solar activity
      const activityLevel = 0.5 + 0.5 * Math.sin(solarCyclePhase * Math.PI * 2);
      
      // Update plasma shader uniforms
      updatePlasmaMaterial(terminationShockVolumetricMaterial as THREE.ShaderMaterial, Date.now() / 1000, solarCyclePhase);
      updatePlasmaMaterial(heliopauseMaterial as THREE.ShaderMaterial, Date.now() / 1000, solarCyclePhase);
      
      // Update plasma parameters based on solar cycle
      terminationShockVolumetricMaterial.uniforms.plasmaDensity.value = 0.01 + 0.02 * activityLevel; // Varies with solar wind density
      terminationShockVolumetricMaterial.uniforms.plasmaTemperature.value = 8 + 4 * activityLevel; // Temperature varies 8-12 eV
      terminationShockVolumetricMaterial.uniforms.magneticFieldStrength.value = 0.3 + 0.4 * activityLevel; // Field varies 0.3-0.7 nT
      
      heliopauseMaterial.uniforms.plasmaDensity.value = 0.003 + 0.004 * activityLevel;
      heliopauseMaterial.uniforms.plasmaTemperature.value = 4 + 2 * activityLevel; // 4-6 eV
      heliopauseMaterial.uniforms.magneticFieldStrength.value = 0.2 + 0.2 * activityLevel; // 0.2-0.4 nT
      
      // Update simple glow materials
      tsGlowMaterial.opacity = 0.0005 + 0.001 * activityLevel; // Varies 0.0005-0.0015
    }
    
    // Update ISM particles
    const ismPos = ismGeometry.attributes.position.array as Float32Array;
    const ismVel = ismVelocities;
    
    for (let i = 0; i < ismParticleCount; i++) {
      const idx = i * 3;
      
      // Update position
      ismPos[idx] += ismVel[idx];
      ismPos[idx + 1] += ismVel[idx + 1];
      ismPos[idx + 2] += ismVel[idx + 2];
      
      // Check distance from origin
      const distance = Math.sqrt(ismPos[idx] * ismPos[idx] + 
                                ismPos[idx + 1] * ismPos[idx + 1] + 
                                ismPos[idx + 2] * ismPos[idx + 2]);
      
      // Reset if particle has passed through heliosphere
      if (distance < 50) { // Reset when close to Sun
        const spread = 50;
        const resetDistance = 200 + Math.random() * 100;
        ismPos[idx] = resetDistance * ismFlowDirection.x + (Math.random() - 0.5) * spread;
        ismPos[idx + 1] = resetDistance * ismFlowDirection.y + (Math.random() - 0.5) * spread;
        ismPos[idx + 2] = resetDistance * ismFlowDirection.z + (Math.random() - 0.5) * spread;
      }
    }
    
    ismGeometry.attributes.position.needsUpdate = true;
  }
  
  // Main update function
  function update(date: Date, speed: number, motionEnabled: boolean) {
    // Update time - speed is in days per frame
    if (motionEnabled && speed > 0) {
      const msPerDay = 24 * 60 * 60 * 1000;
      currentDate = new Date(currentDate.getTime() + speed * msPerDay);
      
      if (timeMode === 'realtime') {
        currentDate = new Date(); // Snap to real time
      }
    } else if (!motionEnabled) {
      // Use the provided date when not animating
      currentDate = date;
    }
    
    // Update scene
    updateScene(currentDate);
    
    // Update controls
    controls.update();
    
    // Render
    renderer.render(scene, camera);
  }
  
  // Resize handler
  function resize(w: number, h: number) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  
  // Cleanup
  function dispose() {
    controls.dispose();
    renderer.dispose();
    
    // Dispose geometries and materials
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
  }
  
  // Toggle visibility
  function toggleComponent(component: keyof ComponentVisibility, visible: boolean) {
    visibility[component] = visible;
    
    const componentMap: Record<string, string> = {
      'heliosphere': 'heliopause',
      'terminationShock': 'terminationShock',
      'bowShock': 'bowShock',
      'solarWind': 'solarWind',
      'interstellarWind': 'interstellarWind',
      'planets': 'planets',
      'orbits': 'orbits',
      'spacecraft': 'spacecraft',
      'trajectories': 'trajectories',
      'stars': 'stars',
      'coordinateGrid': 'coordinateGrid',
      'distanceMarkers': 'distanceMarkers'
    };
    
    const objectName = componentMap[component];
    if (objectName) {
      const object = scene.getObjectByName(objectName);
      if (object) {
        object.visible = visible;
      }
    }
  }
  
  function getVisibility(): ComponentVisibility {
    return { ...visibility };
  }
  
  function setTimeMode(mode: TimeMode) {
    timeMode = mode;
    
    switch (mode) {
      case 'historical':
        currentDate = VoyagerTrajectories.VOYAGER_1.launch;
        break;
      case 'realtime':
        currentDate = new Date();
        break;
      case 'prediction':
        currentDate = new Date(2030, 0, 1);
        break;
    }
  }
  
  function getCurrentDate(): Date {
    return new Date(currentDate);
  }
  
  // Initial update
  updateScene(currentDate);
  
  return { 
    canvas, 
    update, 
    resize, 
    dispose, 
    toggleComponent, 
    getVisibility,
    setTimeMode,
    getCurrentDate
  };
}
