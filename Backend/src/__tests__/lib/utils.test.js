import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { generateToken } from '../../lib/utils.js';
import JWT from 'jsonwebtoken';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('Utils - generateToken', () => {
  let mockRes;
  let originalEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = process.env.NODE_ENV;
    
    // Create mock response object
    mockRes = {
      cookie: jest.fn(),
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original env
    process.env.NODE_ENV = originalEnv;
  });

  describe('Happy Path', () => {
    test('should generate a valid JWT token', () => {
      const userId = '123456789';
      const mockToken = 'mock.jwt.token';
      
      JWT.sign.mockReturnValue(mockToken);

      const result = generateToken(userId, mockRes);

      expect(JWT.sign).toHaveBeenCalledWith(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      expect(result).toBe(mockToken);
    });

    test('should set cookie with correct parameters in development', () => {
      const userId = '123456789';
      const mockToken = 'mock.jwt.token';
      process.env.NODE_ENV = 'development';
      
      JWT.sign.mockReturnValue(mockToken);

      generateToken(userId, mockRes);

      expect(mockRes.cookie).toHaveBeenCalledWith('jwt', mockToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'strict',
        secure: false,
      });
    });

    test('should set secure cookie in production', () => {
      const userId = '123456789';
      const mockToken = 'mock.jwt.token';
      process.env.NODE_ENV = 'production';
      
      JWT.sign.mockReturnValue(mockToken);

      generateToken(userId, mockRes);

      expect(mockRes.cookie).toHaveBeenCalledWith('jwt', mockToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
      });
    });

    test('should handle MongoDB ObjectId as userId', () => {
      const userId = { toString: () => '507f1f77bcf86cd799439011' };
      const mockToken = 'mock.jwt.token';
      
      JWT.sign.mockReturnValue(mockToken);

      const result = generateToken(userId, mockRes);

      expect(result).toBe(mockToken);
      expect(JWT.sign).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty string userId', () => {
      const userId = '';
      const mockToken = 'mock.jwt.token';
      
      JWT.sign.mockReturnValue(mockToken);

      const result = generateToken(userId, mockRes);

      expect(JWT.sign).toHaveBeenCalledWith(
        { userId: '' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      expect(result).toBe(mockToken);
    });

    test('should handle null userId', () => {
      const userId = null;
      const mockToken = 'mock.jwt.token';
      
      JWT.sign.mockReturnValue(mockToken);

      const result = generateToken(userId, mockRes);

      expect(JWT.sign).toHaveBeenCalledWith(
        { userId: null },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      expect(result).toBe(mockToken);
    });

    test('should handle undefined userId', () => {
      const userId = undefined;
      const mockToken = 'mock.jwt.token';
      
      JWT.sign.mockReturnValue(mockToken);

      const result = generateToken(userId, mockRes);

      expect(JWT.sign).toHaveBeenCalledWith(
        { userId: undefined },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      expect(result).toBe(mockToken);
    });

    test('should handle numeric userId', () => {
      const userId = 12345;
      const mockToken = 'mock.jwt.token';
      
      JWT.sign.mockReturnValue(mockToken);

      const result = generateToken(userId, mockRes);

      expect(JWT.sign).toHaveBeenCalledWith(
        { userId: 12345 },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      expect(result).toBe(mockToken);
    });

    test('should handle special characters in userId', () => {
      const userId = 'user@#$%^&*()';
      const mockToken = 'mock.jwt.token';
      
      JWT.sign.mockReturnValue(mockToken);

      const result = generateToken(userId, mockRes);

      expect(result).toBe(mockToken);
    });

    test('should handle very long userId', () => {
      const userId = 'a'.repeat(1000);
      const mockToken = 'mock.jwt.token';
      
      JWT.sign.mockReturnValue(mockToken);

      const result = generateToken(userId, mockRes);

      expect(result).toBe(mockToken);
    });
  });

  describe('Cookie Configuration', () => {
    test('should set httpOnly flag to prevent XSS attacks', () => {
      const userId = '123';
      const mockToken = 'mock.jwt.token';
      
      JWT.sign.mockReturnValue(mockToken);

      generateToken(userId, mockRes);

      const cookieOptions = mockRes.cookie.mock.calls[0][2];
      expect(cookieOptions.httpOnly).toBe(true);
    });

    test('should set sameSite to strict for CSRF protection', () => {
      const userId = '123';
      const mockToken = 'mock.jwt.token';
      
      JWT.sign.mockReturnValue(mockToken);

      generateToken(userId, mockRes);

      const cookieOptions = mockRes.cookie.mock.calls[0][2];
      expect(cookieOptions.sameSite).toBe('strict');
    });

    test('should set correct maxAge (7 days in milliseconds)', () => {
      const userId = '123';
      const mockToken = 'mock.jwt.token';
      const expectedMaxAge = 7 * 24 * 60 * 60 * 1000; // 604800000
      
      JWT.sign.mockReturnValue(mockToken);

      generateToken(userId, mockRes);

      const cookieOptions = mockRes.cookie.mock.calls[0][2];
      expect(cookieOptions.maxAge).toBe(expectedMaxAge);
    });
  });

  describe('Error Handling', () => {
    test('should throw error if JWT.sign fails', () => {
      const userId = '123';
      JWT.sign.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      expect(() => generateToken(userId, mockRes)).toThrow('JWT signing failed');
    });

    test('should throw error if res.cookie fails', () => {
      const userId = '123';
      const mockToken = 'mock.jwt.token';
      
      JWT.sign.mockReturnValue(mockToken);
      mockRes.cookie.mockImplementation(() => {
        throw new Error('Cookie setting failed');
      });

      expect(() => generateToken(userId, mockRes)).toThrow('Cookie setting failed');
    });

    test('should handle missing JWT_SECRET', () => {
      const userId = '123';
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      JWT.sign.mockImplementation(() => {
        throw new Error('secretOrPrivateKey must have a value');
      });

      expect(() => generateToken(userId, mockRes)).toThrow();
      
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('Response Object Validation', () => {
    test('should work with minimal response object', () => {
      const userId = '123';
      const mockToken = 'mock.jwt.token';
      const minimalRes = { cookie: jest.fn() };
      
      JWT.sign.mockReturnValue(mockToken);

      const result = generateToken(userId, minimalRes);

      expect(result).toBe(mockToken);
      expect(minimalRes.cookie).toHaveBeenCalled();
    });

    test('should handle response object with additional methods', () => {
      const userId = '123';
      const mockToken = 'mock.jwt.token';
      const extendedRes = {
        cookie: jest.fn(),
        status: jest.fn(),
        json: jest.fn(),
        send: jest.fn(),
      };
      
      JWT.sign.mockReturnValue(mockToken);

      const result = generateToken(userId, extendedRes);

      expect(result).toBe(mockToken);
      expect(extendedRes.cookie).toHaveBeenCalled();
      expect(extendedRes.status).not.toHaveBeenCalled();
    });
  });
});