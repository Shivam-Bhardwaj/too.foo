import * as THREE from 'three';

export const APEX_RA = (18 / 24) * 2 * Math.PI; // 18h → radians
export const APEX_DEC = (30 * Math.PI) / 180; // +30°

// RA (radians), Dec (radians) → Cartesian unit vector (normalized)
export function radecToVec3(ra: number, dec: number): THREE.Vector3 {
  const x = Math.cos(dec) * Math.cos(ra);
  const y = Math.cos(dec) * Math.sin(ra);
  const z = Math.sin(dec);
  return new THREE.Vector3(x, y, z).normalize();
}

export const APEX_DIR = radecToVec3(APEX_RA, APEX_DEC); // world-space drift axis
export const ECLIPTIC_TILT = (23.44 * Math.PI) / 180;

export function basisFromApex(): THREE.Matrix4 {
  // Build an orthonormal basis where x-axis aligns with APEX_DIR (screen +X).
  const x = APEX_DIR.clone().normalize(); // sideways (to the right)
  const upHelper = new THREE.Vector3(0, 1, 0);

  if (Math.abs(x.dot(upHelper)) > 0.95) {
    upHelper.set(0, 0, 1);
  }

  const z = new THREE.Vector3().crossVectors(x, upHelper).normalize(); // screen depth
  const y = new THREE.Vector3().crossVectors(z, x).normalize(); // screen up

  return new THREE.Matrix4().makeBasis(x, y, z);
}

