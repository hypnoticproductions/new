/**
 * Safe Storage Utilities
 * Provides error-safe wrappers for localStorage and sessionStorage operations
 */

import { StorageError, ErrorCode, logError } from './errors';

export type StorageType = 'local' | 'session';

/**
 * Check if storage is available in the browser
 */
function isStorageAvailable(type: StorageType): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const storage = type === 'local' ? window.localStorage : window.sessionStorage;

  try {
    const testKey = '__storage_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    // Storage is not available (private browsing, quota exceeded, etc.)
    return false;
  }
}

/**
 * Safely get an item from storage
 */
export function getStorageItem<T = string>(
  key: string,
  type: StorageType = 'local',
  defaultValue?: T
): T | null {
  try {
    if (!isStorageAvailable(type)) {
      logError(
        new StorageError('Storage not available', ErrorCode.STORAGE_NOT_AVAILABLE),
        'getStorageItem'
      );
      return defaultValue ?? null;
    }

    const storage = type === 'local' ? window.localStorage : window.sessionStorage;
    const item = storage.getItem(key);

    if (item === null) {
      return defaultValue ?? null;
    }

    return item as T;
  } catch (error) {
    logError(error, `getStorageItem:${key}`);
    return defaultValue ?? null;
  }
}

/**
 * Safely set an item in storage
 */
export function setStorageItem(
  key: string,
  value: string,
  type: StorageType = 'local'
): boolean {
  try {
    if (!isStorageAvailable(type)) {
      throw new StorageError('Storage not available', ErrorCode.STORAGE_NOT_AVAILABLE);
    }

    const storage = type === 'local' ? window.localStorage : window.sessionStorage;
    storage.setItem(key, value);
    return true;
  } catch (error: any) {
    // Check for quota exceeded error
    if (
      error?.name === 'QuotaExceededError' ||
      error?.code === 22 ||
      error?.code === 1014
    ) {
      logError(
        new StorageError('Storage quota exceeded', ErrorCode.STORAGE_QUOTA_EXCEEDED),
        `setStorageItem:${key}`
      );
    } else {
      logError(
        new StorageError('Failed to write to storage', ErrorCode.STORAGE_WRITE_ERROR),
        `setStorageItem:${key}`
      );
    }
    return false;
  }
}

/**
 * Safely remove an item from storage
 */
export function removeStorageItem(key: string, type: StorageType = 'local'): boolean {
  try {
    if (!isStorageAvailable(type)) {
      return false;
    }

    const storage = type === 'local' ? window.localStorage : window.sessionStorage;
    storage.removeItem(key);
    return true;
  } catch (error) {
    logError(error, `removeStorageItem:${key}`);
    return false;
  }
}

/**
 * Safely clear all storage
 */
export function clearStorage(type: StorageType = 'local'): boolean {
  try {
    if (!isStorageAvailable(type)) {
      return false;
    }

    const storage = type === 'local' ? window.localStorage : window.sessionStorage;
    storage.clear();
    return true;
  } catch (error) {
    logError(error, 'clearStorage');
    return false;
  }
}

/**
 * Safely parse JSON from storage
 */
export function getStorageJSON<T = any>(
  key: string,
  type: StorageType = 'local',
  defaultValue?: T
): T | null {
  try {
    const item = getStorageItem(key, type);

    if (item === null) {
      return defaultValue ?? null;
    }

    // Attempt to parse JSON
    try {
      return JSON.parse(item) as T;
    } catch (parseError) {
      logError(
        new StorageError(
          `Failed to parse JSON for key: ${key}`,
          ErrorCode.STORAGE_PARSE_ERROR,
          { additionalInfo: { key, value: item } }
        ),
        'getStorageJSON'
      );
      return defaultValue ?? null;
    }
  } catch (error) {
    logError(error, `getStorageJSON:${key}`);
    return defaultValue ?? null;
  }
}

/**
 * Safely stringify and store JSON
 */
export function setStorageJSON<T = any>(
  key: string,
  value: T,
  type: StorageType = 'local'
): boolean {
  try {
    const jsonString = JSON.stringify(value);
    return setStorageItem(key, jsonString, type);
  } catch (error) {
    logError(
      new StorageError(
        `Failed to stringify JSON for key: ${key}`,
        ErrorCode.STORAGE_PARSE_ERROR,
        { additionalInfo: { key, value } }
      ),
      'setStorageJSON'
    );
    return false;
  }
}

/**
 * Get all keys from storage
 */
export function getStorageKeys(type: StorageType = 'local'): string[] {
  try {
    if (!isStorageAvailable(type)) {
      return [];
    }

    const storage = type === 'local' ? window.localStorage : window.sessionStorage;
    return Object.keys(storage);
  } catch (error) {
    logError(error, 'getStorageKeys');
    return [];
  }
}

/**
 * Get storage usage information
 */
export function getStorageInfo(type: StorageType = 'local'): {
  available: boolean;
  keys: number;
  estimatedSize: number;
} {
  try {
    if (!isStorageAvailable(type)) {
      return { available: false, keys: 0, estimatedSize: 0 };
    }

    const storage = type === 'local' ? window.localStorage : window.sessionStorage;
    const keys = Object.keys(storage);

    // Estimate size in bytes
    let estimatedSize = 0;
    keys.forEach((key) => {
      const value = storage.getItem(key) || '';
      estimatedSize += key.length + value.length;
    });

    return {
      available: true,
      keys: keys.length,
      estimatedSize,
    };
  } catch (error) {
    logError(error, 'getStorageInfo');
    return { available: false, keys: 0, estimatedSize: 0 };
  }
}

/**
 * Safe storage wrapper class for organized key management
 */
export class SafeStorage {
  private prefix: string;
  private type: StorageType;

  constructor(prefix: string = 'app', type: StorageType = 'local') {
    this.prefix = prefix;
    this.type = type;
  }

  private getKey(key: string): string {
    return `${this.prefix}-${key}`;
  }

  get<T = string>(key: string, defaultValue?: T): T | null {
    return getStorageItem<T>(this.getKey(key), this.type, defaultValue);
  }

  set(key: string, value: string): boolean {
    return setStorageItem(this.getKey(key), value, this.type);
  }

  getJSON<T = any>(key: string, defaultValue?: T): T | null {
    return getStorageJSON<T>(this.getKey(key), this.type, defaultValue);
  }

  setJSON<T = any>(key: string, value: T): boolean {
    return setStorageJSON(this.getKey(key), value, this.type);
  }

  remove(key: string): boolean {
    return removeStorageItem(this.getKey(key), this.type);
  }

  clear(): boolean {
    try {
      const keys = getStorageKeys(this.type);
      const prefixedKeys = keys.filter((k) => k.startsWith(`${this.prefix}-`));

      prefixedKeys.forEach((key) => {
        removeStorageItem(key, this.type);
      });

      return true;
    } catch (error) {
      logError(error, 'SafeStorage.clear');
      return false;
    }
  }

  getInfo(): ReturnType<typeof getStorageInfo> {
    return getStorageInfo(this.type);
  }
}

// Default instances for the app
export const appStorage = new SafeStorage('safetravel', 'local');
export const sessionStorage = new SafeStorage('safetravel', 'session');
