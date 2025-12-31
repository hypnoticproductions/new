/**
 * Custom Error Classes and Error Handling Utilities
 * Provides structured error types for the SafeTravel Monitor application
 */

export enum ErrorCode {
  // Storage Errors (1000-1099)
  STORAGE_NOT_AVAILABLE = 'STORAGE_NOT_AVAILABLE',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_PARSE_ERROR = 'STORAGE_PARSE_ERROR',
  STORAGE_WRITE_ERROR = 'STORAGE_WRITE_ERROR',

  // Network Errors (2000-2099)
  NETWORK_ERROR = 'NETWORK_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_OFFLINE = 'NETWORK_OFFLINE',

  // API Errors (3000-3099)
  API_ERROR = 'API_ERROR',
  API_NOT_FOUND = 'API_NOT_FOUND',
  API_UNAUTHORIZED = 'API_UNAUTHORIZED',
  API_FORBIDDEN = 'API_FORBIDDEN',
  API_VALIDATION_ERROR = 'API_VALIDATION_ERROR',
  API_SERVER_ERROR = 'API_SERVER_ERROR',

  // Data Errors (4000-4099)
  DATA_INVALID = 'DATA_INVALID',
  DATA_MISSING = 'DATA_MISSING',
  DATA_CORRUPTED = 'DATA_CORRUPTED',

  // Component Errors (5000-5099)
  COMPONENT_RENDER_ERROR = 'COMPONENT_RENDER_ERROR',
  COMPONENT_LIFECYCLE_ERROR = 'COMPONENT_LIFECYCLE_ERROR',

  // Map Errors (6000-6099)
  MAP_INITIALIZATION_ERROR = 'MAP_INITIALIZATION_ERROR',
  MAP_GEOCODING_ERROR = 'MAP_GEOCODING_ERROR',
  MAP_MARKER_ERROR = 'MAP_MARKER_ERROR',

  // Unknown Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorMetadata {
  timestamp: string;
  userAgent?: string;
  url?: string;
  componentStack?: string;
  additionalInfo?: Record<string, any>;
}

/**
 * Base Application Error
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly metadata: ErrorMetadata;
  public readonly recoverable: boolean;
  public readonly userMessage: string;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    recoverable: boolean = true,
    userMessage?: string,
    metadata?: Partial<ErrorMetadata>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = severity;
    this.recoverable = recoverable;
    this.userMessage = userMessage || this.getDefaultUserMessage();
    this.metadata = {
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...metadata,
    };

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  private getDefaultUserMessage(): string {
    switch (this.severity) {
      case ErrorSeverity.CRITICAL:
        return 'A critical error occurred. Please refresh the page or contact support.';
      case ErrorSeverity.HIGH:
        return 'An error occurred. Please try again.';
      case ErrorSeverity.MEDIUM:
        return 'Something went wrong. Please try again.';
      case ErrorSeverity.LOW:
        return 'A minor issue occurred.';
      default:
        return 'An unexpected error occurred.';
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      recoverable: this.recoverable,
      userMessage: this.userMessage,
      metadata: this.metadata,
      stack: this.stack,
    };
  }
}

/**
 * Storage-related errors
 */
export class StorageError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.STORAGE_NOT_AVAILABLE,
    metadata?: Partial<ErrorMetadata>
  ) {
    super(
      message,
      code,
      ErrorSeverity.MEDIUM,
      true,
      'Unable to access browser storage. Some features may not work properly.',
      metadata
    );
    this.name = 'StorageError';
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends AppError {
  public readonly statusCode?: number;

  constructor(
    message: string,
    statusCode?: number,
    code: ErrorCode = ErrorCode.NETWORK_ERROR,
    metadata?: Partial<ErrorMetadata>
  ) {
    const userMessage = statusCode === 0 || !navigator.onLine
      ? 'No internet connection. Please check your network.'
      : 'Network request failed. Please try again.';

    super(
      message,
      code,
      ErrorSeverity.MEDIUM,
      true,
      userMessage,
      { ...metadata, additionalInfo: { statusCode, ...metadata?.additionalInfo } }
    );
    this.name = 'NetworkError';
    this.statusCode = statusCode;
  }
}

/**
 * API-related errors
 */
export class ApiError extends AppError {
  public readonly statusCode: number;
  public readonly endpoint?: string;

  constructor(
    message: string,
    statusCode: number,
    endpoint?: string,
    metadata?: Partial<ErrorMetadata>
  ) {
    let code = ErrorCode.API_ERROR;
    let severity = ErrorSeverity.MEDIUM;

    if (statusCode === 404) code = ErrorCode.API_NOT_FOUND;
    else if (statusCode === 401) code = ErrorCode.API_UNAUTHORIZED;
    else if (statusCode === 403) code = ErrorCode.API_FORBIDDEN;
    else if (statusCode === 422) code = ErrorCode.API_VALIDATION_ERROR;
    else if (statusCode >= 500) {
      code = ErrorCode.API_SERVER_ERROR;
      severity = ErrorSeverity.HIGH;
    }

    const userMessage = statusCode >= 500
      ? 'Server error. Please try again later.'
      : 'Unable to complete request. Please try again.';

    super(
      message,
      code,
      severity,
      true,
      userMessage,
      { ...metadata, additionalInfo: { statusCode, endpoint, ...metadata?.additionalInfo } }
    );
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }
}

/**
 * Data validation errors
 */
export class DataError extends AppError {
  public readonly data?: any;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.DATA_INVALID,
    data?: any,
    metadata?: Partial<ErrorMetadata>
  ) {
    super(
      message,
      code,
      ErrorSeverity.LOW,
      true,
      'Invalid data received. Please try again.',
      { ...metadata, additionalInfo: { data, ...metadata?.additionalInfo } }
    );
    this.name = 'DataError';
    this.data = data;
  }
}

/**
 * Component-related errors
 */
export class ComponentError extends AppError {
  public readonly componentName?: string;

  constructor(
    message: string,
    componentName?: string,
    metadata?: Partial<ErrorMetadata>
  ) {
    super(
      message,
      ErrorCode.COMPONENT_RENDER_ERROR,
      ErrorSeverity.HIGH,
      true,
      'A component failed to load. Please refresh the page.',
      { ...metadata, additionalInfo: { componentName, ...metadata?.additionalInfo } }
    );
    this.name = 'ComponentError';
    this.componentName = componentName;
  }
}

/**
 * Map-related errors
 */
export class MapError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.MAP_INITIALIZATION_ERROR,
    metadata?: Partial<ErrorMetadata>
  ) {
    super(
      message,
      code,
      ErrorSeverity.MEDIUM,
      true,
      'Map failed to load. Please try refreshing the page.',
      metadata
    );
    this.name = 'MapError';
  }
}

/**
 * Error factory to create appropriate error instances
 */
export function createError(error: any): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Network/Fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new NetworkError(error.message, 0, ErrorCode.NETWORK_ERROR);
  }

  // Generic errors
  const message = error?.message || 'An unexpected error occurred';
  return new AppError(message, ErrorCode.UNKNOWN_ERROR, ErrorSeverity.MEDIUM);
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: any): boolean {
  if (error instanceof AppError) {
    return error.recoverable;
  }
  return true; // Assume recoverable by default
}

/**
 * Get user-friendly error message
 */
export function getUserErrorMessage(error: any): string {
  if (error instanceof AppError) {
    return error.userMessage;
  }
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Log error for debugging
 */
export function logError(error: any, context?: string): void {
  const timestamp = new Date().toISOString();
  const errorObj = error instanceof AppError ? error.toJSON() : error;

  console.error(`[${timestamp}]${context ? ` [${context}]` : ''}`, errorObj);

  // In production, this would send to an error tracking service
  // Example: Sentry.captureException(error);
}
