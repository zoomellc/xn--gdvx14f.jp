export interface StorageOptions {
  prefix?: string;
  ttl?: number;
}

export interface StorageItem<T = any> {
  value: T;
  timestamp?: number;
  expires?: number;
}

export class StorageManager {
  private prefix: string;
  private defaultTTL?: number;

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix || 'keigo_';
    this.defaultTTL = options.ttl;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    try {
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now()
      };

      if (ttl || this.defaultTTL) {
        item.expires = Date.now() + (ttl || this.defaultTTL!);
      }

      localStorage.setItem(this.getKey(key), JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }

  get<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(this.getKey(key));
      if (!data) return null;

      const item: StorageItem<T> = JSON.parse(data);

      if (item.expires && item.expires < Date.now()) {
        this.remove(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  remove(key: string): boolean {
    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }

  clear(pattern?: string): boolean {
    try {
      const keys = Object.keys(localStorage);
      const prefix = this.getKey(pattern || '');
      
      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key);
        }
      });
      
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  getAll<T>(pattern?: string): Record<string, T> {
    const result: Record<string, T> = {};
    const keys = Object.keys(localStorage);
    const prefix = this.getKey(pattern || '');

    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        const cleanKey = key.replace(this.prefix, '');
        const value = this.get<T>(cleanKey);
        if (value !== null) {
          result[cleanKey] = value;
        }
      }
    });

    return result;
  }

  getSize(): number {
    let size = 0;
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        const item = localStorage.getItem(key);
        if (item) {
          size += item.length + key.length;
        }
      }
    });

    return size;
  }

  isAvailable(): boolean {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}

export const defaultStorage = new StorageManager();