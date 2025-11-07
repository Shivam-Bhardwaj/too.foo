// RA (radians), Dec (radians) → Cartesian unit vector
export function radecToVec3(ra: number, dec: number): [number, number, number] {
  const x = Math.cos(dec) * Math.cos(ra);
  const y = Math.cos(dec) * Math.sin(ra);
  const z = Math.sin(dec);
  const len = Math.hypot(x, y, z) || 1;
  return [x / len, y / len, z / len];
}

export const APEX_RA = (18 / 24) * 2 * Math.PI; // 18h → radians
export const APEX_DEC = (30 * Math.PI) / 180; // +30°
export const APEX_DIR = radecToVec3(APEX_RA, APEX_DEC); // world-space drift axis
export const ECLIPTIC_TILT = (23.44 * Math.PI) / 180;

