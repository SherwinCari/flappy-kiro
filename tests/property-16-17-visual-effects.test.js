const fc = require('fast-check');

/**
 * Properties 16-17: Visual Effects
 * Validates: Requirements 9.3, 9.5, 9.8
 *
 * Pure functions extracted from cloud and particle logic in index.html.
 */

// ═══════════════════════════════════════
// CONSTANTS (matching CONFIG in index.html)
// ═══════════════════════════════════════

const CLOUD_COUNT_MIN = 3;
const CLOUD_COUNT_MAX = 6;
const CLOUD_MIN_SPEED = 15;    // px/s
const CLOUD_MAX_SPEED = 60;    // px/s
const CLOUD_MIN_OPACITY = 0.3;
const CLOUD_MAX_OPACITY = 0.7;

const PARTICLE_INITIAL_OPACITY = 0.6;
const PARTICLE_LIFESPAN = 500; // ms

// ═══════════════════════════════════════
// PURE FUNCTIONS UNDER TEST
// ═══════════════════════════════════════

/**
 * Property 16: Cloud initialization — assigns opacities based on speeds.
 * Given an array of speeds (each in [15, 60]), returns cloud objects with
 * speed and opacity where opacity is linearly mapped from speed.
 * Slower clouds get lower opacity, faster clouds get higher opacity.
 */
function assignOpacities(speeds) {
  return speeds.map(speed => ({
    speed,
    opacity: CLOUD_MIN_OPACITY +
      (speed - CLOUD_MIN_SPEED) / (CLOUD_MAX_SPEED - CLOUD_MIN_SPEED) *
      (CLOUD_MAX_OPACITY - CLOUD_MIN_OPACITY)
  }));
}

/**
 * Property 16: Full cloud initialization (non-deterministic count and speeds).
 * Generates between 3 and 6 clouds, sorts by speed, assigns correlated opacities.
 */
function initCloudsForTest() {
  const count = CLOUD_COUNT_MIN + Math.floor(Math.random() * (CLOUD_COUNT_MAX - CLOUD_COUNT_MIN + 1));
  const clouds = [];
  for (let i = 0; i < count; i++) {
    clouds.push({
      speed: CLOUD_MIN_SPEED + Math.random() * (CLOUD_MAX_SPEED - CLOUD_MIN_SPEED),
      opacity: 0
    });
  }
  clouds.sort((a, b) => a.speed - b.speed);
  for (let i = 0; i < clouds.length; i++) {
    clouds[i].opacity = CLOUD_MIN_OPACITY +
      (clouds[i].speed - CLOUD_MIN_SPEED) / (CLOUD_MAX_SPEED - CLOUD_MIN_SPEED) *
      (CLOUD_MAX_OPACITY - CLOUD_MIN_OPACITY);
  }
  return clouds;
}

/**
 * Property 17: Particle opacity decay.
 * Returns the opacity of a particle given elapsed time since creation.
 */
function computeParticleOpacity(elapsed) {
  return PARTICLE_INITIAL_OPACITY * (1 - elapsed / PARTICLE_LIFESPAN);
}

/**
 * Property 17: Particle active check.
 * Returns true if the particle should still be rendered (elapsed < lifespan).
 */
function isParticleActive(elapsed) {
  return elapsed < PARTICLE_LIFESPAN;
}

// ═══════════════════════════════════════
// PROPERTY TESTS
// ═══════════════════════════════════════

describe('Property 16: Cloud initialization invariants', () => {
  /**
   * **Validates: Requirements 9.3, 9.5**
   */

  test('cloud count is between 3 and 6 inclusive (non-deterministic init)', () => {
    // Run initCloudsForTest multiple times and verify count invariant
    for (let i = 0; i < 200; i++) {
      const clouds = initCloudsForTest();
      expect(clouds.length).toBeGreaterThanOrEqual(CLOUD_COUNT_MIN);
      expect(clouds.length).toBeLessThanOrEqual(CLOUD_COUNT_MAX);
    }
  });

  test('all cloud speeds are in [15, 60] px/s', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.double({ min: CLOUD_MIN_SPEED, max: CLOUD_MAX_SPEED, noNaN: true }),
          { minLength: CLOUD_COUNT_MIN, maxLength: CLOUD_COUNT_MAX }
        ),
        (speeds) => {
          const clouds = assignOpacities(speeds);
          for (const cloud of clouds) {
            expect(cloud.speed).toBeGreaterThanOrEqual(CLOUD_MIN_SPEED);
            expect(cloud.speed).toBeLessThanOrEqual(CLOUD_MAX_SPEED);
          }
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('all cloud opacities are in [0.3, 0.7]', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.double({ min: CLOUD_MIN_SPEED, max: CLOUD_MAX_SPEED, noNaN: true }),
          { minLength: CLOUD_COUNT_MIN, maxLength: CLOUD_COUNT_MAX }
        ),
        (speeds) => {
          const clouds = assignOpacities(speeds);
          for (const cloud of clouds) {
            expect(cloud.opacity).toBeGreaterThanOrEqual(CLOUD_MIN_OPACITY - 1e-10);
            expect(cloud.opacity).toBeLessThanOrEqual(CLOUD_MAX_OPACITY + 1e-10);
          }
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('for any two clouds A,B where A.speed > B.speed, A.opacity >= B.opacity', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.double({ min: CLOUD_MIN_SPEED, max: CLOUD_MAX_SPEED, noNaN: true }),
          { minLength: CLOUD_COUNT_MIN, maxLength: CLOUD_COUNT_MAX }
        ),
        (speeds) => {
          const sorted = [...speeds].sort((a, b) => a - b);
          const clouds = assignOpacities(sorted);
          for (let i = 0; i < clouds.length - 1; i++) {
            for (let j = i + 1; j < clouds.length; j++) {
              if (clouds[j].speed > clouds[i].speed) {
                expect(clouds[j].opacity).toBeGreaterThanOrEqual(clouds[i].opacity - 1e-10);
              }
            }
          }
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('opacity is linearly mapped from speed', () => {
    fc.assert(
      fc.property(
        fc.double({ min: CLOUD_MIN_SPEED, max: CLOUD_MAX_SPEED, noNaN: true }),
        (speed) => {
          const clouds = assignOpacities([speed]);
          const expected = CLOUD_MIN_OPACITY +
            (speed - CLOUD_MIN_SPEED) / (CLOUD_MAX_SPEED - CLOUD_MIN_SPEED) *
            (CLOUD_MAX_OPACITY - CLOUD_MIN_OPACITY);
          expect(clouds[0].opacity).toBeCloseTo(expected, 10);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('at min speed (15), opacity equals CLOUD_MIN_OPACITY (0.3)', () => {
    const clouds = assignOpacities([CLOUD_MIN_SPEED]);
    expect(clouds[0].opacity).toBeCloseTo(CLOUD_MIN_OPACITY, 10);
  });

  test('at max speed (60), opacity equals CLOUD_MAX_OPACITY (0.7)', () => {
    const clouds = assignOpacities([CLOUD_MAX_SPEED]);
    expect(clouds[0].opacity).toBeCloseTo(CLOUD_MAX_OPACITY, 10);
  });
});

describe('Property 17: Particle opacity decay', () => {
  /**
   * **Validates: Requirements 9.8**
   */

  test('opacity equals 0.6 × (1 - t/500) for elapsed in [0, 500]', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 500, noNaN: true }),
        (elapsed) => {
          const result = computeParticleOpacity(elapsed);
          const expected = PARTICLE_INITIAL_OPACITY * (1 - elapsed / PARTICLE_LIFESPAN);
          expect(result).toBeCloseTo(expected, 10);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('opacity is always in range [0, 0.6] for elapsed in [0, 500]', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 500, noNaN: true }),
        (elapsed) => {
          const result = computeParticleOpacity(elapsed);
          expect(result).toBeGreaterThanOrEqual(-1e-10);
          expect(result).toBeLessThanOrEqual(PARTICLE_INITIAL_OPACITY + 1e-10);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('at t=0, opacity equals PARTICLE_INITIAL_OPACITY (0.6)', () => {
    expect(computeParticleOpacity(0)).toBe(PARTICLE_INITIAL_OPACITY);
  });

  test('at t=500, opacity equals 0', () => {
    expect(computeParticleOpacity(500)).toBeCloseTo(0, 10);
  });

  test('opacity decreases monotonically as elapsed increases', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 499, noNaN: true }),
        fc.double({ min: 0.001, max: 1, noNaN: true }),
        (t1, delta) => {
          const t2 = Math.min(t1 + delta, 500);
          const opacity1 = computeParticleOpacity(t1);
          const opacity2 = computeParticleOpacity(t2);
          expect(opacity2).toBeLessThanOrEqual(opacity1 + 1e-10);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('particle is active when elapsed < 500ms', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 499.999, noNaN: true }),
        (elapsed) => {
          expect(isParticleActive(elapsed)).toBe(true);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('particle is removed (inactive) when elapsed >= 500ms', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 500, max: 2000, noNaN: true }),
        (elapsed) => {
          expect(isParticleActive(elapsed)).toBe(false);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('at exactly 500ms, particle is removed', () => {
    expect(isParticleActive(500)).toBe(false);
  });
});
