/**
 * Centralized Error Handler Service
 * Manages global error handling, notifications, and recovery strategies
 */

'use client';

import { AppError, createError, logError, getUserErrorMessage, isRecoverableError } from './errors';
import { Notification } from '@/types';

type ErrorHandler = (error: AppError) => void;
type RecoveryStrategy = (error: AppError) => Promise<boolean> | boolean;

interface ErrorHandlerConfig {
  enableNotifications?: boolean;
  enableLogging?: boolean;
  enableRecovery?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Global Error Handler Service
 */
class ErrorHandlerService {
  private handlers: Set<ErrorHandler> = new Set();
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private errorHistory: AppError[] = [];
  private maxHistorySize = 100;
  private config: Required<ErrorHandlerConfig>;
  private notificationCallback?: (notification: Notification) => void;

  constructor(config: ErrorHandlerConfig = {}) {
    this.config = {
      enableNotifications: config.enableNotifications ?? true,
      enableLogging: config.enableLogging ?? true,
      enableRecovery: config.enableRecovery ?? true,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
    };

    // Register default recovery strategies
    this.registerDefaultRecoveryStrategies();
  }

  /**
   * Handle an error
   */
  async handleError(error: any, context?: string): Promise<void> {
    const appError = createError(error);

    // Log the error
    if (this.config.enableLogging) {
      logError(appError, context);
    }

    // Add to history
    this.addToHistory(appError);

    // Call registered handlers
    this.handlers.forEach((handler) => {
      try {
        handler(appError);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    });

    // Show notification
    if (this.config.enableNotifications) {
      this.showErrorNotification(appError);
    }

    // Attempt recovery
    if (this.config.enableRecovery && isRecoverableError(appError)) {
      await this.attemptRecovery(appError);
    }
  }

  /**
   * Register an error handler
   */
  registerHandler(handler: ErrorHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * Register a recovery strategy
   */
  registerRecoveryStrategy(errorCode: string, strategy: RecoveryStrategy): void {
    this.recoveryStrategies.set(errorCode, strategy);
  }

  /**
   * Set notification callback
   */
  setNotificationCallback(callback: (notification: Notification) => void): void {
    this.notificationCallback = callback;
  }

  /**
   * Get error history
   */
  getErrorHistory(): AppError[] {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Retry a failed operation
   */
  async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.maxRetries,
    delay: number = this.config.retryDelay
  ): Promise<T> {
    let lastError: any;
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        retryCount++;

        if (retryCount <= maxRetries) {
          // Exponential backoff
          const backoffDelay = delay * Math.pow(2, retryCount - 1);
          await this.sleep(backoffDelay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Execute operation with error handling
   */
  async execute<T>(
    operation: () => Promise<T>,
    context?: string,
    fallback?: T
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      await this.handleError(error, context);

      if (fallback !== undefined) {
        return fallback;
      }

      throw error;
    }
  }

  /**
   * Private: Add error to history
   */
  private addToHistory(error: AppError): void {
    this.errorHistory.push(error);

    // Trim history if too large
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Private: Show error notification
   */
  private showErrorNotification(error: AppError): void {
    if (!this.notificationCallback) {
      return;
    }

    const notification: Notification = {
      id: `error-${Date.now()}`,
      type: 'error',
      title: 'Error',
      message: getUserErrorMessage(error),
      duration: 5000,
    };

    this.notificationCallback(notification);
  }

  /**
   * Private: Attempt error recovery
   */
  private async attemptRecovery(error: AppError): Promise<boolean> {
    const strategy = this.recoveryStrategies.get(error.code);

    if (!strategy) {
      return false;
    }

    try {
      return await strategy(error);
    } catch (recoveryError) {
      logError(recoveryError, 'ErrorRecovery');
      return false;
    }
  }

  /**
   * Private: Register default recovery strategies
   */
  private registerDefaultRecoveryStrategies(): void {
    // Network error recovery - retry after delay
    this.registerRecoveryStrategy('NETWORK_ERROR', async () => {
      await this.sleep(2000);
      return navigator.onLine;
    });

    // Storage error recovery - clear corrupted data
    this.registerRecoveryStrategy('STORAGE_PARSE_ERROR', () => {
      // This would be handled case-by-case by the specific storage operation
      return true;
    });
  }

  /**
   * Private: Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandlerService();

/**
 * Hook to use error handler in React components
 */
export function useErrorHandler() {
  const [errors, setErrors] = React.useState<AppError[]>([]);

  React.useEffect(() => {
    const unsubscribe = errorHandler.registerHandler((error) => {
      setErrors((prev) => [...prev, error]);
    });

    return unsubscribe;
  }, []);

  const handleError = React.useCallback(async (error: any, context?: string) => {
    await errorHandler.handleError(error, context);
  }, []);

  const clearErrors = React.useCallback(() => {
    setErrors([]);
  }, []);

  return { errors, handleError, clearErrors };
}

/**
 * Higher-order function to wrap async operations with error handling
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      await errorHandler.handleError(error, context);
      throw error;
    }
  }) as T;
}

/**
 * Wrap a promise with automatic error handling
 */
export async function handlePromise<T>(
  promise: Promise<T>,
  context?: string
): Promise<[T | null, AppError | null]> {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    const appError = createError(error);
    await errorHandler.handleError(appError, context);
    return [null, appError];
  }
}

// Import React for hooks
import React from 'react';
