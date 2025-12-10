/**
 * Device library with all available device templates
 */

import { DeviceTemplate, DeviceType, PixelArtThumbnail, ConnectorDirection } from './types';

/** Create pixel art thumbnail for devices */
function createPixelArt(width: number, height: number, pixels: Array<{x: number; y: number; color: string}>): PixelArtThumbnail {
  return {
    width,
    height,
    pixels
  };
}

/** Conveyor straight template */
const conveyorStraightTemplate: DeviceTemplate = {
  id: 'conveyor-straight',
  displayName: 'Conveyor Straight',
  category: 'conveyor',
  defaultProps: {
    speed: 100, // units per minute
    direction: 'right' as const,
    capacity: 10,
    length: 60,
    width: 20
  },
  thumbnail: createPixelArt(20, 8, [
    // Conveyor belt body
    ...Array.from({ length: 18 }, (_, i) => ({
      x: i + 1, y: 2, color: '#4A4A4A'
    })),
    ...Array.from({ length: 18 }, (_, i) => ({
      x: i + 1, y: 5, color: '#4A4A4A'
    })),
    // Belt surface
    ...Array.from({ length: 18 }, (_, i) => ({
      x: i + 1, y: 3, color: '#6B7280'
    })),
    ...Array.from({ length: 18 }, (_, i) => ({
      x: i + 1, y: 4, color: '#6B7280'
    })),
    // Rollers
    { x: 1, y: 2, color: '#2D3748' },
    { x: 1, y: 5, color: '#2D3748' },
    { x: 18, y: 2, color: '#2D3748' },
    { x: 18, y: 5, color: '#2D3748' }
  ]),
  connectors: [
    { direction: 'left', position: { x: 0, y: 4 } },
    { direction: 'right', position: { x: 20, y: 4 } }
  ]
};

/** Conveyor turn left template */
const conveyorTurnLeftTemplate: DeviceTemplate = {
  id: 'conveyor-turn-left',
  displayName: 'Conveyor Turn Left',
  category: 'conveyor',
  defaultProps: {
    speed: 100,
    direction: 'up' as const,
    capacity: 8,
    length: 40,
    width: 40
  },
  thumbnail: createPixelArt(16, 16, [
    // L-shaped conveyor
    ...Array.from({ length: 12 }, (_, i) => ({
      x: i + 2, y: 8, color: '#4A4A4A'
    })),
    ...Array.from({ length: 8 }, (_, i) => ({
      x: 8, y: i + 4, color: '#4A4A4A'
    })),
    // Belt surface
    ...Array.from({ length: 12 }, (_, i) => ({
      x: i + 2, y: 9, color: '#6B7280'
    })),
    ...Array.from({ length: 8 }, (_, i) => ({
      x: 9, y: i + 4, color: '#6B7280'
    })),
    // Corner joint
    { x: 8, y: 8, color: '#2D3748' },
    { x: 8, y: 9, color: '#2D3748' },
    { x: 9, y: 8, color: '#2D3748' }
  ]),
  connectors: [
    { direction: 'right', position: { x: 16, y: 12 } },
    { direction: 'up', position: { x: 12, y: 0 } }
  ]
};

/** Conveyor turn right template */
const conveyorTurnRightTemplate: DeviceTemplate = {
  id: 'conveyor-turn-right',
  displayName: 'Conveyor Turn Right',
  category: 'conveyor',
  defaultProps: {
    speed: 100,
    direction: 'up' as const,
    capacity: 8,
    length: 40,
    width: 40
  },
  thumbnail: createPixelArt(16, 16, [
    // L-shaped conveyor (mirrored)
    ...Array.from({ length: 12 }, (_, i) => ({
      x: i + 2, y: 8, color: '#4A4A4A'
    })),
    ...Array.from({ length: 8 }, (_, i) => ({
      x: 4, y: i + 4, color: '#4A4A4A'
    })),
    // Belt surface
    ...Array.from({ length: 12 }, (_, i) => ({
      x: i + 2, y: 9, color: '#6B7280'
    })),
    ...Array.from({ length: 8 }, (_, i) => ({
      x: 5, y: i + 4, color: '#6B7280'
    })),
    // Corner joint
    { x: 4, y: 8, color: '#2D3748' },
    { x: 4, y: 9, color: '#2D3748' },
    { x: 5, y: 8, color: '#2D3748' }
  ]),
  connectors: [
    { direction: 'left', position: { x: 0, y: 12 } },
    { direction: 'up', position: { x: 4, y: 0 } }
  ]
};

/** Robotic arm template */
const roboticArmTemplate: DeviceTemplate = {
  id: 'robotic-arm',
  displayName: 'Robotic Arm',
  category: 'automation',
  defaultProps: {
    reach: 80,
    liftCapacity: 5, // kg
    cycleTime: 2.0, // seconds
    precision: 0.1, // mm
    hasGripper: true,
    rotation: 0
  },
  thumbnail: createPixelArt(16, 16, [
    // Base
    { x: 6, y: 14, color: '#2D3748' },
    { x: 7, y: 14, color: '#2D3748' },
    { x: 8, y: 14, color: '#2D3748' },
    { x: 9, y: 14, color: '#2D3748' },
    // Base column
    { x: 7, y: 10, color: '#4A5568' },
    { x: 8, y: 10, color: '#4A5568' },
    { x: 7, y: 11, color: '#4A5568' },
    { x: 8, y: 11, color: '#4A5568' },
    { x: 7, y: 12, color: '#4A5568' },
    { x: 8, y: 12, color: '#4A5568' },
    { x: 7, y: 13, color: '#4A5568' },
    { x: 8, y: 13, color: '#4A5568' },
    // Arm segments
    { x: 6, y: 8, color: '#718096' },
    { x: 7, y: 8, color: '#718096' },
    { x: 8, y: 8, color: '#718096' },
    { x: 9, y: 8, color: '#718096' },
    { x: 10, y: 7, color: '#718096' },
    { x: 11, y: 6, color: '#718096' },
    { x: 12, y: 5, color: '#718096' },
    // Joints
    { x: 7, y: 9, color: '#1A202C' },
    { x: 9, y: 7, color: '#1A202C' },
    { x: 11, y: 6, color: '#1A202C' },
    // Gripper
    { x: 13, y: 4, color: '#A0AEC0' },
    { x: 14, y: 4, color: '#A0AEC0' },
    { x: 13, y: 5, color: '#A0AEC0' },
    { x: 14, y: 5, color: '#A0AEC0' }
  ]),
  connectors: [
    { direction: 'left', position: { x: 0, y: 12 } },
    { direction: 'right', position: { x: 16, y: 12 } },
    { direction: 'up', position: { x: 8, y: 0 } },
    { direction: 'down', position: { x: 8, y: 16 } }
  ]
};

/** Sensor template */
const sensorTemplate: DeviceTemplate = {
  id: 'sensor',
  displayName: 'Sensor',
  category: 'sensors',
  defaultProps: {
    detectionType: 'proximity' as const,
    range: 50, // mm
    sensitivity: 0.8,
    threshold: 0.5,
    hasIndicator: true,
    isActive: true
  },
  thumbnail: createPixelArt(12, 12, [
    // Sensor body
    { x: 3, y: 4, color: '#2D3748' },
    { x: 4, y: 4, color: '#2D3748' },
    { x: 5, y: 4, color: '#2D3748' },
    { x: 6, y: 4, color: '#2D3748' },
    { x: 7, y: 4, color: '#2D3748' },
    { x: 8, y: 4, color: '#2D3748' },
    { x: 3, y: 7, color: '#2D3748' },
    { x: 4, y: 7, color: '#2D3748' },
    { x: 5, y: 7, color: '#2D3748' },
    { x: 6, y: 7, color: '#2D3748' },
    { x: 7, y: 7, color: '#2D3748' },
    { x: 8, y: 7, color: '#2D3748' },
    { x: 3, y: 5, color: '#4A5568' },
    { x: 4, y: 5, color: '#4A5568' },
    { x: 5, y: 5, color: '#4A5568' },
    { x: 6, y: 5, color: '#4A5568' },
    { x: 7, y: 5, color: '#4A5568' },
    { x: 8, y: 5, color: '#4A5568' },
    { x: 3, y: 6, color: '#4A5568' },
    { x: 4, y: 6, color: '#4A5568' },
    { x: 5, y: 6, color: '#4A5568' },
    { x: 6, y: 6, color: '#4A5568' },
    { x: 7, y: 6, color: '#4A5568' },
    { x: 8, y: 6, color: '#4A5568' },
    // Lens/indicator
    { x: 5, y: 5, color: '#10B981' },
    { x: 6, y: 5, color: '#10B981' },
    { x: 5, y: 6, color: '#10B981' },
    { x: 6, y: 6, color: '#10B981' },
    // Mounting holes
    { x: 4, y: 4, color: '#1A202C' },
    { x: 7, y: 4, color: '#1A202C' },
    { x: 4, y: 7, color: '#1A202C' },
    { x: 7, y: 7, color: '#1A202C' }
  ]),
  connectors: [
    { direction: 'left', position: { x: 0, y: 6 } },
    { direction: 'right', position: { x: 12, y: 6 } }
  ]
};

/** Buffer template */
const bufferTemplate: DeviceTemplate = {
  id: 'buffer',
  displayName: 'Buffer Storage',
  category: 'storage',
  defaultProps: {
    capacity: 20,
    currentItems: 0,
    isFIFO: true, // First In First Out
    overflowMode: 'stop' as const, // 'stop' | 'overflow' | 'reject'
    bufferTime: 5.0, // seconds to hold items
    storageLevel: 'low' as const
  },
  thumbnail: createPixelArt(16, 12, [
    // Buffer body
    { x: 2, y: 3, color: '#E2E8F0' },
    { x: 3, y: 3, color: '#E2E8F0' },
    { x: 4, y: 3, color: '#E2E8F0' },
    { x: 5, y: 3, color: '#E2E8F0' },
    { x: 6, y: 3, color: '#E2E8F0' },
    { x: 7, y: 3, color: '#E2E8F0' },
    { x: 8, y: 3, color: '#E2E8F0' },
    { x: 9, y: 3, color: '#E2E8F0' },
    { x: 10, y: 3, color: '#E2E8F0' },
    { x: 11, y: 3, color: '#E2E8F0' },
    { x: 12, y: 3, color: '#E2E8F0' },
    { x: 13, y: 3, color: '#E2E8F0' },
    
    { x: 2, y: 8, color: '#E2E8F0' },
    { x: 3, y: 8, color: '#E2E8F0' },
    { x: 4, y: 8, color: '#E2E8F0' },
    { x: 5, y: 8, color: '#E2E8F0' },
    { x: 6, y: 8, color: '#E2E8F0' },
    { x: 7, y: 8, color: '#E2E8F0' },
    { x: 8, y: 8, color: '#E2E8F0' },
    { x: 9, y: 8, color: '#E2E8F0' },
    { x: 10, y: 8, color: '#E2E8F0' },
    { x: 11, y: 8, color: '#E2E8F0' },
    { x: 12, y: 8, color: '#E2E8F0' },
    { x: 13, y: 8, color: '#E2E8F0' },
    
    // Vertical sides
    ...Array.from({ length: 6 }, (_, i) => ({
      x: 2, y: i + 3, color: '#A0AEC0'
    })),
    ...Array.from({ length: 6 }, (_, i) => ({
      x: 13, y: i + 3, color: '#A0AEC0'
    })),
    
    // Internal dividers
    ...Array.from({ length: 4 }, (_, i) => {
      const dividers = [4, 7, 10];
      return dividers.map(x => ({
        x,
        y: i + 5,
        color: '#CBD5E0'
      }));
    }).flat(),
    
    // Items in buffer (showing 6 items)
    { x: 3, y: 5, color: '#F56565' },
    { x: 6, y: 5, color: '#48BB78' },
    { x: 9, y: 5, color: '#4299E1' },
    { x: 5, y: 6, color: '#ED8936' },
    { x: 8, y: 6, color: '#9F7AEA' },
    { x: 11, y: 6, color: '#38B2AC' }
  ]),
  connectors: [
    { direction: 'left', position: { x: 0, y: 6 } },
    { direction: 'right', position: { x: 16, y: 6 } }
  ]
};

/** All device templates in the library */
export const DEVICE_TEMPLATES: Record<DeviceType, DeviceTemplate> = {
  'conveyor-straight': conveyorStraightTemplate,
  'conveyor-turn-left': conveyorTurnLeftTemplate,
  'conveyor-turn-right': conveyorTurnRightTemplate,
  'robotic-arm': roboticArmTemplate,
  'sensor': sensorTemplate,
  'buffer': bufferTemplate
};

/** Get device template by ID */
export function getDeviceTemplate(id: DeviceType): DeviceTemplate {
  return DEVICE_TEMPLATES[id];
}

/** Get all device templates */
export function getAllDeviceTemplates(): DeviceTemplate[] {
  return Object.values(DEVICE_TEMPLATES);
}

/** Get device templates by category */
export function getDeviceTemplatesByCategory(category: DeviceTemplate['category']): DeviceTemplate[] {
  return Object.values(DEVICE_TEMPLATES).filter(template => template.category === category);
}