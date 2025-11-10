import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { connectDB } from '../../lib/db.js';
import mongoose from 'mongoose';

// Mock mongoose
jest.mock('mongoose');

describe('Database Connection - connectDB', () => {
  let originalEnv;
  let consoleLogSpy;
  let consoleErrorSpy;
  let processExitSpy;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Setup spies
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit: ${code}`);
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Restore spies
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('Successful Connection', () => {
    test('should connect to database successfully with valid URI', async () => {
      const mockConnection = {
        connection: {
          host: 'localhost:27017',
        },
      };
      
      mongoose.connect.mockResolvedValue(mockConnection);
      process.env.MONGO_URI = 'mongodb://localhost:27017/testdb';

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URI);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Database connected successfully: localhost:27017'
      );
    });

    test('should connect with MongoDB Atlas URI', async () => {
      const mockConnection = {
        connection: {
          host: 'cluster0.mongodb.net',
        },
      };
      
      mongoose.connect.mockResolvedValue(mockConnection);
      process.env.MONGO_URI = 'mongodb+srv://user:pass@cluster0.mongodb.net/mydb';

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URI);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Database connected successfully: cluster0.mongodb.net'
      );
    });

    test('should handle connection with authentication', async () => {
      const mockConnection = {
        connection: {
          host: 'localhost:27017',
        },
      };
      
      mongoose.connect.mockResolvedValue(mockConnection);
      process.env.MONGO_URI = 'mongodb://admin:password@localhost:27017/testdb?authSource=admin';

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should handle connection with replica set', async () => {
      const mockConnection = {
        connection: {
          host: 'rs0/mongo1:27017,mongo2:27017,mongo3:27017',
        },
      };
      
      mongoose.connect.mockResolvedValue(mockConnection);
      process.env.MONGO_URI = 'mongodb://mongo1:27017,mongo2:27017,mongo3:27017/testdb?replicaSet=rs0';

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database connected successfully')
      );
    });
  });

  describe('Connection Failures', () => {
    test('should handle connection timeout error', async () => {
      const error = new Error('connection timed out');
      error.name = 'MongooseServerSelectionError';
      
      mongoose.connect.mockRejectedValue(error);
      process.env.MONGO_URI = 'mongodb://localhost:27017/testdb';

      await expect(async () => {
        await connectDB();
      }).rejects.toThrow('process.exit: 1');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Database connection error:',
        'connection timed out'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle authentication failure', async () => {
      const error = new Error('Authentication failed');
      error.name = 'MongoServerError';
      
      mongoose.connect.mockRejectedValue(error);
      process.env.MONGO_URI = 'mongodb://wronguser:wrongpass@localhost:27017/testdb';

      await expect(async () => {
        await connectDB();
      }).rejects.toThrow('process.exit: 1');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Database connection error:',
        'Authentication failed'
      );
    });

    test('should handle invalid connection string', async () => {
      const error = new Error('Invalid connection string');
      
      mongoose.connect.mockRejectedValue(error);
      process.env.MONGO_URI = 'invalid-uri';

      await expect(async () => {
        await connectDB();
      }).rejects.toThrow('process.exit: 1');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle network errors', async () => {
      const error = new Error('ECONNREFUSED');
      error.code = 'ECONNREFUSED';
      
      mongoose.connect.mockRejectedValue(error);
      process.env.MONGO_URI = 'mongodb://localhost:27017/testdb';

      await expect(async () => {
        await connectDB();
      }).rejects.toThrow('process.exit: 1');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Database connection error:',
        'ECONNREFUSED'
      );
    });

    test('should handle DNS resolution errors', async () => {
      const error = new Error('getaddrinfo ENOTFOUND invalidhost');
      error.code = 'ENOTFOUND';
      
      mongoose.connect.mockRejectedValue(error);
      process.env.MONGO_URI = 'mongodb://invalidhost:27017/testdb';

      await expect(async () => {
        await connectDB();
      }).rejects.toThrow('process.exit: 1');

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing MONGO_URI environment variable', async () => {
      delete process.env.MONGO_URI;
      
      mongoose.connect.mockRejectedValue(new Error('URI required'));

      await expect(async () => {
        await connectDB();
      }).rejects.toThrow();

      expect(mongoose.connect).toHaveBeenCalledWith(undefined);
    });

    test('should handle empty MONGO_URI', async () => {
      process.env.MONGO_URI = '';
      
      mongoose.connect.mockRejectedValue(new Error('Invalid URI'));

      await expect(async () => {
        await connectDB();
      }).rejects.toThrow('process.exit: 1');
    });

    test('should handle MONGO_URI with special characters', async () => {
      const mockConnection = {
        connection: {
          host: 'localhost:27017',
        },
      };
      
      mongoose.connect.mockResolvedValue(mockConnection);
      process.env.MONGO_URI = 'mongodb://user:p@ss!w0rd@localhost:27017/testdb';

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalled();
    });

    test('should handle connection with query parameters', async () => {
      const mockConnection = {
        connection: {
          host: 'localhost:27017',
        },
      };
      
      mongoose.connect.mockResolvedValue(mockConnection);
      process.env.MONGO_URI = 'mongodb://localhost:27017/testdb?retryWrites=true&w=majority';

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URI);
    });
  });

  describe('Process Exit Behavior', () => {
    test('should exit with code 1 on any error', async () => {
      mongoose.connect.mockRejectedValue(new Error('Connection failed'));
      process.env.MONGO_URI = 'mongodb://localhost:27017/testdb';

      await expect(async () => {
        await connectDB();
      }).rejects.toThrow('process.exit: 1');

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(processExitSpy).toHaveBeenCalledTimes(1);
    });

    test('should not exit on successful connection', async () => {
      const mockConnection = {
        connection: {
          host: 'localhost:27017',
        },
      };
      
      mongoose.connect.mockResolvedValue(mockConnection);
      process.env.MONGO_URI = 'mongodb://localhost:27017/testdb';

      await connectDB();

      expect(processExitSpy).not.toHaveBeenCalled();
    });
  });

  describe('Logging Behavior', () => {
    test('should log success message with correct format', async () => {
      const mockConnection = {
        connection: {
          host: 'myhost:27017',
        },
      };
      
      mongoose.connect.mockResolvedValue(mockConnection);
      process.env.MONGO_URI = 'mongodb://localhost:27017/testdb';

      await connectDB();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Database connected successfully: myhost:27017'
      );
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    test('should log error message with error details', async () => {
      const errorMessage = 'Detailed connection error';
      mongoose.connect.mockRejectedValue(new Error(errorMessage));
      process.env.MONGO_URI = 'mongodb://localhost:27017/testdb';

      await expect(async () => {
        await connectDB();
      }).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Database connection error:',
        errorMessage
      );
    });

    test('should handle error without message property', async () => {
      const error = { name: 'ConnectionError' };
      mongoose.connect.mockRejectedValue(error);
      process.env.MONGO_URI = 'mongodb://localhost:27017/testdb';

      await expect(async () => {
        await connectDB();
      }).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Concurrent Connection Attempts', () => {
    test('should handle multiple simultaneous connection attempts', async () => {
      const mockConnection = {
        connection: {
          host: 'localhost:27017',
        },
      };
      
      mongoose.connect.mockResolvedValue(mockConnection);
      process.env.MONGO_URI = 'mongodb://localhost:27017/testdb';

      const promises = [connectDB(), connectDB(), connectDB()];
      await Promise.all(promises);

      expect(mongoose.connect).toHaveBeenCalledTimes(3);
    });
  });
});