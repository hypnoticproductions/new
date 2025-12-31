/**
 * Test Error Generator
 * Utilities for generating controlled errors during testing
 */

import {
  AppError,
  StorageError,
  NetworkError,
  ApiError,
  DataError,
  ComponentError,
  MapError,
  ErrorCode,
  ErrorSeverity,
} from '@/lib/errors';

export type ErrorScenario =
  | 'storage_unavailable'
  | 'storage_quota_exceeded'
  | 'storage_parse_error'
  | 'network_offline'
  | 'network_timeout'
  | 'network_500'
  | 'api_404'
  | 'api_401'
  | 'api_500'
  | 'data_invalid'
  | 'data_corrupted'
  | 'component_crash'
  | 'map_init_failure'
  | 'unknown_error';

/**
 * Error Generator Class
 */
export class ErrorGenerator {
  private errorCount = 0;
  private errorLog: Array<{ scenario: ErrorScenario; error: AppError; timestamp: number }> = [];

  /**
   * Generate an error based on scenario
   */
  generate(scenario: ErrorScenario): AppError {
    this.errorCount++;
    let error: AppError;

    switch (scenario) {
      case 'storage_unavailable':
        error = new StorageError(
          'LocalStorage is not available in this browser',
          ErrorCode.STORAGE_NOT_AVAILABLE
        );
        break;

      case 'storage_quota_exceeded':
        error = new StorageError(
          'Storage quota has been exceeded',
          ErrorCode.STORAGE_QUOTA_EXCEEDED
        );
        break;

      case 'storage_parse_error':
        error = new StorageError(
          'Failed to parse JSON from storage',
          ErrorCode.STORAGE_PARSE_ERROR
        );
        break;

      case 'network_offline':
        error = new NetworkError('Network request failed', 0, ErrorCode.NETWORK_OFFLINE);
        break;

      case 'network_timeout':
        error = new NetworkError('Request timeout', undefined, ErrorCode.NETWORK_TIMEOUT);
        break;

      case 'network_500':
        error = new NetworkError('Internal server error', 500);
        break;

      case 'api_404':
        error = new ApiError('Resource not found', 404, '/api/destinations');
        break;

      case 'api_401':
        error = new ApiError('Unauthorized access', 401, '/api/user');
        break;

      case 'api_500':
        error = new ApiError('Server error occurred', 500, '/api/safety-data');
        break;

      case 'data_invalid':
        error = new DataError('Invalid data format received', ErrorCode.DATA_INVALID);
        break;

      case 'data_corrupted':
        error = new DataError('Data is corrupted', ErrorCode.DATA_CORRUPTED);
        break;

      case 'component_crash':
        error = new ComponentError('Component failed to render', 'SafetyMap');
        break;

      case 'map_init_failure':
        error = new MapError('Failed to initialize map', ErrorCode.MAP_INITIALIZATION_ERROR);
        break;

      case 'unknown_error':
      default:
        error = new AppError('An unknown error occurred', ErrorCode.UNKNOWN_ERROR);
        break;
    }

    this.errorLog.push({
      scenario,
      error,
      timestamp: Date.now(),
    });

    return error;
  }

  /**
   * Generate and throw an error
   */
  throw(scenario: ErrorScenario): never {
    throw this.generate(scenario);
  }

  /**
   * Generate an async error (rejected promise)
   */
  async throwAsync(scenario: ErrorScenario, delay: number = 0): Promise<never> {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    throw this.generate(scenario);
  }

  /**
   * Get error count
   */
  getErrorCount(): number {
    return this.errorCount;
  }

  /**
   * Get error log
   */
  getErrorLog() {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearLog(): void {
    this.errorLog = [];
    this.errorCount = 0;
  }

  /**
   * Create a faulty function that throws on nth call
   */
  createFaultyFunction<T>(
    successValue: T,
    scenario: ErrorScenario,
    failOnCall: number = 1
  ): () => T {
    let callCount = 0;

    return () => {
      callCount++;
      if (callCount === failOnCall) {
        this.throw(scenario);
      }
      return successValue;
    };
  }

  /**
   * Create a faulty async function that rejects on nth call
   */
  createFaultyAsyncFunction<T>(
    successValue: T,
    scenario: ErrorScenario,
    failOnCall: number = 1,
    delay: number = 0
  ): () => Promise<T> {
    let callCount = 0;

    return async () => {
      callCount++;
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      if (callCount === failOnCall) {
        throw this.generate(scenario);
      }
      return successValue;
    };
  }
}

/**
 * Mock Storage that can simulate errors
 */
export class MockStorage implements Storage {
  private store: Map<string, string> = new Map();
  private shouldFail: boolean = false;
  private failureMode: 'unavailable' | 'quota' | 'parse' = 'unavailable';

  get length(): number {
    return this.store.size;
  }

  setFailureMode(mode: 'unavailable' | 'quota' | 'parse' | null): void {
    this.shouldFail = mode !== null;
    if (mode) {
      this.failureMode = mode;
    }
  }

  getItem(key: string): string | null {
    if (this.shouldFail && this.failureMode === 'unavailable') {
      throw new Error('Storage is not available');
    }

    const value = this.store.get(key) || null;

    if (this.shouldFail && this.failureMode === 'parse' && value) {
      return '{invalid json}';
    }

    return value;
  }

  setItem(key: string, value: string): void {
    if (this.shouldFail && this.failureMode === 'unavailable') {
      throw new Error('Storage is not available');
    }

    if (this.shouldFail && this.failureMode === 'quota') {
      const error: any = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      error.code = 22;
      throw error;
    }

    this.store.set(key, value);
  }

  removeItem(key: string): void {
    if (this.shouldFail && this.failureMode === 'unavailable') {
      throw new Error('Storage is not available');
    }
    this.store.delete(key);
  }

  clear(): void {
    if (this.shouldFail && this.failureMode === 'unavailable') {
      throw new Error('Storage is not available');
    }
    this.store.clear();
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] || null;
  }
}

/**
 * Mock Network that can simulate errors
 */
export class MockNetwork {
  private shouldFail: boolean = false;
  private failureMode: 'offline' | 'timeout' | '500' | '404' = 'offline';
  private delay: number = 0;

  setFailureMode(mode: 'offline' | 'timeout' | '500' | '404' | null, delay: number = 0): void {
    this.shouldFail = mode !== null;
    if (mode) {
      this.failureMode = mode;
    }
    this.delay = delay;
  }

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    if (this.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delay));
    }

    if (this.shouldFail) {
      switch (this.failureMode) {
        case 'offline':
          throw new TypeError('Failed to fetch');

        case 'timeout':
          throw new Error('Request timeout');

        case '500':
          return new Response(JSON.stringify({ error: 'Server error' }), {
            status: 500,
            statusText: 'Internal Server Error',
          });

        case '404':
          return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            statusText: 'Not Found',
          });
      }
    }

    // Success response
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      statusText: 'OK',
    });
  }
}

/**
 * Corrupt data generator
 */
export class CorruptDataGenerator {
  /**
   * Generate corrupted JSON
   */
  generateCorruptedJSON(): string {
    const variations = [
      '{invalid json}',
      '{"key": undefined}',
      '{"key": }',
      '{key: "value"}',
      '{"key": "value"',
      'null',
      'undefined',
      '',
    ];

    return variations[Math.floor(Math.random() * variations.length)];
  }

  /**
   * Generate incomplete data
   */
  generateIncompleteData<T extends object>(template: T): Partial<T> {
    const keys = Object.keys(template);
    const numKeysToRemove = Math.floor(Math.random() * keys.length) + 1;
    const keysToRemove = keys.slice(0, numKeysToRemove);

    const incomplete: any = { ...template };
    keysToRemove.forEach((key) => delete incomplete[key]);

    return incomplete;
  }

  /**
   * Generate data with wrong types
   */
  generateWrongTypeData<T extends object>(template: T): Record<string, any> {
    const wrong: any = {};

    Object.entries(template).forEach(([key, value]) => {
      if (typeof value === 'string') {
        wrong[key] = 123;
      } else if (typeof value === 'number') {
        wrong[key] = 'not a number';
      } else if (typeof value === 'boolean') {
        wrong[key] = 'not a boolean';
      } else if (Array.isArray(value)) {
        wrong[key] = 'not an array';
      } else {
        wrong[key] = null;
      }
    });

    return wrong;
  }
}

// Export singleton instances
export const errorGenerator = new ErrorGenerator();
export const corruptDataGenerator = new CorruptDataGenerator();
