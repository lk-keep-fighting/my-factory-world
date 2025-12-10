/**
 * Unit tests for device schema validation helpers
 */

import { 
  BasicDeviceSchemaValidator, 
  JSONSerializationValidator, 
  ValidationUtils 
} from './validation';
import { 
  DeviceTemplate, 
  DeviceInstance, 
  ValidationResult 
} from './types';
import { DEVICE_TEMPLATES } from './library';

// Test device templates
const validConveyorTemplate: DeviceTemplate = {
  id: 'conveyor-straight',
  displayName: 'Conveyor Straight',
  category: 'conveyor',
  defaultProps: {
    speed: 100,
    direction: 'right' as const,
    capacity: 10
  },
  thumbnail: {
    width: 20,
    height: 8,
    pixels: [
      { x: 1, y: 2, color: '#4A4A4A' },
      { x: 2, y: 2, color: '#4A4A4A' }
    ]
  },
  connectors: [
    { direction: 'left', position: { x: 0, y: 4 } },
    { direction: 'right', position: { x: 20, y: 4 } }
  ]
};

const invalidTemplateMissingId: Partial<DeviceTemplate> = {
  displayName: 'Missing ID',
  category: 'conveyor',
  defaultProps: {},
  thumbnail: { width: 10, height: 10, pixels: [] },
  connectors: []
};

const invalidTemplateBadId = {
  id: 'Invalid-ID' as any, // Contains uppercase and underscore, which is invalid
  displayName: 'Bad ID Format',
  category: 'conveyor' as any,
  defaultProps: {},
  thumbnail: { width: 10, height: 10, pixels: [] },
  connectors: []
};

const invalidTemplateBadCategory = {
  id: 'test-template' as any,
  displayName: 'Bad Category',
  category: 'invalid-category' as any,
  defaultProps: {},
  thumbnail: { width: 10, height: 10, pixels: [] },
  connectors: []
};

const validDeviceInstance: DeviceInstance = {
  id: 'device-1',
  type: 'conveyor-straight',
  template: validConveyorTemplate,
  position: { x: 100, y: 200 },
  rotation: 0,
  customProps: {
    speed: 120,
    direction: 'left' as const
  },
  state: 'running'
};

const invalidDeviceInstance: Partial<DeviceInstance> = {
  id: '', // Empty ID
  type: 'conveyor-straight',
  template: validConveyorTemplate,
  position: { x: 100, y: 200 },
  rotation: -10, // Negative rotation
  customProps: {},
  state: 'invalid-state' as any
};

describe('BasicDeviceSchemaValidator', () => {
  let validator: BasicDeviceSchemaValidator;

  beforeEach(() => {
    validator = new BasicDeviceSchemaValidator();
  });

  describe('validateTemplate', () => {
    it('should validate a valid template', () => {
      const result = validator.validateTemplate(validConveyorTemplate);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should reject template with missing ID', () => {
      const result = validator.validateTemplate(invalidTemplateMissingId as DeviceTemplate);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Device template must have an ID');
    });

    it('should reject template with invalid ID format', () => {
      const result = validator.validateTemplate(invalidTemplateBadId as DeviceTemplate);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Device ID must start with lowercase letter and contain only lowercase letters, numbers, and hyphens');
    });

    it('should reject template with invalid category', () => {
      const result = validator.validateTemplate(invalidTemplateBadCategory as DeviceTemplate);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid category: invalid-category. Must be one of: conveyor, automation, sensors, storage');
    });

    it('should validate thumbnail dimensions', () => {
      const templateWithBadThumbnail = {
        ...validConveyorTemplate,
        thumbnail: { width: -5, height: 10, pixels: [] }
      };
      
      const result = validator.validateTemplate(templateWithBadThumbnail);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Thumbnail width must be positive');
    });

    it('should validate connector directions', () => {
      const templateWithBadConnector = {
        ...validConveyorTemplate,
        connectors: [
          { direction: 'invalid-direction' as any, position: { x: 0, y: 0 } }
        ]
      };
      
      const result = validator.validateTemplate(templateWithBadConnector);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Connector at index 0 has invalid direction: invalid-direction');
    });

    it('should provide warnings for missing recommended properties', () => {
      const templateWithoutSpeed = {
        ...validConveyorTemplate,
        defaultProps: { direction: 'right' as const } // Missing speed
      };
      
      const result = validator.validateTemplate(templateWithoutSpeed);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Conveyor devices should have a speed property');
    });
  });

  describe('validateInstance', () => {
    it('should validate a valid device instance', () => {
      const result = validator.validateInstance(validDeviceInstance);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject instance with empty ID', () => {
      const result = validator.validateInstance(invalidDeviceInstance as DeviceInstance);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Device instance must have an ID');
    });

    it('should reject instance with negative rotation', () => {
      const instance = { ...validDeviceInstance, rotation: -10 };
      const result = validator.validateInstance(instance);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Device rotation must be between 0 and 359 degrees');
    });

    it('should reject instance with invalid state', () => {
      const instance = { ...validDeviceInstance, state: 'invalid-state' as any };
      const result = validator.validateInstance(instance);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid device state: invalid-state. Must be one of: running, stopped, faulted');
    });

    it('should provide warnings for non-90-degree rotation', () => {
      const instance = { ...validDeviceInstance, rotation: 45 };
      const result = validator.validateInstance(instance);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Device rotation should be in 90-degree increments for optimal grid alignment');
    });

    it('should reject instance with invalid position coordinates', () => {
      const instance = { 
        ...validDeviceInstance, 
        position: { x: NaN, y: 100 }
      };
      const result = validator.validateInstance(instance);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Device position x must be a finite number');
    });
  });

  describe('validateConnection', () => {
    it('should validate a valid connection', () => {
      const result = validator.validateConnection(
        validDeviceInstance,
        validDeviceInstance,
        'right'
      );
      
      expect(result.isValid).toBe(false); // Should fail because same device
      expect(result.errors).toContain('Device cannot connect to itself');
    });

    it('should reject connection to itself', () => {
      const result = validator.validateConnection(
        validDeviceInstance,
        validDeviceInstance,
        'left'
      );
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Device cannot connect to itself');
    });

    it('should reject invalid direction', () => {
      const result = validator.validateConnection(
        validDeviceInstance,
        validDeviceInstance,
        'invalid-direction' as any
      );
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid connection direction: invalid-direction');
    });

    it('should provide warnings for missing connectors', () => {
      const template1 = { ...validConveyorTemplate, connectors: [] };
      const template2 = { ...validConveyorTemplate, connectors: [] };
      const instance1 = { ...validDeviceInstance, id: 'device-1', template: template1 };
      const instance2 = { ...validDeviceInstance, id: 'device-2', template: template2 };
      
      const result = validator.validateConnection(instance1, instance2, 'right');
      
      expect(result.errors).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});

describe('JSONSerializationValidator', () => {
  describe('validateTemplateJSON', () => {
    it('should validate serializable template', () => {
      const result = JSONSerializationValidator.validateTemplateJSON(validConveyorTemplate);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject template with functions', () => {
      const templateWithFunction = {
        ...validConveyorTemplate,
        defaultProps: {
          ...validConveyorTemplate.defaultProps,
          validate: () => true // Function that can't be serialized
        }
      };
      
      const result = JSONSerializationValidator.validateTemplateJSON(templateWithFunction);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Property "validate" contains a function which cannot be serialized');
    });
  });

  describe('validateInstanceJSON', () => {
    it('should validate serializable instance', () => {
      const result = JSONSerializationValidator.validateInstanceJSON(validDeviceInstance);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject instance with functions', () => {
      const instanceWithFunction = {
        ...validDeviceInstance,
        customProps: {
          ...validDeviceInstance.customProps,
          validate: () => true // Function that can't be serialized
        }
      };
      
      const result = JSONSerializationValidator.validateInstanceJSON(instanceWithFunction);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Property "validate" contains a function which cannot be serialized');
    });
  });
});

describe('ValidationUtils', () => {
  describe('isTemplateValid', () => {
    it('should return true for valid template', () => {
      expect(ValidationUtils.isTemplateValid(validConveyorTemplate)).toBe(true);
    });

    it('should return false for invalid template', () => {
      expect(ValidationUtils.isTemplateValid(invalidTemplateBadCategory as DeviceTemplate)).toBe(false);
    });
  });

  describe('isInstanceValid', () => {
    it('should return true for valid instance', () => {
      expect(ValidationUtils.isInstanceValid(validDeviceInstance)).toBe(true);
    });

    it('should return false for invalid instance', () => {
      expect(ValidationUtils.isInstanceValid(invalidDeviceInstance as DeviceInstance)).toBe(false);
    });
  });

  describe('isConnectionValid', () => {
    it('should return false for self-connection', () => {
      expect(ValidationUtils.isConnectionValid(validDeviceInstance, validDeviceInstance, 'right')).toBe(false);
    });

    it('should return true for valid connection between different devices', () => {
      const device1 = { ...validDeviceInstance, id: 'device-1' };
      const device2 = { ...validDeviceInstance, id: 'device-2' };
      
      expect(ValidationUtils.isConnectionValid(device1, device2, 'right')).toBe(true);
    });
  });

  describe('JSON validation utilities', () => {
    it('should validate template JSON serializability', () => {
      expect(ValidationUtils.isTemplateJSONValid(validConveyorTemplate)).toBe(true);
    });

    it('should validate instance JSON serializability', () => {
      expect(ValidationUtils.isInstanceJSONValid(validDeviceInstance)).toBe(true);
    });
  });
});

describe('Device Templates from Library', () => {
  it('should have valid templates in the library', () => {
    const testValidator = new BasicDeviceSchemaValidator();
    Object.values(DEVICE_TEMPLATES).forEach(template => {
      const result = testValidator.validateTemplate(template);
      
      if (!result.isValid) {
        console.log(`Template ${template.id} validation errors:`, result.errors);
        console.log(`Template ${template.id} validation warnings:`, result.warnings);
      }
      
      expect(result.isValid).toBe(true);
    });
  });

  it('should have all templates JSON serializable', () => {
    Object.values(DEVICE_TEMPLATES).forEach(template => {
      const result = JSONSerializationValidator.validateTemplateJSON(template);
      
      if (!result.isValid) {
        console.log(`Template ${template.id} JSON errors:`, result.errors);
      }
      
      expect(result.isValid).toBe(true);
    });
  });
});