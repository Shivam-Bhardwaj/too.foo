/**
 * GPU-instanced starfield rendering
 * Uses nearby star catalog with optional panoramic background
 */

import * as THREE from 'three';
import { StarArrays, SoA } from '../data/StructureOfArrays';
import { Registry } from '../registry/Registry';
import { AU, Units } from '../types/units';

/**
 * Starfield configuration
 */
export interface StarFieldConfig {
  maxStars: number;
  nearbyRadiusAU: number;  // Radius for nearby stars (AU)
  usePanorama: boolean;     // Use panoramic background tiles
  enableProperMotion: boolean;
}

/**
 * GPU-instanced starfield renderer
 */
export class StarField {
  private registry: Registry;
  private config: StarFieldConfig;
  
  // Star data
  private stars: StarArrays;
  
  // Rendering
  private instancedMesh: THREE.InstancedMesh;
  private geometry: THREE.SphereGeometry;
  private material: THREE.ShaderMaterial;
  
  // Panorama background (optional)
  private panoramaSphere: THREE.Mesh | null = null;
  
  constructor(registry: Registry, config: Partial<StarFieldConfig> = {}) {
    this.registry = registry;
    
    this.config = {
      maxStars: 20_000,
      nearbyRadiusAU: 6.5e6, // ~100 parsecs in AU
      usePanorama: true,
      enableProperMotion: false,
      ...config,
    };
    
    // Initialize star data
    this.stars = SoA.createStars(this.config.maxStars, this.config.enableProperMotion);
    
    // Create rendering objects
    this.geometry = new THREE.SphereGeometry(1, 8, 8);
    this.material = this.createStarMaterial();
    
    this.instancedMesh = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      this.config.maxStars
    );
    
    this.instancedMesh.frustumCulled = false;
    
    // Create panorama if enabled
    if (this.config.usePanorama) {
      this.createPanorama();
    }
    
    // Load star catalog
    this.loadStarCatalog();
  }
  
  /**
   * Create star rendering material (instanced)
   */
  private createStarMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        auToScene: { value: 1.0 },
      },
      vertexShader: `
        attribute vec3 color;
        attribute float magnitude;
        
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          
          // Compute size from magnitude
          // Brighter stars (lower magnitude) are larger
          // m = 0 → size = 5.0, m = 6 → size = 1.0
          float size = 5.0 - magnitude * 0.666;
          size = max(1.0, size);
          
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position * size, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Distance-based fade
          float dist = length(mvPosition.xyz);
          gl_PointSize = size * (1000.0 / dist);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          // Circular point with soft edge
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }
  
  /**
   * Create panoramic background sphere
   */
  private createPanorama(): void {
    // Create large sphere for panorama
    const radius = this.registry.auToSceneDistance(Units.AU(this.config.nearbyRadiusAU * 2));
    
    const geometry = new THREE.SphereGeometry(radius, 64, 32);
    
    // For now, use a simple gradient texture
    // In production, would load KTX2 tiles
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    
    // Simple Milky Way-like gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
    gradient.addColorStop(0, '#000814');
    gradient.addColorStop(0.5, '#1a1a2e');
    gradient.addColorStop(1, '#000814');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2048, 1024);
    
    // Add some random stars
    ctx.fillStyle = 'white';
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 1024;
      const size = Math.random() * 1.5;
      ctx.globalAlpha = Math.random() * 0.8 + 0.2;
      ctx.fillRect(x, y, size, size);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.6,
    });
    
    this.panoramaSphere = new THREE.Mesh(geometry, material);
    this.panoramaSphere.name = 'PanoramaSphere';
  }
  
  /**
   * Load star catalog
   * In production, would fetch from dataset
   */
  private loadStarCatalog(): void {
    // Generate synthetic nearby stars
    // In production, load from Gaia DR3 or similar
    
    const numStars = Math.min(5000, this.config.maxStars);
    
    for (let i = 0; i < numStars; i++) {
      // Random position within sphere
      const r = Math.random() * this.config.nearbyRadiusAU;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const pos = {
        x: Units.AU(r * Math.sin(phi) * Math.cos(theta)),
        y: Units.AU(r * Math.sin(phi) * Math.sin(theta)),
        z: Units.AU(r * Math.cos(phi)),
      };
      
      // Random magnitude (0 to 6 for visible stars)
      const magnitude = Math.random() * 6;
      
      // Random color (simplified)
      const temp = Math.random();
      const color = temp < 0.3
        ? { r: 180, g: 200, b: 255 } // Blue
        : temp < 0.7
        ? { r: 255, g: 255, b: 255 } // White
        : { r: 255, g: 200, b: 150 }; // Orange/red
      
      SoA.addStar(this.stars, pos, magnitude, color);
    }
    
    console.log(`StarField: Loaded ${this.stars.count} stars`);
    
    // Update instanced mesh
    this.updateInstancedMesh();
  }
  
  /**
   * Update instanced mesh from star data
   */
  private updateInstancedMesh(): void {
    const auToScene = this.registry.config.auToScene;
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    
    // Set instance matrices
    for (let i = 0; i < this.stars.count; i++) {
      const x = this.stars.posX[i] * auToScene;
      const y = this.stars.posY[i] * auToScene;
      const z = this.stars.posZ[i] * auToScene;
      
      matrix.setPosition(x, y, z);
      this.instancedMesh.setMatrixAt(i, matrix);
      
      // Set color
      color.setRGB(
        this.stars.colorR[i] / 255,
        this.stars.colorG[i] / 255,
        this.stars.colorB[i] / 255
      );
      this.instancedMesh.setColorAt(i, color);
    }
    
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
    
    // Set count
    this.instancedMesh.count = this.stars.count;
  }
  
  /**
   * Update starfield (called each frame if needed)
   */
  update(dt: number): void {
    // Update proper motion if enabled
    if (this.config.enableProperMotion && this.stars.pmRA && this.stars.pmDec) {
      // Apply proper motion (mas/yr converted to position delta)
      // For simplicity, skip for now
    }
    
    // Update material uniforms
    this.material.uniforms.auToScene.value = this.registry.config.auToScene;
  }
  
  /**
   * Get instanced mesh for rendering
   */
  getMesh(): THREE.InstancedMesh {
    return this.instancedMesh;
  }
  
  /**
   * Get panorama sphere (if enabled)
   */
  getPanorama(): THREE.Mesh | null {
    return this.panoramaSphere;
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    
    if (this.panoramaSphere) {
      this.panoramaSphere.geometry.dispose();
      if (this.panoramaSphere.material instanceof THREE.Material) {
        this.panoramaSphere.material.dispose();
      }
    }
  }
}

