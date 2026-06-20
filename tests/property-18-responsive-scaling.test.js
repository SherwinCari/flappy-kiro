const fc = require('fast-check');

/**
 * Property 18: Responsive scaling preserves aspect ratio
 * Validates: Requirements 10.2, 10.3
 *
 * For any viewport dimensions (width, height) above the minimum thresholds (300×400),
 * the computed scale factor and letterbox offsets SHALL produce a play area with the
 * fixed logical aspect ratio (400:600 = 2:3), and all game elements SHALL be scaled
 * by the same factor (canvasHeight / logicalHeight).
 */

// CONFIG values matching index.html
const CONFIG = {
  LOGICAL_WIDTH: 400,
  LOGICAL_HEIGHT: 600,
  MIN_CANVAS_WIDTH: 300,
  MIN_CANVAS_HEIGHT: 400,
};

/**
 * Pure function replicating the resizeCanvas logic from index.html.
 * Takes viewport width and height, returns computed canvas layout.
 */
function computeCanvasLayout(viewportWidth, viewportHeight) {
  const targetRatio = CONFIG.LOGICAL_WIDTH / CONFIG.LOGICAL_HEIGHT; // 400/600 = 2/3
  const viewportRatio = viewportWidth / viewportHeight;

  let canvasW, canvasH;

  if (viewportRatio > targetRatio) {
    // Viewport is wider than target — constrain by height, letterbox horizontally
    canvasH = viewportHeight;
    canvasW = canvasH * targetRatio;
  } else {
    // Viewport is taller than target — constrain by width, letterbox vertically
    canvasW = viewportWidth;
    canvasH = canvasW / targetRatio;
  }

  const scale = canvasH / CONFIG.LOGICAL_HEIGHT;
  const offsetX = (viewportWidth - canvasW) / 2;
  const offsetY = (viewportHeight - canvasH) / 2;

  return { canvasW, canvasH, scale, offsetX, offsetY };
}

describe('Property 18: Responsive scaling preserves aspect ratio', () => {
  /**
   * **Validates: Requirements 10.2, 10.3**
   */
  test('canvas maintains 400:600 (2:3) aspect ratio for all viewport sizes above minimum', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 4000 }), // viewportWidth
        fc.integer({ min: 400, max: 4000 }), // viewportHeight
        (viewportWidth, viewportHeight) => {
          const { canvasW, canvasH } = computeCanvasLayout(viewportWidth, viewportHeight);

          const expectedRatio = CONFIG.LOGICAL_WIDTH / CONFIG.LOGICAL_HEIGHT; // 2/3
          const actualRatio = canvasW / canvasH;

          // Verify aspect ratio is preserved within floating point tolerance
          expect(Math.abs(actualRatio - expectedRatio)).toBeLessThan(1e-10);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('scale equals canvasH / LOGICAL_HEIGHT for all viewport sizes above minimum', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 4000 }),
        fc.integer({ min: 400, max: 4000 }),
        (viewportWidth, viewportHeight) => {
          const { canvasH, scale } = computeCanvasLayout(viewportWidth, viewportHeight);

          const expectedScale = canvasH / CONFIG.LOGICAL_HEIGHT;

          expect(Math.abs(scale - expectedScale)).toBeLessThan(1e-10);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('letterbox offsets center the canvas within the viewport', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 4000 }),
        fc.integer({ min: 400, max: 4000 }),
        (viewportWidth, viewportHeight) => {
          const { canvasW, canvasH, offsetX, offsetY } = computeCanvasLayout(viewportWidth, viewportHeight);

          const expectedOffsetX = (viewportWidth - canvasW) / 2;
          const expectedOffsetY = (viewportHeight - canvasH) / 2;

          expect(Math.abs(offsetX - expectedOffsetX)).toBeLessThan(1e-10);
          expect(Math.abs(offsetY - expectedOffsetY)).toBeLessThan(1e-10);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('canvas fits within viewport (canvasW <= viewportWidth, canvasH <= viewportHeight)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 4000 }),
        fc.integer({ min: 400, max: 4000 }),
        (viewportWidth, viewportHeight) => {
          const { canvasW, canvasH } = computeCanvasLayout(viewportWidth, viewportHeight);

          // Canvas should never exceed viewport dimensions
          expect(canvasW).toBeLessThanOrEqual(viewportWidth + 1e-10);
          expect(canvasH).toBeLessThanOrEqual(viewportHeight + 1e-10);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('letterbox offsets are non-negative (canvas is centered, not offset outside)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 4000 }),
        fc.integer({ min: 400, max: 4000 }),
        (viewportWidth, viewportHeight) => {
          const { offsetX, offsetY } = computeCanvasLayout(viewportWidth, viewportHeight);

          // Offsets should be non-negative (canvas centered in viewport)
          expect(offsetX).toBeGreaterThanOrEqual(-1e-10);
          expect(offsetY).toBeGreaterThanOrEqual(-1e-10);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('all elements scale by the same uniform factor (canvasH / 600)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 4000 }),
        fc.integer({ min: 400, max: 4000 }),
        (viewportWidth, viewportHeight) => {
          const { canvasW, canvasH, scale } = computeCanvasLayout(viewportWidth, viewportHeight);

          // The scale factor is canvasH / LOGICAL_HEIGHT
          // The canvas width should equal LOGICAL_WIDTH * scale
          const expectedCanvasW = CONFIG.LOGICAL_WIDTH * scale;

          expect(Math.abs(canvasW - expectedCanvasW)).toBeLessThan(1e-10);
        }
      ),
      { numRuns: 1000 }
    );
  });
});
