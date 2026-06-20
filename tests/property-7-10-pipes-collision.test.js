const fc = require('fast-check');

/**
 * Properties 7-10: Pipes and Collision
 * Validates: Requirements 4.2, 4.5, 4.6, 5.1, 5.2
 *
 * Pure functions extracted from pipe management and collision detection logic in index.html.
 */

// ═══════════════════════════════════════
// CONSTANTS (matching CONFIG in index.html)
// ═══════════════════════════════════════

const BASE_PIPE_SPEED = 120;   // px/s
const SPEED_INCREMENT = 6;     // px/s per SCORE_INTERVAL points
const SCORE_INTERVAL = 5;      // points per speed increase
const MAX_PIPE_SPEED = 300;    // px/s
const PIPE_WIDTH = 50;         // px
const GAP_HEIGHT = 140;        // px
const MIN_PIPE_HEIGHT = 50;    // px
const GROUND_HEIGHT = 60;      // px
const LOGICAL_HEIGHT = 600;    // px

// ═══════════════════════════════════════
// PURE FUNCTIONS UNDER TEST
// ═══════════════════════════════════════

/**
 * Property 7: Pipe speed scaling
 * Computes the current pipe speed based on the player's score.
 */
function getPipeSpeed(score) {
  return Math.min(
    BASE_PIPE_SPEED + SPEED_INCREMENT * Math.floor(score / SCORE_INTERVAL),
    MAX_PIPE_SPEED
  );
}

/**
 * Property 8: Pipe offscreen cleanup
 * Removes pipes from the front of the array when they are fully off-screen left.
 */
function cleanupPipes(pipes) {
  while (pipes.length > 0 && pipes[0].x + PIPE_WIDTH < 0) {
    pipes.splice(0, 1);
  }
  return pipes;
}

/**
 * Property 9: Gap position bounds
 * Computes the valid range for the gap center Y given canvas and ground dimensions.
 */
function generateGapCenter(canvasHeight, groundHeight) {
  const minY = MIN_PIPE_HEIGHT + GAP_HEIGHT / 2;
  const maxY = canvasHeight - groundHeight - MIN_PIPE_HEIGHT - GAP_HEIGHT / 2;
  return { minY, maxY };
}

/**
 * Property 10: Circle-vs-AABB collision correctness
 * Returns true if the circle overlaps the axis-aligned rectangle.
 */
function circleRectOverlap(circle, rect) {
  var closestX = Math.max(rect.x, Math.min(circle.cx, rect.x + rect.width));
  var closestY = Math.max(rect.y, Math.min(circle.cy, rect.y + rect.height));
  var dx = circle.cx - closestX;
  var dy = circle.cy - closestY;
  return (dx * dx + dy * dy) <= (circle.radius * circle.radius);
}

// ═══════════════════════════════════════
// PROPERTY TESTS
// ═══════════════════════════════════════

describe('Property 7: Pipe speed scaling', () => {
  /**
   * **Validates: Requirements 4.5**
   */
  test('speed equals min(120 + 6 * floor(score/5), 300) for scores 0-150', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 150 }),
        (score) => {
          const result = getPipeSpeed(score);
          const expected = Math.min(120 + 6 * Math.floor(score / 5), 300);
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('speed is always at least BASE_PIPE_SPEED (120 px/s)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 150 }),
        (score) => {
          const result = getPipeSpeed(score);
          expect(result).toBeGreaterThanOrEqual(BASE_PIPE_SPEED);
        }
      ),
      { numRuns: 500 }
    );
  });

  test('speed never exceeds MAX_PIPE_SPEED (300 px/s)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 150 }),
        (score) => {
          const result = getPipeSpeed(score);
          expect(result).toBeLessThanOrEqual(MAX_PIPE_SPEED);
        }
      ),
      { numRuns: 500 }
    );
  });

  test('speed increases monotonically with score', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 149 }),
        (score) => {
          const speedLow = getPipeSpeed(score);
          const speedHigh = getPipeSpeed(score + 1);
          expect(speedHigh).toBeGreaterThanOrEqual(speedLow);
        }
      ),
      { numRuns: 500 }
    );
  });
});

describe('Property 8: Pipe offscreen cleanup', () => {
  /**
   * **Validates: Requirements 4.6**
   */
  test('pipes with x + PIPE_WIDTH < 0 are removed from the array', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            x: fc.double({ min: -500, max: 500, noNaN: true }),
            gapCenterY: fc.double({ min: 100, max: 500, noNaN: true }),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (pipes) => {
          // Sort pipes by x to simulate the FIFO order (leftmost first)
          const sortedPipes = pipes
            .map(p => ({ ...p }))
            .sort((a, b) => a.x - b.x);

          const result = cleanupPipes(sortedPipes);

          // All remaining pipes should have x + PIPE_WIDTH >= 0
          for (const pipe of result) {
            expect(pipe.x + PIPE_WIDTH).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('pipes with x + PIPE_WIDTH >= 0 are preserved', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            x: fc.double({ min: 0, max: 500, noNaN: true }),
            gapCenterY: fc.double({ min: 100, max: 500, noNaN: true }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (pipes) => {
          const original = pipes.map(p => ({ ...p }));
          const result = cleanupPipes(pipes);

          // All pipes have x >= 0, so x + PIPE_WIDTH >= 50 > 0 — none removed
          expect(result.length).toBe(original.length);
        }
      ),
      { numRuns: 500 }
    );
  });

  test('only leading offscreen pipes are removed (FIFO order)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),   // number of offscreen pipes at front
        fc.integer({ min: 1, max: 5 }),   // number of onscreen pipes after
        (offCount, onCount) => {
          const pipes = [];

          // Add offscreen pipes at the front (x + PIPE_WIDTH < 0 → x < -50)
          for (let i = 0; i < offCount; i++) {
            pipes.push({ x: -100 - i * 50, gapCenterY: 300 });
          }

          // Add onscreen pipes after
          for (let i = 0; i < onCount; i++) {
            pipes.push({ x: 100 + i * 100, gapCenterY: 300 });
          }

          const result = cleanupPipes(pipes);
          expect(result.length).toBe(onCount);
        }
      ),
      { numRuns: 500 }
    );
  });

  test('empty array remains empty after cleanup', () => {
    const result = cleanupPipes([]);
    expect(result.length).toBe(0);
  });
});

describe('Property 9: Gap position bounds', () => {
  /**
   * **Validates: Requirements 4.2**
   */
  test('gap constraints ensure min 50px top pipe and min 50px bottom pipe with 140px gap', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 1200 }),  // canvasHeight
        fc.integer({ min: 40, max: 100 }),    // groundHeight
        (canvasHeight, groundHeight) => {
          const { minY, maxY } = generateGapCenter(canvasHeight, groundHeight);

          // Top pipe height = gapCenter - GAP_HEIGHT/2 must be >= MIN_PIPE_HEIGHT
          // At minY: topPipeHeight = minY - GAP_HEIGHT/2 = MIN_PIPE_HEIGHT + GAP_HEIGHT/2 - GAP_HEIGHT/2 = 50 ✓
          const topPipeHeightAtMin = minY - GAP_HEIGHT / 2;
          expect(topPipeHeightAtMin).toBeGreaterThanOrEqual(MIN_PIPE_HEIGHT);

          // Bottom pipe height = canvasHeight - groundHeight - (gapCenter + GAP_HEIGHT/2) must be >= MIN_PIPE_HEIGHT
          // At maxY: bottomPipeHeight = canvasHeight - groundHeight - (maxY + GAP_HEIGHT/2) = MIN_PIPE_HEIGHT ✓
          const bottomPipeHeightAtMax = canvasHeight - groundHeight - (maxY + GAP_HEIGHT / 2);
          expect(bottomPipeHeightAtMax).toBeGreaterThanOrEqual(MIN_PIPE_HEIGHT);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('minY equals MIN_PIPE_HEIGHT + GAP_HEIGHT/2 (120) regardless of canvas size', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 1200 }),
        fc.integer({ min: 40, max: 100 }),
        (canvasHeight, groundHeight) => {
          const { minY } = generateGapCenter(canvasHeight, groundHeight);
          expect(minY).toBe(MIN_PIPE_HEIGHT + GAP_HEIGHT / 2); // 50 + 70 = 120
        }
      ),
      { numRuns: 500 }
    );
  });

  test('maxY equals canvasHeight - groundHeight - MIN_PIPE_HEIGHT - GAP_HEIGHT/2', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 1200 }),
        fc.integer({ min: 40, max: 100 }),
        (canvasHeight, groundHeight) => {
          const { maxY } = generateGapCenter(canvasHeight, groundHeight);
          const expected = canvasHeight - groundHeight - MIN_PIPE_HEIGHT - GAP_HEIGHT / 2;
          expect(maxY).toBe(expected);
        }
      ),
      { numRuns: 500 }
    );
  });

  test('gap range is satisfiable (maxY >= minY) for valid canvas dimensions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 1200 }),
        fc.integer({ min: 40, max: 100 }),
        (canvasHeight, groundHeight) => {
          const { minY, maxY } = generateGapCenter(canvasHeight, groundHeight);
          // For a 400px canvas with 100px ground:
          // minY = 120, maxY = 400 - 100 - 50 - 70 = 180
          // This should always be satisfiable for canvasHeight >= 340 + groundHeight
          expect(maxY).toBeGreaterThanOrEqual(minY);
        }
      ),
      { numRuns: 500 }
    );
  });

  test('any gapCenter in [minY, maxY] produces valid top and bottom pipe heights', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 1200 }),
        fc.integer({ min: 40, max: 100 }),
        fc.double({ min: 0, max: 1, noNaN: true }),  // interpolation factor
        (canvasHeight, groundHeight, t) => {
          const { minY, maxY } = generateGapCenter(canvasHeight, groundHeight);
          const gapCenter = minY + t * (maxY - minY);

          const topPipeHeight = gapCenter - GAP_HEIGHT / 2;
          const bottomPipeHeight = canvasHeight - groundHeight - (gapCenter + GAP_HEIGHT / 2);

          expect(topPipeHeight).toBeGreaterThanOrEqual(MIN_PIPE_HEIGHT);
          expect(bottomPipeHeight).toBeGreaterThanOrEqual(MIN_PIPE_HEIGHT);
        }
      ),
      { numRuns: 1000 }
    );
  });
});

describe('Property 10: Circle-vs-AABB collision correctness', () => {
  /**
   * **Validates: Requirements 5.1, 5.2**
   */
  test('collision returns true iff closest point on rect to circle center is within radius', () => {
    fc.assert(
      fc.property(
        // Circle
        fc.record({
          cx: fc.double({ min: -500, max: 500, noNaN: true }),
          cy: fc.double({ min: -500, max: 500, noNaN: true }),
          radius: fc.double({ min: 1, max: 50, noNaN: true }),
        }),
        // Rectangle
        fc.record({
          x: fc.double({ min: -500, max: 500, noNaN: true }),
          y: fc.double({ min: -500, max: 500, noNaN: true }),
          width: fc.double({ min: 1, max: 200, noNaN: true }),
          height: fc.double({ min: 1, max: 200, noNaN: true }),
        }),
        (circle, rect) => {
          const result = circleRectOverlap(circle, rect);

          // Compute expected: find closest point on rect to circle center
          const closestX = Math.max(rect.x, Math.min(circle.cx, rect.x + rect.width));
          const closestY = Math.max(rect.y, Math.min(circle.cy, rect.y + rect.height));
          const dx = circle.cx - closestX;
          const dy = circle.cy - closestY;
          const distSq = dx * dx + dy * dy;
          const radiusSq = circle.radius * circle.radius;
          const expected = distSq <= radiusSq;

          expect(result).toBe(expected);
        }
      ),
      { numRuns: 2000 }
    );
  });

  test('circle center inside rect always collides', () => {
    fc.assert(
      fc.property(
        fc.record({
          x: fc.double({ min: -500, max: 500, noNaN: true }),
          y: fc.double({ min: -500, max: 500, noNaN: true }),
          width: fc.double({ min: 10, max: 200, noNaN: true }),
          height: fc.double({ min: 10, max: 200, noNaN: true }),
        }),
        fc.double({ min: 1, max: 50, noNaN: true }),  // radius
        fc.double({ min: 0.1, max: 0.9, noNaN: true }), // t for x interpolation
        fc.double({ min: 0.1, max: 0.9, noNaN: true }), // t for y interpolation
        (rect, radius, tx, ty) => {
          // Place circle center inside the rectangle
          const circle = {
            cx: rect.x + tx * rect.width,
            cy: rect.y + ty * rect.height,
            radius: radius,
          };
          expect(circleRectOverlap(circle, rect)).toBe(true);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('circle far away from rect never collides', () => {
    fc.assert(
      fc.property(
        fc.record({
          x: fc.double({ min: -100, max: 100, noNaN: true }),
          y: fc.double({ min: -100, max: 100, noNaN: true }),
          width: fc.double({ min: 1, max: 50, noNaN: true }),
          height: fc.double({ min: 1, max: 50, noNaN: true }),
        }),
        fc.double({ min: 1, max: 50, noNaN: true }),  // radius
        (rect, radius) => {
          // Place circle center far away (beyond any reasonable overlap)
          const circle = {
            cx: rect.x + rect.width + radius + 100,
            cy: rect.y + rect.height + radius + 100,
            radius: radius,
          };
          expect(circleRectOverlap(circle, rect)).toBe(false);
        }
      ),
      { numRuns: 500 }
    );
  });

  test('circle just barely overlapping rect edge returns true', () => {
    fc.assert(
      fc.property(
        fc.record({
          x: fc.double({ min: -100, max: 100, noNaN: true }),
          y: fc.double({ min: -100, max: 100, noNaN: true }),
          width: fc.double({ min: 10, max: 200, noNaN: true }),
          height: fc.double({ min: 10, max: 200, noNaN: true }),
        }),
        fc.double({ min: 5, max: 50, noNaN: true }),  // radius
        (rect, radius) => {
          // Place circle center (radius - 1) distance to the right of the rect's right edge
          // This ensures the circle clearly overlaps the rect edge
          const circle = {
            cx: rect.x + rect.width + radius - 1,
            cy: rect.y + rect.height / 2,
            radius: radius,
          };
          // distance = radius - 1 < radius, so should overlap
          expect(circleRectOverlap(circle, rect)).toBe(true);
        }
      ),
      { numRuns: 500 }
    );
  });
});
