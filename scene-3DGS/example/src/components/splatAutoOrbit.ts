export type Vec3 = [number, number, number];

export type AutoOrbitState = {
  target: Vec3;
  radius: number;
  height: number;
  angle: number;
};

export type AutoOrbitStatus = {
  autoOrbit: boolean;
  loading: boolean;
  hasAsset: boolean;
  userInteracted: boolean;
  orbitState: AutoOrbitState | null;
};

export type AutoOrbitStep = {
  state: AutoOrbitState;
  position: Vec3;
};

const MIN_ORBIT_RADIUS = 1e-4;

function normalizeAssetPath(src: string) {
  return src.split(/[?#]/, 1)[0].toLowerCase();
}

export function shouldEnableAutoOrbitByDefault(src: string) {
  return normalizeAssetPath(src).endsWith('.sog');
}

export function createAutoOrbitState(
  cameraPosition: Vec3,
  target: Vec3,
): AutoOrbitState | null {
  const dx = cameraPosition[0] - target[0];
  const dz = cameraPosition[2] - target[2];
  const radius = Math.hypot(dx, dz);

  if (radius < MIN_ORBIT_RADIUS) {
    return null;
  }

  return {
    target: [...target] as Vec3,
    radius,
    height: cameraPosition[1] - target[1],
    angle: Math.atan2(dz, dx),
  };
}

export function shouldRunAutoOrbit({
  autoOrbit,
  loading,
  hasAsset,
  userInteracted,
  orbitState,
}: AutoOrbitStatus) {
  return autoOrbit && !loading && hasAsset && !userInteracted && orbitState !== null;
}

export function advanceAutoOrbit(
  state: AutoOrbitState,
  dt: number,
  angularSpeed: number,
): AutoOrbitStep {
  const nextAngle = state.angle + angularSpeed * dt;

  return {
    state: {
      ...state,
      angle: nextAngle,
    },
    position: [
      state.target[0] + Math.cos(nextAngle) * state.radius,
      state.target[1] + state.height,
      state.target[2] + Math.sin(nextAngle) * state.radius,
    ],
  };
}
