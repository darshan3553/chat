import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

// Mock mongoose before importing the model
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  
  return {
    ...actualMongoose,
    model: jest.fn(),
    Schema: jest.fn().mockImplementation(function(schemaDefinition, options) {
      this.definition = schemaDefinition;
      this.options = options;
      return this;
    }),
  };
});

describe('User Model', () => {
  let UserSchema;
  let mockModel;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the module cache to get a fresh import
    jest.resetModules();
  });

  describe('Schema Definition', () => {
    test('should define email field as required and unique', async () => {
      // Import after mocking
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.email).toBeDefined();
      expect(SchemaConstructor.email.type).toBe(String);
      expect(SchemaConstructor.email.required).toBe(true);
      expect(SchemaConstructor.email.unique).toBe(true);
    });

    test('should define fullname field as required string', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.fullname).toBeDefined();
      expect(SchemaConstructor.fullname.type).toBe(String);
      expect(SchemaConstructor.fullname.required).toBe(true);
    });

    test('should define password field with minimum length validation', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.password).toBeDefined();
      expect(SchemaConstructor.password.type).toBe(String);
      expect(SchemaConstructor.password.required).toBe(true);
      expect(SchemaConstructor.password.minlength).toBe(6);
    });

    test('should define profilepic field with empty string default', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.profilepic).toBeDefined();
      expect(SchemaConstructor.profilepic.type).toBe(String);
      expect(SchemaConstructor.profilepic.default).toBe('');
    });

    test('should have all required fields defined', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      const requiredFields = ['email', 'fullname', 'password'];
      
      requiredFields.forEach(field => {
        expect(SchemaConstructor[field]).toBeDefined();
        expect(SchemaConstructor[field].required).toBe(true);
      });
    });

    test('should only have expected fields (email, fullname, password, profilepic)', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      const expectedFields = ['email', 'fullname', 'password', 'profilepic'];
      const actualFields = Object.keys(SchemaConstructor);
      
      expect(actualFields.sort()).toEqual(expectedFields.sort());
    });
  });

  describe('Schema Options', () => {
    test('should enable timestamps', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const schemaOptions = mongoose.Schema.mock.calls[0][1];
      
      expect(schemaOptions).toBeDefined();
      expect(schemaOptions.timestamps).toBe(true);
    });

    test('should create createdAt and updatedAt fields automatically', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const schemaOptions = mongoose.Schema.mock.calls[0][1];
      
      // When timestamps is true, mongoose automatically adds createdAt and updatedAt
      expect(schemaOptions.timestamps).toBe(true);
    });
  });

  describe('Model Registration', () => {
    test('should register model with name "User"', async () => {
      const User = (await import('../../models/User.js')).default;
      
      expect(mongoose.model).toHaveBeenCalled();
      expect(mongoose.model.mock.calls[0][0]).toBe('User');
    });

    test('should create model with the defined schema', async () => {
      const User = (await import('../../models/User.js')).default;
      
      expect(mongoose.model).toHaveBeenCalledTimes(1);
      expect(mongoose.Schema).toHaveBeenCalledTimes(1);
    });
  });

  describe('Field Type Validations', () => {
    test('should only accept String type for email', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.email.type).toBe(String);
      expect(SchemaConstructor.email.type).not.toBe(Number);
      expect(SchemaConstructor.email.type).not.toBe(Boolean);
    });

    test('should only accept String type for fullname', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.fullname.type).toBe(String);
    });

    test('should only accept String type for password', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.password.type).toBe(String);
    });

    test('should only accept String type for profilepic', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.profilepic.type).toBe(String);
    });
  });

  describe('Password Constraints', () => {
    test('should enforce minimum password length of 6', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.password.minlength).toBe(6);
    });

    test('should have password as required field', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.password.required).toBe(true);
    });

    test('should not have maxlength constraint on password', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.password.maxlength).toBeUndefined();
    });
  });

  describe('Email Constraints', () => {
    test('should enforce email uniqueness', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.email.unique).toBe(true);
    });

    test('should have email as required field', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.email.required).toBe(true);
    });

    test('should not have built-in email format validation', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      // The schema doesn't define a validate function or match pattern
      expect(SchemaConstructor.email.validate).toBeUndefined();
      expect(SchemaConstructor.email.match).toBeUndefined();
    });
  });

  describe('Default Values', () => {
    test('should set empty string as default for profilepic', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.profilepic.default).toBe('');
    });

    test('should not have default values for required fields', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.email.default).toBeUndefined();
      expect(SchemaConstructor.fullname.default).toBeUndefined();
      expect(SchemaConstructor.password.default).toBeUndefined();
    });

    test('should only have default value for optional field profilepic', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.profilepic.required).toBeUndefined();
      expect(SchemaConstructor.profilepic.default).toBeDefined();
    });
  });

  describe('Module Export', () => {
    test('should export the User model as default', async () => {
      const User = (await import('../../models/User.js')).default;
      
      expect(User).toBeDefined();
    });

    test('should not export named exports', async () => {
      const UserModule = await import('../../models/User.js');
      
      const namedExports = Object.keys(UserModule).filter(key => key !== 'default');
      expect(namedExports.length).toBe(0);
    });
  });

  describe('Schema Structure Validation', () => {
    test('should have exactly 4 fields in schema definition', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      const fieldCount = Object.keys(SchemaConstructor).length;
      
      expect(fieldCount).toBe(4);
    });

    test('should have 3 required fields and 1 optional field', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      const requiredFields = Object.keys(SchemaConstructor).filter(
        key => SchemaConstructor[key].required === true
      );
      
      expect(requiredFields.length).toBe(3);
    });

    test('should not have any number fields', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      const numberFields = Object.keys(SchemaConstructor).filter(
        key => SchemaConstructor[key].type === Number
      );
      
      expect(numberFields.length).toBe(0);
    });

    test('should not have any boolean fields', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      const booleanFields = Object.keys(SchemaConstructor).filter(
        key => SchemaConstructor[key].type === Boolean
      );
      
      expect(booleanFields.length).toBe(0);
    });

    test('should not have any array fields', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      const arrayFields = Object.keys(SchemaConstructor).filter(
        key => Array.isArray(SchemaConstructor[key].type)
      );
      
      expect(arrayFields.length).toBe(0);
    });

    test('should not have any nested object fields', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      const nestedFields = Object.keys(SchemaConstructor).filter(
        key => typeof SchemaConstructor[key].type === 'object' && 
               SchemaConstructor[key].type !== String
      );
      
      expect(nestedFields.length).toBe(0);
    });
  });

  describe('Fullname Field', () => {
    test('should have fullname as required', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.fullname.required).toBe(true);
    });

    test('should not have length constraints on fullname', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.fullname.minlength).toBeUndefined();
      expect(SchemaConstructor.fullname.maxlength).toBeUndefined();
    });

    test('should accept String type for fullname', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.fullname.type).toBe(String);
    });
  });

  describe('ProfilePic Field', () => {
    test('should not be required', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.profilepic.required).toBeUndefined();
    });

    test('should have empty string default', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.profilepic.default).toBe('');
      expect(SchemaConstructor.profilepic.default).not.toBe(null);
      expect(SchemaConstructor.profilepic.default).not.toBeUndefined();
    });

    test('should be String type', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.profilepic.type).toBe(String);
    });
  });

  describe('Timestamp Behavior', () => {
    test('should automatically add createdAt field when timestamps is true', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const schemaOptions = mongoose.Schema.mock.calls[0][1];
      
      // Timestamps option adds createdAt and updatedAt automatically
      expect(schemaOptions.timestamps).toBe(true);
    });

    test('should automatically add updatedAt field when timestamps is true', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const schemaOptions = mongoose.Schema.mock.calls[0][1];
      
      expect(schemaOptions.timestamps).toBe(true);
    });

    test('should not manually define createdAt or updatedAt in schema', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      expect(SchemaConstructor.createdAt).toBeUndefined();
      expect(SchemaConstructor.updatedAt).toBeUndefined();
    });
  });

  describe('Schema Consistency', () => {
    test('should use consistent field definition style', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      // All fields should be objects with type property
      Object.keys(SchemaConstructor).forEach(field => {
        expect(typeof SchemaConstructor[field]).toBe('object');
        expect(SchemaConstructor[field].type).toBeDefined();
      });
    });

    test('should not mix shorthand and explicit field definitions', async () => {
      const User = (await import('../../models/User.js')).default;
      
      const SchemaConstructor = mongoose.Schema.mock.calls[0][0];
      
      // All fields should use object notation, not shorthand (e.g., email: String)
      Object.keys(SchemaConstructor).forEach(field => {
        expect(SchemaConstructor[field]).not.toBe(String);
        expect(SchemaConstructor[field]).not.toBe(Number);
        expect(SchemaConstructor[field]).not.toBe(Boolean);
      });
    });
  });
});