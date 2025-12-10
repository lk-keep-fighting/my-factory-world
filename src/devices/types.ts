/**
 * Strict TypeScript models for devices system
 */

import { Position, DeviceState } from '../simulation/types';

/** Connector direction for device connectivity */
export type ConnectorDirection = 'left' | 'right' | 'up' | 'down' | 'top' | 'bottom';

/** Available device types in the library */
export type DeviceType = 
  | 'conveyor-straight'
  | 'conveyor-turn-left'
  | 'conveyor-turn-right'
  | 'robotic-arm'
  | 'sensor'
  | 'buffer';

/** Pixel art thumbnail data */
export interface PixelArtThumbnail {
  width: number;
  height: number;
  pixels: Array<{
    x: number;
    y: number;
    color: string;
  }>;
}

/** Device template for library entries */
export interface DeviceTemplate {
  id: DeviceType;
  displayName: string;
  category: 'conveyor' | 'automation' | 'sensors' | 'storage';
  defaultProps: Record<string, unknown>;
  thumbnail: PixelArtThumbnail;
  connectors: Array<{
    direction: ConnectorDirection;
    position: Position;
  }>;
}

/** Device instance in the editor */
export interface DeviceInstance {
  id: string;
  type: DeviceType;
  template: DeviceTemplate;
  position: Position;
  rotation: number; // 0, 90, 180, 270 degrees
  customProps: Record<string, unknown>;
  state: DeviceState;
  faultReason?: string;
}

/** Device connector port */
export interface DeviceConnector {
  deviceId: string;
  direction: ConnectorDirection;
  position: Position;
  isConnected: boolean;
  connectedTo?: string; // device ID this is connected to
}

/** Device validation result */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/** Device schema validator interface */
export interface DeviceSchemaValidator {
  validateTemplate(template: DeviceTemplate): ValidationResult;
  validateInstance(instance: DeviceInstance): ValidationResult;
  validateConnection(fromDevice: DeviceInstance, toDevice: DeviceInstance, direction: ConnectorDirection): ValidationResult;
}

/** Device library state */
export interface DeviceLibraryState {
  selectedTemplate: DeviceTemplate | null;
  isDragging: boolean;
  dragData: {
    template: DeviceTemplate | null;
    startPosition: Position;
  } | null;
}

/** Library panel props */
export interface DeviceLibraryPanelProps {
  selectedTemplate: DeviceTemplate | null;
  onTemplateSelect: (template: DeviceTemplate | null) => void;
  onDragStart: (template: DeviceTemplate, event: React.DragEvent) => void;
  className?: string;
}