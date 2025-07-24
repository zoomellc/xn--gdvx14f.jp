import { StorageManager } from '../StorageManager';

describe('StorageManager', () => {
  let storage: StorageManager;
  
  beforeEach(() => {
    storage = new StorageManager({ prefix: 'test_' });
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should use default prefix when not provided', () => {
      const defaultStorage = new StorageManager();
      defaultStorage.set('key', 'value');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('keigo_key'),
        expect.any(String)
      );
    });

    it('should use custom prefix when provided', () => {
      storage.set('key', 'value');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('test_key'),
        expect.any(String)
      );
    });
  });

  describe('set', () => {
    it('should store value with timestamp', () => {
      const result = storage.set('key', 'value');
      
      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'test_key',
        expect.stringContaining('"value":"value"')
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'test_key',
        expect.stringContaining('"timestamp":')
      );
    });

    it('should store value with TTL', () => {
      const ttl = 5000;
      storage.set('key', 'value', ttl);
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'test_key',
        expect.stringContaining('"expires":')
      );
    });

    it('should return false on error', () => {
      (localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      const result = storage.set('key', 'value');
      expect(result).toBe(false);
    });
  });

  describe('get', () => {
    it('should retrieve stored value', () => {
      const storedData = {
        value: 'test value',
        timestamp: Date.now()
      };
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(storedData));
      
      const result = storage.get('key');
      expect(result).toBe('test value');
      expect(localStorage.getItem).toHaveBeenCalledWith('test_key');
    });

    it('should return null for non-existent key', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);
      
      const result = storage.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should return null for expired item', () => {
      const storedData = {
        value: 'test value',
        timestamp: Date.now() - 10000,
        expires: Date.now() - 5000
      };
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(storedData));
      
      const result = storage.get('key');
      expect(result).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('test_key');
    });

    it('should return value for non-expired item', () => {
      const storedData = {
        value: 'test value',
        timestamp: Date.now(),
        expires: Date.now() + 5000
      };
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(storedData));
      
      const result = storage.get('key');
      expect(result).toBe('test value');
    });

    it('should return null on parse error', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue('invalid json');
      
      const result = storage.get('key');
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove item from storage', () => {
      const result = storage.remove('key');
      
      expect(result).toBe(true);
      expect(localStorage.removeItem).toHaveBeenCalledWith('test_key');
    });

    it('should return false on error', () => {
      (localStorage.removeItem as jest.Mock).mockImplementation(() => {
        throw new Error('Remove failed');
      });
      
      const result = storage.remove('key');
      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    const originalObjectKeys = Object.keys;
    
    beforeEach(() => {
      Object.keys = jest.fn().mockReturnValue(['test_key1', 'test_key2', 'other_key']);
    });
    
    afterEach(() => {
      Object.keys = originalObjectKeys;
    });

    it('should clear all items with prefix', () => {
      storage.clear();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('test_key1');
      expect(localStorage.removeItem).toHaveBeenCalledWith('test_key2');
      expect(localStorage.removeItem).not.toHaveBeenCalledWith('other_key');
    });

    it('should clear items matching pattern', () => {
      storage.clear('key1');
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('test_key1');
      expect(localStorage.removeItem).not.toHaveBeenCalledWith('test_key2');
    });

    it('should return false on error', () => {
      const originalObjectKeys = Object.keys;
      Object.keys = jest.fn().mockImplementation(() => {
        throw new Error('Keys failed');
      });
      
      const result = storage.clear();
      expect(result).toBe(false);
      
      Object.keys = originalObjectKeys;
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      const storedData = {
        value: 'test value',
        timestamp: Date.now()
      };
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(storedData));
      
      const result = storage.has('key');
      expect(result).toBe(true);
    });

    it('should return false for non-existent key', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);
      
      const result = storage.has('key');
      expect(result).toBe(false);
    });
  });

  describe('getAll', () => {
    const originalObjectKeys = Object.keys;
    
    beforeEach(() => {
      Object.keys = jest.fn().mockReturnValue(['test_key1', 'test_key2', 'other_key']);
      (localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        const data: Record<string, any> = {
          'test_key1': JSON.stringify({ value: 'value1', timestamp: Date.now() }),
          'test_key2': JSON.stringify({ value: 'value2', timestamp: Date.now() })
        };
        return data[key] || null;
      });
    });
    
    afterEach(() => {
      Object.keys = originalObjectKeys;
    });

    it('should return all items with prefix', () => {
      const result = storage.getAll();
      
      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2'
      });
    });

    it('should filter by pattern', () => {
      const result = storage.getAll('key1');
      
      expect(result).toEqual({
        key1: 'value1'
      });
    });
  });

  describe('getSize', () => {
    const originalObjectKeys = Object.keys;
    
    beforeEach(() => {
      Object.keys = jest.fn().mockReturnValue(['test_key1', 'test_key2']);
      (localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        const data: Record<string, string> = {
          'test_key1': '12345',
          'test_key2': '123456789'
        };
        return data[key] || null;
      });
    });
    
    afterEach(() => {
      Object.keys = originalObjectKeys;
    });

    it('should calculate total size of stored items', () => {
      const size = storage.getSize();
      
      // test_key1 (9) + 12345 (5) + test_key2 (9) + 123456789 (9) = 32
      expect(size).toBe(32);
    });
  });

  describe('isAvailable', () => {
    it('should return true when localStorage is available', () => {
      const result = storage.isAvailable();
      expect(result).toBe(true);
    });

    it('should return false when localStorage throws error', () => {
      (localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage not available');
      });
      
      const result = storage.isAvailable();
      expect(result).toBe(false);
    });
  });
});