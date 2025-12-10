/**
 * Jest setup file
 * Provides mocks for browser APIs
 */

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = (callback) => {
  return setTimeout(() => callback(Date.now()), 0);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Mock performance.now if not available
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
  };
}

// Mock HTMLCanvasElement.getContext (only if HTMLCanvasElement exists)
if (typeof HTMLCanvasElement !== 'undefined' && !HTMLCanvasElement.prototype.getContext) {
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    arc: jest.fn(),
    arcTo: jest.fn(),
    clearRect: jest.fn(),
    fillText: jest.fn(),
    measureText: jest.fn(),
    closePath: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    translate: jest.fn(),
    transform: jest.fn(),
    setTransform: jest.fn(),
  });
}
