import { describe, expect, it } from 'vitest';

import {
  advanceAutoOrbit,
  createAutoOrbitState,
  shouldEnableAutoOrbitByDefault,
  shouldRunAutoOrbit,
} from './splatAutoOrbit';

describe('shouldEnableAutoOrbitByDefault', () => {
  it('enables auto orbit for sog assets', () => {
    expect(shouldEnableAutoOrbitByDefault('/scene.sog')).toBe(true);
  });

  it('ignores query string and hash fragments', () => {
    expect(shouldEnableAutoOrbitByDefault('/scene.sog?version=1#demo')).toBe(true);
  });

  it('keeps non-sog assets disabled by default', () => {
    expect(shouldEnableAutoOrbitByDefault('/scene.ply')).toBe(false);
  });
});

describe('shouldRunAutoOrbit', () => {
  it('runs only after the asset is loaded and before user interaction', () => {
    expect(
      shouldRunAutoOrbit({
        autoOrbit: true,
        loading: false,
        hasAsset: true,
        userInteracted: false,
        orbitState: createAutoOrbitState([12, 11, 8], [8, 5, 8]),
      }),
    ).toBe(true);
  });

  it('stays disabled while loading or after user interaction', () => {
    const orbitState = createAutoOrbitState([12, 11, 8], [8, 5, 8]);

    expect(
      shouldRunAutoOrbit({
        autoOrbit: true,
        loading: true,
        hasAsset: false,
        userInteracted: false,
        orbitState,
      }),
    ).toBe(false);

    expect(
      shouldRunAutoOrbit({
        autoOrbit: true,
        loading: false,
        hasAsset: true,
        userInteracted: true,
        orbitState,
      }),
    ).toBe(false);
  });
});

describe('auto orbit math', () => {
  it('returns null when a stable horizontal orbit radius cannot be derived', () => {
    expect(createAutoOrbitState([8, 11, 8], [8, 5, 8])).toBeNull();
  });

  it('advances the camera around the target while preserving radius and height', () => {
    const orbitState = createAutoOrbitState([12, 11, 8], [8, 5, 8]);
    expect(orbitState).not.toBeNull();

    const result = advanceAutoOrbit(orbitState!, 1, Math.PI / 2);

    expect(result.position[0]).toBeCloseTo(8, 6);
    expect(result.position[1]).toBeCloseTo(11, 6);
    expect(result.position[2]).toBeCloseTo(12, 6);
    expect(result.state.radius).toBeCloseTo(4, 6);
    expect(result.state.height).toBeCloseTo(6, 6);
  });
});
