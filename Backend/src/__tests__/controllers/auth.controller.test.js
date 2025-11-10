import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { signup } from '../../controllers/auth.controller.js';
import { generateToken } from '../../lib/utils.js';
import User from '../../models/user.js';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('../../lib/utils.js');
jest.mock('../../models/user.js');
jest.mock('bcryptjs');

describe('Auth Controller - signup', () => {
  let mockReq;
  let mockRes;
  let consoleErrorSpy;

  beforeEach(() => {
    // Setup mock request and response
    mockReq = {
      body: {},
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Setup console spy
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Validation Tests', () => {
    test('should return 400 if fullname is missing', async () => {
      mockReq.body = { email: 'test@example.com', password: 'password123' };

      await signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'All fields are required' });
    });

    test('should return 400 if email is missing', async () => {
      mockReq.body = { fullname: 'Test User', password: 'password123' };

      await signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'All fields are required' });
    });

    test('should return 400 if password is missing', async () => {
      mockReq.body = { fullname: 'Test User', email: 'test@example.com' };

      await signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'All fields are required' });
    });

    test('should return 400 if all fields are missing', async () => {
      mockReq.body = {};

      await signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'All fields are required' });
    });

    test('should return 400 if password is less than 6 characters', async () => {
      mockReq.body = {
        fullname: 'Test User',
        email: 'test@example.com',
        password: '12345',
      };

      await signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Password must be at least 6 characters long',
      });
    });

    test('should return 400 if email does not contain @', async () => {
      mockReq.body = {
        fullname: 'Test User',
        email: 'invalid-email',
        password: 'password123',
      };

      await signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid email address' });
    });

    test('should accept password with exactly 6 characters', async () => {
      mockReq.body = {
        fullname: 'Test User',
        email: 'test@example.com',
        password: '123456',
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      const mockUser = {
        _id: 'userId123',
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        profilepic: '',
        save: jest.fn().mockResolvedValue(true),
      };
      User.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('token');

      await signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should handle empty string fields', async () => {
      mockReq.body = {
        fullname: '',
        email: '',
        password: '',
      };

      await signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'All fields are required' });
    });

    test('should handle whitespace-only fields', async () => {
      mockReq.body = {
        fullname: '   ',
        email: '   ',
        password: '   ',
      };

      await signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Password must be at least 6 characters long' });
    });
  });

  describe('Duplicate Email Tests', () => {
    test('should return 400 if email is already registered', async () => {
      mockReq.body = {
        fullname: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
      };

      User.findOne.mockResolvedValue({ email: 'existing@example.com' });

      await signup(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'existing@example.com' });
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Email is already registered' });
    });

    test('should check case-sensitive email uniqueness', async () => {
      mockReq.body = {
        fullname: 'Test User',
        email: 'Test@Example.COM',
        password: 'password123',
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      const mockUser = {
        _id: 'userId123',
        fullname: 'Test User',
        email: 'Test@Example.COM',
        password: 'hashedPassword',
        profilepic: '',
        save: jest.fn().mockResolvedValue(true),
      };
      User.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('token');

      await signup(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'Test@Example.COM' });
    });
  });

  describe('Password Hashing Tests', () => {
    test('should hash password with salt factor 10', async () => {
      mockReq.body = {
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('mockSalt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      const mockUser = {
        _id: 'userId123',
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        profilepic: '',
        save: jest.fn().mockResolvedValue(true),
      };
      User.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('token');

      await signup(mockReq, mockRes);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'mockSalt');
    });

    test('should store hashed password, not plain text', async () => {
      mockReq.body = {
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'plaintextpassword',
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('$2a$10$hashedpassword');
      
      const mockUser = {
        _id: 'userId123',
        fullname: 'Test User',
        email: 'test@example.com',
        password: '$2a$10$hashedpassword',
        profilepic: '',
        save: jest.fn().mockResolvedValue(true),
      };
      User.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('token');

      await signup(mockReq, mockRes);

      expect(User.create).toHaveBeenCalledWith({
        fullname: 'Test User',
        email: 'test@example.com',
        password: '$2a$10$hashedpassword',
      });
    });
  });

  describe('Successful Signup Tests', () => {
    test('should create user and return 201 with user data', async () => {
      mockReq.body = {
        fullname: 'John Doe',
        email: 'john@example.com',
        password: 'securepass123',
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      const mockUser = {
        _id: 'user123',
        fullname: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword',
        profilepic: '',
        save: jest.fn().mockResolvedValue(true),
      };
      User.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('jwtToken123');

      await signup(mockReq, mockRes);

      expect(generateToken).toHaveBeenCalledWith('user123', mockRes);
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        _id: 'user123',
        fullname: 'John Doe',
        email: 'john@example.com',
        profilepic: '',
      });
    });

    test('should not return password in response', async () => {
      mockReq.body = {
        fullname: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      const mockUser = {
        _id: 'user456',
        fullname: 'Jane Doe',
        email: 'jane@example.com',
        password: 'hashedPassword',
        profilepic: 'default.jpg',
        save: jest.fn().mockResolvedValue(true),
      };
      User.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('jwtToken456');

      await signup(mockReq, mockRes);

      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData).not.toHaveProperty('password');
    });

    test('should handle user with custom profile picture', async () => {
      mockReq.body = {
        fullname: 'User With Pic',
        email: 'user@example.com',
        password: 'password123',
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      const mockUser = {
        _id: 'user789',
        fullname: 'User With Pic',
        email: 'user@example.com',
        password: 'hashedPassword',
        profilepic: 'custom-pic.jpg',
        save: jest.fn().mockResolvedValue(true),
      };
      User.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('jwtToken789');

      await signup(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        _id: 'user789',
        fullname: 'User With Pic',
        email: 'user@example.com',
        profilepic: 'custom-pic.jpg',
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long fullname', async () => {
      const longName = 'a'.repeat(1000);
      mockReq.body = {
        fullname: longName,
        email: 'test@example.com',
        password: 'password123',
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      const mockUser = {
        _id: 'user123',
        fullname: longName,
        email: 'test@example.com',
        password: 'hashedPassword',
        profilepic: '',
        save: jest.fn().mockResolvedValue(true),
      };
      User.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('token');

      await signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should handle email with special characters before @', async () => {
      mockReq.body = {
        fullname: 'Test User',
        email: 'test+special.name_123@example.com',
        password: 'password123',
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      const mockUser = {
        _id: 'user123',
        fullname: 'Test User',
        email: 'test+special.name_123@example.com',
        password: 'hashedPassword',
        profilepic: '',
        save: jest.fn().mockResolvedValue(true),
      };
      User.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('token');

      await signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should handle password with special characters', async () => {
      mockReq.body = {
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'P@ssw0rd!#$%^&*()',
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      const mockUser = {
        _id: 'user123',
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        profilepic: '',
        save: jest.fn().mockResolvedValue(true),
      };
      User.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('token');

      await signup(mockReq, mockRes);

      expect(bcrypt.hash).toHaveBeenCalledWith('P@ssw0rd!#$%^&*()', 'salt');
    });

    test('should handle fullname with unicode characters', async () => {
      mockReq.body = {
        fullname: '测试用户 José García',
        email: 'test@example.com',
        password: 'password123',
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      const mockUser = {
        _id: 'user123',
        fullname: '测试用户 José García',
        email: 'test@example.com',
        password: 'hashedPassword',
        profilepic: '',
        save: jest.fn().mockResolvedValue(true),
      };
      User.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('token');

      await signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should handle email with multiple @ symbols (invalid)', async () => {
      mockReq.body = {
        fullname: 'Test User',
        email: 'test@@example.com',
        password: 'password123',
      };

      // Email validation only checks for @ presence, not format
      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      const mockUser = {
        _id: 'user123',
        fullname: 'Test User',
        email: 'test@@example.com',
        password: 'hashedPassword',
        profilepic: '',
        save: jest.fn().mockResolvedValue(true),
      };
      User.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('token');

      await signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('Error Handling', () => {
    test('should return 400 if User.create returns null', async () => {
      mockReq.body = {
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.create.mockResolvedValue(null);

      await signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid user data' });
    });

    test('should handle User.findOne error and return 500', async () => {
      mockReq.body = {
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const error = new Error('Database connection failed');
      User.findOne.mockRejectedValue(error);

      await signup(mockReq, mockRes);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Signup error:', error);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: 'Database connection failed',
      });
    });

    test('should handle bcrypt.genSalt error', async () => {
      mockReq.body = {
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      User.findOne.mockResolvedValue(null);
      const error = new Error('bcrypt genSalt failed');
      bcrypt.genSalt.mockRejectedValue(error);

      await signup(mockReq, mockRes);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Signup error:', error);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: 'bcrypt genSalt failed',
      });
    });

    test('should handle bcrypt.hash error', async () => {
      mockReq.body = {
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      const error = new Error('bcrypt hash failed');
      bcrypt.hash.mockRejectedValue(error);

      await signup(mockReq, mockRes);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Signup error:', error);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test('should handle User.create error', async () => {
      mockReq.body = {
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      const error = new Error('User creation failed');
      User.create.mockRejectedValue(error);

      await signup(mockReq, mockRes);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Signup error:', error);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test('should handle generateToken error', async () => {
      mockReq.body = {
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      const mockUser = {
        _id: 'user123',
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        profilepic: '',
        save: jest.fn().mockResolvedValue(true),
      };
      User.create.mockResolvedValue(mockUser);
      
      const error = new Error('Token generation failed');
      generateToken.mockImplementation(() => {
        throw error;
      });

      await signup(mockReq, mockRes);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Signup error:', error);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test('should handle user.save error', async () => {
      mockReq.body = {
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      const error = new Error('Save failed');
      const mockUser = {
        _id: 'user123',
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        profilepic: '',
        save: jest.fn().mockRejectedValue(error),
      };
      User.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('token');

      await signup(mockReq, mockRes);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Signup error:', error);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test('should handle error without message property', async () => {
      mockReq.body = {
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const error = { code: 'UNKNOWN_ERROR' };
      User.findOne.mockRejectedValue(error);

      await signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: undefined,
      });
    });
  });

  describe('Request Body Variations', () => {
    test('should ignore extra fields in request body', async () => {
      mockReq.body = {
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        extraField: 'should be ignored',
        anotherField: 123,
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      const mockUser = {
        _id: 'user123',
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        profilepic: '',
        save: jest.fn().mockResolvedValue(true),
      };
      User.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('token');

      await signup(mockReq, mockRes);

      expect(User.create).toHaveBeenCalledWith({
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
      });
    });

    test('should handle null values in request body', async () => {
      mockReq.body = {
        fullname: null,
        email: null,
        password: null,
      };

      await signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'All fields are required' });
    });

    test('should handle undefined request body', async () => {
      mockReq.body = undefined;

      await expect(async () => {
        await signup(mockReq, mockRes);
      }).rejects.toThrow();
    });
  });

  describe('Integration Flow Tests', () => {
    test('should complete full signup flow in correct order', async () => {
      mockReq.body = {
        fullname: 'Flow Test',
        email: 'flow@example.com',
        password: 'password123',
      };

      const callOrder = [];

      User.findOne.mockImplementation(() => {
        callOrder.push('findOne');
        return Promise.resolve(null);
      });

      bcrypt.genSalt.mockImplementation(() => {
        callOrder.push('genSalt');
        return Promise.resolve('salt');
      });

      bcrypt.hash.mockImplementation(() => {
        callOrder.push('hash');
        return Promise.resolve('hashedPassword');
      });

      const mockUser = {
        _id: 'user123',
        fullname: 'Flow Test',
        email: 'flow@example.com',
        password: 'hashedPassword',
        profilepic: '',
        save: jest.fn().mockImplementation(() => {
          callOrder.push('save');
          return Promise.resolve(true);
        }),
      };

      User.create.mockImplementation(() => {
        callOrder.push('create');
        return Promise.resolve(mockUser);
      });

      generateToken.mockImplementation(() => {
        callOrder.push('generateToken');
        return 'token';
      });

      await signup(mockReq, mockRes);

      expect(callOrder).toEqual(['findOne', 'genSalt', 'hash', 'create', 'generateToken', 'save']);
    });
  });
});