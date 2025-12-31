/**
 * Error Test Fixtures
 * Sample data and scenarios for error handling tests
 */

import { SafetyData, Alert, Incident } from '@/types';

/**
 * Corrupted Storage Data Fixtures
 */
export const corruptedStorageData = {
  invalidJSON: '{invalid json}',
  incompleteJSON: '{"key": ',
  malformedArray: '[1, 2, 3,',
  undefinedValues: '{"key": undefined}',
  circularReference: (() => {
    const obj: any = { a: 1 };
    obj.self = obj;
    return obj;
  })(),
  emptyString: '',
  nullValue: 'null',
  nonJSONString: 'this is not JSON',
};

/**
 * Invalid API Response Fixtures
 */
export const invalidAPIResponses = {
  missingRequiredFields: {
    success: true,
    // Missing 'data' and 'timestamp'
  },
  wrongDataTypes: {
    success: 'true', // Should be boolean
    data: 'not an object',
    timestamp: 12345, // Should be string
  },
  nullData: {
    success: true,
    data: null,
    timestamp: '2024-01-01T00:00:00Z',
  },
  corruptedSafetyData: {
    success: true,
    data: {
      id: 123, // Should be string
      countryCode: null,
      safetyScore: 'high', // Should be number
      coordinates: 'invalid', // Should be tuple
    },
    timestamp: '2024-01-01T00:00:00Z',
  },
};

/**
 * Incomplete SafetyData Fixtures
 */
export const incompleteSafetyData = {
  missingCoordinates: {
    id: 'saf-us',
    countryCode: 'US',
    countryName: 'United States',
    region: 'North America',
    safetyScore: 75,
    riskLevel: 'moderate' as const,
    // Missing coordinates
  },
  missingSafetyScores: {
    id: 'saf-gb',
    countryCode: 'GB',
    countryName: 'United Kingdom',
    region: 'Europe',
    safetyScore: 82,
    riskLevel: 'safe' as const,
    coordinates: [55.3781, -3.4360] as [number, number],
    // Missing safetyScores object
  },
  wrongTypes: {
    id: 'saf-fr',
    countryCode: 'FR',
    countryName: 'France',
    region: 'Europe',
    safetyScore: '80', // Wrong type
    riskLevel: 'unknown', // Invalid enum value
    coordinates: [46.2276], // Incomplete tuple
  },
};

/**
 * Network Error Response Fixtures
 */
export const networkErrorResponses = {
  timeout: {
    name: 'AbortError',
    message: 'The user aborted a request',
  },
  offline: {
    name: 'TypeError',
    message: 'Failed to fetch',
  },
  cors: {
    name: 'TypeError',
    message: 'NetworkError when attempting to fetch resource',
  },
};

/**
 * HTTP Error Response Fixtures
 */
export const httpErrorResponses = {
  notFound: new Response(
    JSON.stringify({
      error: 'Not Found',
      message: 'The requested resource was not found',
    }),
    {
      status: 404,
      statusText: 'Not Found',
    }
  ),
  unauthorized: new Response(
    JSON.stringify({
      error: 'Unauthorized',
      message: 'Authentication required',
    }),
    {
      status: 401,
      statusText: 'Unauthorized',
    }
  ),
  forbidden: new Response(
    JSON.stringify({
      error: 'Forbidden',
      message: 'Access denied',
    }),
    {
      status: 403,
      statusText: 'Forbidden',
    }
  ),
  serverError: new Response(
    JSON.stringify({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    }),
    {
      status: 500,
      statusText: 'Internal Server Error',
    }
  ),
  badGateway: new Response(
    JSON.stringify({
      error: 'Bad Gateway',
      message: 'The server received an invalid response',
    }),
    {
      status: 502,
      statusText: 'Bad Gateway',
    }
  ),
  serviceUnavailable: new Response(
    JSON.stringify({
      error: 'Service Unavailable',
      message: 'The service is temporarily unavailable',
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
    }
  ),
};

/**
 * Valid Test Data Fixtures
 */
export const validTestData = {
  safetyData: {
    id: 'saf-test',
    countryCode: 'TS',
    countryName: 'Test Country',
    region: 'Test Region',
    safetyScore: 75,
    riskLevel: 'moderate' as const,
    safetyScores: {
      overall: 75,
      crime: 70,
      protest: 80,
      health: 75,
      natural: 85,
      political: 70,
    },
    trend: 'stable' as const,
    trendData: [
      { date: '2024-01-01', score: 75, events: 2 },
      { date: '2024-01-02', score: 76, events: 1 },
      { date: '2024-01-03', score: 74, events: 3 },
    ],
    lastUpdated: '2024-01-03T12:00:00Z',
    coordinates: [0, 0] as [number, number],
  } as SafetyData,

  alert: {
    id: 'alert-test-1',
    destinationId: 'saf-test',
    destinationName: 'Test Country',
    type: 'crime' as const,
    severity: 'medium' as const,
    title: 'Test Alert',
    description: 'This is a test alert',
    timestamp: '2024-01-03T12:00:00Z',
    coordinates: [0, 0] as [number, number],
    recommendations: ['Stay informed', 'Exercise caution'],
    isRead: false,
  } as Alert,

  incident: {
    id: 'inc-test-1',
    type: 'protest' as const,
    severity: 'low' as const,
    title: 'Test Incident',
    location: 'Test Location',
    date: '2024-01-03T10:00:00Z',
    description: 'This is a test incident',
  } as Incident,
};

/**
 * Component Error Scenarios
 */
export const componentErrorScenarios = {
  mapInitFailure: {
    error: new Error('Failed to initialize Leaflet map'),
    componentName: 'SafetyMap',
  },
  renderError: {
    error: new Error('Cannot read property of undefined'),
    componentName: 'SafetyDashboard',
  },
  lifecycleError: {
    error: new Error('Maximum update depth exceeded'),
    componentName: 'AlertManager',
  },
};

/**
 * Storage Error Scenarios
 */
export const storageErrorScenarios = {
  quotaExceeded: (() => {
    const error: any = new Error('QuotaExceededError');
    error.name = 'QuotaExceededError';
    error.code = 22;
    return error;
  })(),
  securityError: (() => {
    const error: any = new Error('SecurityError');
    error.name = 'SecurityError';
    return error;
  })(),
  unavailable: new Error('localStorage is not available'),
};

/**
 * Mock Error Handlers
 */
export const mockErrorHandlers = {
  throwError: () => {
    throw new Error('Mock error thrown');
  },
  returnError: () => {
    return new Error('Mock error returned');
  },
  rejectPromise: () => {
    return Promise.reject(new Error('Mock promise rejected'));
  },
  throwAfterDelay: async (delay: number = 100) => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    throw new Error('Mock error after delay');
  },
};

/**
 * Recovery Test Scenarios
 */
export const recoveryTestScenarios = {
  retryable: {
    maxRetries: 3,
    successOnRetry: 2,
    error: new Error('Temporary failure'),
  },
  nonRetryable: {
    maxRetries: 0,
    error: new Error('Permanent failure'),
  },
  intermittent: {
    failurePattern: [true, false, true, false, false], // fail, succeed, fail, succeed, succeed
    error: new Error('Intermittent failure'),
  },
};

/**
 * Test Helpers
 */
export const testHelpers = {
  /**
   * Create a delayed promise
   */
  delay: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  /**
   * Create a function that fails N times then succeeds
   */
  createFlakeyFunction: <T>(
    successValue: T,
    failuresBeforeSuccess: number,
    error: Error = new Error('Flakey function failed')
  ) => {
    let attempts = 0;
    return () => {
      attempts++;
      if (attempts <= failuresBeforeSuccess) {
        throw error;
      }
      return successValue;
    };
  },

  /**
   * Create a function that succeeds N times then fails
   */
  createTimeBombFunction: <T>(
    successValue: T,
    successesBeforeFailure: number,
    error: Error = new Error('Time bomb exploded')
  ) => {
    let attempts = 0;
    return () => {
      attempts++;
      if (attempts > successesBeforeFailure) {
        throw error;
      }
      return successValue;
    };
  },

  /**
   * Create a function that follows a failure pattern
   */
  createPatternFunction: <T>(
    successValue: T,
    failurePattern: boolean[], // true = fail, false = succeed
    error: Error = new Error('Pattern function failed')
  ) => {
    let index = 0;
    return () => {
      const shouldFail = failurePattern[index % failurePattern.length];
      index++;
      if (shouldFail) {
        throw error;
      }
      return successValue;
    };
  },
};
