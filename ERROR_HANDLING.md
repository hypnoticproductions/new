# Error Handling Test-Time Compute Chain

## Overview

This document describes the comprehensive error handling system implemented for the SafeTravel Monitor application, featuring a **Test-Time Compute Chain** that follows the pattern:

**Search → Verify → Plan → Fix → Test → Verify**

## Architecture

### Core Components

#### 1. Error Classes (`src/lib/errors.ts`)

Structured error hierarchy with semantic error types:

```typescript
- AppError (base class)
  ├── StorageError
  ├── NetworkError
  ├── ApiError
  ├── DataError
  ├── ComponentError
  └── MapError
```

**Features:**
- Unique error codes for categorization
- Severity levels (low, medium, high, critical)
- Recoverable/non-recoverable classification
- User-friendly error messages
- Comprehensive metadata tracking

#### 2. Safe Storage (`src/lib/safe-storage.ts`)

Error-safe wrappers for localStorage/sessionStorage:

```typescript
// Safe JSON operations
getStorageJSON<T>(key, type, defaultValue)
setStorageJSON<T>(key, value, type)

// Safe basic operations
getStorageItem(key, type, defaultValue)
setStorageItem(key, value, type)
removeStorageItem(key, type)
```

**Protection Against:**
- Storage unavailable (private browsing)
- Quota exceeded errors
- JSON parse errors
- Corrupted data

#### 3. Error Boundary (`src/components/ErrorBoundary.tsx`)

React component for catching render errors:

```typescript
<ErrorBoundary
  fallback={<CustomErrorUI />}
  onError={(error, info) => log(error)}
  resetKeys={[dependency]}
  isolate={true}
>
  <YourComponent />
</ErrorBoundary>
```

**Features:**
- Customizable fallback UI
- Error recovery via reset
- Isolated vs full-page error handling
- Component stack traces

#### 4. Error Handler Service (`src/lib/error-handler.ts`)

Centralized error management:

```typescript
// Handle errors
await errorHandler.handleError(error, context);

// Execute with error handling
const result = await errorHandler.execute(
  async () => operation(),
  'context',
  fallbackValue
);

// Retry failed operations
const result = await errorHandler.retry(
  async () => flakyOperation(),
  maxRetries,
  delay
);
```

**Features:**
- Global error tracking
- Error history
- Recovery strategies
- Retry mechanisms with exponential backoff

## Test-Time Compute Chain

### Chain Phases

#### 1. **Search Phase**
Identify potential error sources in the codebase.

```typescript
chain.search('Find corrupted storage', () => {
  // Search for error-prone code patterns
  return { locations: ['AppContext.tsx:166'] };
});
```

#### 2. **Verify Phase**
Verify that errors actually occur under specific conditions.

```typescript
chain.verify('Confirm parse error', (searchResult) => {
  // Trigger the error and verify it happens
  const data = getStorageJSON('corrupted-key');
  return data === null; // Should return null on error
});
```

#### 3. **Plan Phase**
Design the error handling strategy.

```typescript
chain.plan('Plan safe storage wrapper', () => {
  return {
    strategy: 'Wrap all JSON operations with try-catch',
    fallback: 'Return default value on error',
    logging: 'Log errors for debugging'
  };
});
```

#### 4. **Fix Phase**
Implement the planned error handling.

```typescript
chain.fix('Implement safe storage', (plan) => {
  // Implementation already done in safe-storage.ts
  return { implemented: true };
});
```

#### 5. **Test Phase**
Test that the error handling works correctly.

```typescript
chain.test('Verify safe storage works', () => {
  const result = getStorageJSON('corrupted-key', 'local', { default: true });
  return result.default === true; // Should use fallback
});
```

#### 6. **Verify Final Phase**
Final verification that the solution is complete.

```typescript
chain.verifyFinal('No errors thrown', (testResult) => {
  return testResult === true;
});
```

### Example: Complete Chain

```typescript
const chain = createTestChain()
  .search('Identify unsafe JSON.parse', () => ({
    file: 'AppContext.tsx',
    line: 166,
    code: 'JSON.parse(stored)'
  }))
  .verify('Verify crash with corrupted data', (searchResult) => {
    localStorage.setItem('test', '{invalid json}');
    try {
      JSON.parse(localStorage.getItem('test'));
      return false;
    } catch {
      return true; // Crash confirmed
    }
  })
  .plan('Plan safe wrapper', () => ({
    solution: 'Use getStorageJSON with error handling'
  }))
  .fix('Replace with safe version', (plan) => {
    // Replace: JSON.parse(localStorage.getItem('key'))
    // With: getStorageJSON('key', 'local', defaultValue)
    return { fixed: true };
  })
  .test('Test with corrupted data', () => {
    const result = getStorageJSON('test', 'local', { fallback: true });
    return result.fallback === true;
  })
  .verifyFinal('Verify no crashes', (testResult) => {
    return testResult === true;
  });

const report = await chain.run();
console.log(`Success: ${report.finalSuccess}`);
```

## Test Utilities

### Error Generator (`src/__tests__/utils/error-generator.ts`)

Generate controlled errors for testing:

```typescript
// Generate specific error scenarios
const error = errorGenerator.generate('storage_parse_error');

// Create faulty functions
const flakey = errorGenerator.createFaultyAsyncFunction(
  'success',
  'network_timeout',
  failOnCall: 2 // Fails on 2nd call
);

// Mock storage with failures
const mockStorage = new MockStorage();
mockStorage.setFailureMode('quota');
```

### Test Chain Orchestrator (`src/__tests__/utils/test-chain.ts`)

Execute test chains with retry logic:

```typescript
// Create and configure chain
const chain = createTestChain()
  .search('name', searchFn)
  .verify('name', verifyFn)
  .plan('name', planFn)
  .fix('name', fixFn)
  .test('name', testFn)
  .verifyFinal('name', verifyFn);

// Execute
const report = await chain.run();

// Analyze results
console.log({
  success: report.finalSuccess,
  duration: report.totalDuration,
  steps: report.successfulSteps
});
```

### Scenario Runner (`src/__tests__/utils/test-chain.ts`)

Run multiple error scenarios:

```typescript
const runner = createScenarioRunner();

// Register scenarios
runner.registerScenario('storage_error', storageChain);
runner.registerScenario('network_error', networkChain);
runner.registerScenario('api_error', apiChain);

// Run all
const results = await runner.runAll();

// Get summary
const summary = runner.getSummary();
console.log(`Success rate: ${summary.successRate}%`);
```

## Error Fixtures (`src/__tests__/fixtures/error-fixtures.ts`)

Pre-built test data for common error scenarios:

```typescript
// Corrupted data
corruptedStorageData.invalidJSON
corruptedStorageData.circularReference

// Invalid API responses
invalidAPIResponses.wrongDataTypes
invalidAPIResponses.corruptedSafetyData

// Network errors
networkErrorResponses.timeout
networkErrorResponses.offline

// HTTP errors
httpErrorResponses.serverError
httpErrorResponses.notFound

// Test helpers
testHelpers.createFlakeyFunction(value, failures)
testHelpers.createTimeBombFunction(value, successes)
```

## Implementation Examples

### Storage Error Handling

**Before (Unsafe):**
```typescript
const stored = localStorage.getItem('key');
if (stored) {
  setData(JSON.parse(stored)); // Can crash!
}
```

**After (Safe):**
```typescript
const stored = appStorage.getJSON<DataType>('key', defaultValue);
if (stored) {
  setData(stored); // Never crashes
}
```

### Network Error Handling

**Before (No handling):**
```typescript
const data = await fetch('/api/endpoint');
const json = await data.json();
```

**After (With handling):**
```typescript
try {
  const response = await fetch('/api/endpoint');

  if (!response.ok) {
    throw new ApiError(
      'Failed to fetch data',
      response.status,
      '/api/endpoint'
    );
  }

  const data = await response.json();
  return data;
} catch (error) {
  await errorHandler.handleError(error, 'fetchData');
  return fallbackData;
}
```

### Component Error Handling

**Wrap components:**
```typescript
export default function Page() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}
```

## Running Tests

```bash
# Run all error handling tests
npm test error-handling.test.ts

# Run with coverage
npm test -- --coverage

# Run specific scenario
npm test -- -t "Storage Error Handling Chain"
```

## Test Results

Each test chain produces a detailed report:

```typescript
{
  totalSteps: 6,
  successfulSteps: 6,
  failedSteps: 0,
  totalDuration: 145,
  results: [
    {
      success: true,
      phase: 'search',
      stepName: 'Find error source',
      result: { ... },
      duration: 12,
      retries: 0
    },
    // ... more steps
  ],
  finalSuccess: true
}
```

## Key Improvements

### Before Implementation
- ❌ No error boundaries - app crashes on component errors
- ❌ Unsafe localStorage access - crashes on corrupted data
- ❌ No network error handling - silent failures
- ❌ No error logging - can't debug production issues
- ❌ No error recovery - errors are permanent

### After Implementation
- ✅ Error boundaries catch all component errors
- ✅ Safe storage with automatic fallbacks
- ✅ Comprehensive network error handling
- ✅ Centralized error logging and tracking
- ✅ Automatic retry mechanisms
- ✅ User-friendly error messages
- ✅ Error recovery strategies

## Error Handling Checklist

- [x] Custom error class hierarchy
- [x] Safe storage utilities
- [x] Error boundary components
- [x] Global error handler service
- [x] Test error generator
- [x] Test chain orchestrator
- [x] Error fixtures
- [x] Comprehensive test suite
- [x] AppContext safety fixes
- [x] Documentation

## Best Practices

1. **Always use safe storage utilities** - Never use localStorage/JSON.parse directly
2. **Wrap async operations** - Use errorHandler.execute() for automatic handling
3. **Add error boundaries** - Protect component trees from crashes
4. **Provide fallbacks** - Always have default values
5. **Log errors** - Use logError() for debugging
6. **Test error scenarios** - Use the test chain to verify handling
7. **Make errors recoverable** - Implement retry and recovery strategies
8. **Give user feedback** - Show helpful error messages

## Future Enhancements

- [ ] Integration with Sentry or other error tracking services
- [ ] Error analytics dashboard
- [ ] A/B testing for error recovery strategies
- [ ] Machine learning for error prediction
- [ ] Automated error resolution
- [ ] Error trend analysis
- [ ] Real-time error monitoring

## References

- Error handling patterns: [JavaScript Error Handling Best Practices](https://javascript.info/error-handling)
- React error boundaries: [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- Test-driven development: [TDD Principles](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

---

**Last Updated:** 2024-01-03
**Version:** 1.0.0
**Maintainer:** SafeTravel Monitor Team
