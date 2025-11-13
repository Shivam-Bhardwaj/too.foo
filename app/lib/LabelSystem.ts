/**
 * Label system for celestial objects
 * Uses CSS3D or sprite-based labels that always face the camera
 */

import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

export interface LabelInfo {
  text: string;
  position: THREE.Vector3;
  offset?: THREE.Vector3; // Offset from object position
  color?: string;
  fontSize?: number;
  showDistance?: boolean; // Show distance in AU
  showMagnitude?: boolean; // For stars
}

export class LabelManager {
  private css3DRenderer?: CSS3DRenderer;
  private css3DScene?: THREE.Scene;
  private labels: Map<string, CSS3DObject> = new Map();
  private container: HTMLElement;
  private camera: THREE.Camera;
  
  constructor(container: HTMLElement, camera: THREE.Camera) {
    this.container = container;
    this.camera = camera;
    
    // Initialize CSS3D renderer
    this.css3DRenderer = new CSS3DRenderer();
    this.css3DRenderer.setSize(window.innerWidth, window.innerHeight);
    this.css3DRenderer.domElement.style.position = 'absolute';
    this.css3DRenderer.domElement.style.top = '0';
    this.css3DRenderer.domElement.style.pointerEvents = 'none';
    this.container.appendChild(this.css3DRenderer.domElement);
    
    this.css3DScene = new THREE.Scene();
  }
  
  /**
   * Create a label for an object
   */
  createLabel(id: string, info: LabelInfo): void {
    // Remove existing label if present
    this.removeLabel(id);
    
    const element = document.createElement('div');
    element.className = 'celestial-label';
    // Tiny balloon-style label - mobile-friendly size
    const fontSize = info.fontSize || 8; // Much smaller default (was 12)
    element.style.cssText = `
      color: ${info.color || '#ffffff'};
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: ${fontSize}px;
      font-weight: 400;
      text-align: center;
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.85), rgba(20, 20, 40, 0.85));
      padding: 2px 4px;
      border-radius: 3px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
      backdrop-filter: blur(2px);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
      transform-style: preserve-3d;
    `;
    
    let labelText = info.text;
    if (info.showDistance && info.position) {
      const distance = info.position.length() / 0.03; // Convert scene units to AU
      labelText += ` (${distance.toFixed(1)} AU)`;
    }
    if (info.showMagnitude) {
      // Would need magnitude data
    }
    
    element.textContent = labelText;
    
    // Add scale disclaimer as a subtle footer (only for first label created)
    if (this.labels.size === 0) {
      const disclaimer = document.createElement('div');
      disclaimer.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        font-family: 'Inter', -apple-system, sans-serif;
        font-size: 10px;
        color: rgba(255, 255, 255, 0.4);
        pointer-events: none;
        user-select: none;
      `;
      disclaimer.textContent = '⚠ Objects shown at enhanced scale for visibility';
      this.container.appendChild(disclaimer);
    }
    
    const label = new CSS3DObject(element);
    const offset = info.offset || new THREE.Vector3(0, 0.5, 0);
    label.position.copy(info.position).add(offset);
    
    // Fix orientation - ensure label faces camera correctly (not upside down)
    // CSS3D objects need to be rotated to face camera properly
    label.rotation.set(0, 0, 0);
    
    this.css3DScene!.add(label);
    this.labels.set(id, label);
  }
  
  /**
   * Remove a label
   */
  removeLabel(id: string): void {
    const label = this.labels.get(id);
    if (label) {
      this.css3DScene!.remove(label);
      this.labels.delete(id);
    }
  }
  
  /**
   * Update label positions based on camera
   */
  update(camera: THREE.Camera): void {
    this.camera = camera;
    
    // Update CSS3D renderer size
    if (this.css3DRenderer) {
      this.css3DRenderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // Fix label orientation - CSS3DObject handles lookAt automatically
    // But we need to ensure they're not flipped upside down
    this.labels.forEach((label) => {
      // Make label face camera
      label.lookAt(camera.position);
      
      // CSS3D can flip labels - add a small offset to prevent flipping
      // Use a slight upward bias to keep labels readable
      const lookAtTarget = camera.position.clone();
      lookAtTarget.y += 0.1; // Small upward bias
      label.lookAt(lookAtTarget);
    });
    
    // Render CSS3D labels
    if (this.css3DRenderer && this.css3DScene) {
      this.css3DRenderer.render(this.css3DScene, camera);
    }
  }
  
  /**
   * Update label visibility based on distance
   */
  updateVisibility(camera: THREE.Camera, minDistance: number = 0.5, maxDistance: number = 50): void {
    this.labels.forEach((label, id) => {
      const distance = camera.position.distanceTo(label.position);
      const visible = distance >= minDistance && distance <= maxDistance;
      label.element.style.display = visible ? 'block' : 'none';
      
      // Minimal scaling - keep labels small and readable
      // Scale very slightly based on distance, but keep it subtle
      const scale = Math.max(0.8, Math.min(1.2, 15 / distance));
      // Apply scale without breaking orientation
      label.scale.set(scale, scale, scale);
    });
  }
  
  /**
   * Toggle all labels
   */
  setVisible(visible: boolean): void {
    this.labels.forEach((label) => {
      label.element.style.display = visible ? 'block' : 'none';
    });
  }
  
  /**
   * Cleanup
   */
  dispose(): void {
    this.labels.forEach((label) => {
      this.css3DScene!.remove(label);
    });
    this.labels.clear();
    
    if (this.css3DRenderer && this.css3DRenderer.domElement.parentNode) {
      this.css3DRenderer.domElement.parentNode.removeChild(this.css3DRenderer.domElement);
    }
  }
  
  /**
   * Resize handler
   */
  resize(width: number, height: number): void {
    if (this.css3DRenderer) {
      this.css3DRenderer.setSize(width, height);
    }
  }
}
