export class StorageManager {
    constructor(options = {}) {
        this.prefix = options.prefix || 'keigo_';
        this.defaultTTL = options.ttl;
    }
    getKey(key) {
        return `${this.prefix}${key}`;
    }
    set(key, value, ttl) {
        try {
            const item = {
                value,
                timestamp: Date.now()
            };
            if (ttl || this.defaultTTL) {
                item.expires = Date.now() + (ttl || this.defaultTTL);
            }
            localStorage.setItem(this.getKey(key), JSON.stringify(item));
            return true;
        }
        catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }
    get(key) {
        try {
            const data = localStorage.getItem(this.getKey(key));
            if (!data)
                return null;
            const item = JSON.parse(data);
            if (item.expires && item.expires < Date.now()) {
                this.remove(key);
                return null;
            }
            return item.value;
        }
        catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    }
    remove(key) {
        try {
            localStorage.removeItem(this.getKey(key));
            return true;
        }
        catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }
    clear(pattern) {
        try {
            const keys = Object.keys(localStorage);
            const prefix = this.getKey(pattern || '');
            keys.forEach(key => {
                if (key.startsWith(prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        }
        catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
    has(key) {
        return this.get(key) !== null;
    }
    getAll(pattern) {
        const result = {};
        const keys = Object.keys(localStorage);
        const prefix = this.getKey(pattern || '');
        keys.forEach(key => {
            if (key.startsWith(prefix)) {
                const cleanKey = key.replace(this.prefix, '');
                const value = this.get(cleanKey);
                if (value !== null) {
                    result[cleanKey] = value;
                }
            }
        });
        return result;
    }
    getSize() {
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
    isAvailable() {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        }
        catch (_a) {
            return false;
        }
    }
}
export const defaultStorage = new StorageManager();
//# sourceMappingURL=StorageManager.js.map