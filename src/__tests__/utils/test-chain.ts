/**
 * Test-Time Compute Chain Orchestrator
 * Implements: Search → Verify → Plan → Fix → Test → Verify cycle for error handling
 */

import { AppError, ErrorCode } from '@/lib/errors';
import { ErrorGenerator, ErrorScenario } from './error-generator';

export type ChainPhase = 'search' | 'verify' | 'plan' | 'fix' | 'test' | 'verify_final';

export interface ChainStep<T = any> {
  phase: ChainPhase;
  name: string;
  execute: () => Promise<T> | T;
  validate?: (result: T) => boolean | Promise<boolean>;
  onError?: (error: any) => Promise<void> | void;
  retryable?: boolean;
  maxRetries?: number;
}

export interface ChainResult {
  success: boolean;
  phase: ChainPhase;
  stepName: string;
  result?: any;
  error?: AppError;
  duration: number;
  retries: number;
}

export interface ChainReport {
  totalSteps: number;
  successfulSteps: number;
  failedSteps: number;
  totalDuration: number;
  results: ChainResult[];
  finalSuccess: boolean;
}

/**
 * Test Chain Orchestrator
 * Executes a sequence of test steps with error handling and recovery
 */
export class TestChainOrchestrator {
  private steps: ChainStep[] = [];
  private results: ChainResult[] = [];
  private errorGenerator: ErrorGenerator;
  private currentPhase: ChainPhase = 'search';

  constructor(errorGenerator?: ErrorGenerator) {
    this.errorGenerator = errorGenerator || new ErrorGenerator();
  }

  /**
   * Add a step to the chain
   */
  addStep<T>(step: ChainStep<T>): this {
    this.steps.push(step);
    return this;
  }

  /**
   * Add multiple steps to the chain
   */
  addSteps(steps: ChainStep[]): this {
    this.steps.push(...steps);
    return this;
  }

  /**
   * Execute the entire chain
   */
  async execute(): Promise<ChainReport> {
    const startTime = Date.now();
    this.results = [];

    for (const step of this.steps) {
      this.currentPhase = step.phase;
      const result = await this.executeStep(step);
      this.results.push(result);

      // Stop if step failed and is not retryable
      if (!result.success && !step.retryable) {
        break;
      }
    }

    const totalDuration = Date.now() - startTime;
    const successfulSteps = this.results.filter((r) => r.success).length;
    const failedSteps = this.results.filter((r) => !r.success).length;

    return {
      totalSteps: this.steps.length,
      successfulSteps,
      failedSteps,
      totalDuration,
      results: this.results,
      finalSuccess: failedSteps === 0,
    };
  }

  /**
   * Execute a single step with retry logic
   */
  private async executeStep<T>(step: ChainStep<T>): Promise<ChainResult> {
    const startTime = Date.now();
    const maxRetries = step.maxRetries ?? (step.retryable ? 3 : 0);
    let retries = 0;
    let lastError: any;

    while (retries <= maxRetries) {
      try {
        // Execute the step
        const result = await Promise.resolve(step.execute());

        // Validate the result if validator provided
        if (step.validate) {
          const isValid = await Promise.resolve(step.validate(result));
          if (!isValid) {
            throw new Error(`Validation failed for step: ${step.name}`);
          }
        }

        // Success
        return {
          success: true,
          phase: step.phase,
          stepName: step.name,
          result,
          duration: Date.now() - startTime,
          retries,
        };
      } catch (error) {
        lastError = error;
        retries++;

        // Call error handler if provided
        if (step.onError) {
          await Promise.resolve(step.onError(error));
        }

        // Wait before retry (exponential backoff)
        if (retries <= maxRetries) {
          await this.sleep(100 * Math.pow(2, retries - 1));
        }
      }
    }

    // All retries exhausted
    const appError = lastError instanceof AppError
      ? lastError
      : new AppError(lastError?.message || 'Step execution failed', ErrorCode.UNKNOWN_ERROR);

    return {
      success: false,
      phase: step.phase,
      stepName: step.name,
      error: appError,
      duration: Date.now() - startTime,
      retries,
    };
  }

  /**
   * Get current phase
   */
  getCurrentPhase(): ChainPhase {
    return this.currentPhase;
  }

  /**
   * Get results
   */
  getResults(): ChainResult[] {
    return [...this.results];
  }

  /**
   * Clear steps and results
   */
  reset(): void {
    this.steps = [];
    this.results = [];
    this.currentPhase = 'search';
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Error Handling Test Chain Builder
 * Provides a fluent API for building error handling test chains
 */
export class ErrorHandlingTestChain {
  private orchestrator: TestChainOrchestrator;
  private context: Record<string, any> = {};

  constructor() {
    this.orchestrator = new TestChainOrchestrator();
  }

  /**
   * Search phase: Find potential error sources
   */
  search(name: string, searchFn: () => Promise<any> | any): this {
    this.orchestrator.addStep({
      phase: 'search',
      name,
      execute: async () => {
        const result = await Promise.resolve(searchFn());
        this.context.searchResult = result;
        return result;
      },
      retryable: false,
    });
    return this;
  }

  /**
   * Verify phase: Verify error conditions
   */
  verify(name: string, verifyFn: (searchResult: any) => Promise<boolean> | boolean): this {
    this.orchestrator.addStep({
      phase: 'verify',
      name,
      execute: async () => {
        const result = await Promise.resolve(verifyFn(this.context.searchResult));
        this.context.verifyResult = result;
        return result;
      },
      validate: (result) => result === true,
      retryable: false,
    });
    return this;
  }

  /**
   * Plan phase: Plan error handling strategy
   */
  plan(name: string, planFn: (verifyResult: any) => Promise<any> | any): this {
    this.orchestrator.addStep({
      phase: 'plan',
      name,
      execute: async () => {
        const result = await Promise.resolve(planFn(this.context.verifyResult));
        this.context.plan = result;
        return result;
      },
      retryable: false,
    });
    return this;
  }

  /**
   * Fix phase: Implement error handling
   */
  fix(name: string, fixFn: (plan: any) => Promise<any> | any): this {
    this.orchestrator.addStep({
      phase: 'fix',
      name,
      execute: async () => {
        const result = await Promise.resolve(fixFn(this.context.plan));
        this.context.fix = result;
        return result;
      },
      retryable: true,
      maxRetries: 3,
    });
    return this;
  }

  /**
   * Test phase: Test the error handling
   */
  test(name: string, testFn: (fix: any) => Promise<boolean> | boolean): this {
    this.orchestrator.addStep({
      phase: 'test',
      name,
      execute: async () => {
        const result = await Promise.resolve(testFn(this.context.fix));
        this.context.testResult = result;
        return result;
      },
      validate: (result) => result === true,
      retryable: true,
      maxRetries: 3,
    });
    return this;
  }

  /**
   * Verify final phase: Final verification
   */
  verifyFinal(name: string, verifyFn: (testResult: any) => Promise<boolean> | boolean): this {
    this.orchestrator.addStep({
      phase: 'verify_final',
      name,
      execute: async () => {
        const result = await Promise.resolve(verifyFn(this.context.testResult));
        return result;
      },
      validate: (result) => result === true,
      retryable: false,
    });
    return this;
  }

  /**
   * Execute the chain
   */
  async run(): Promise<ChainReport> {
    return this.orchestrator.execute();
  }

  /**
   * Get context
   */
  getContext(): Record<string, any> {
    return { ...this.context };
  }
}

/**
 * Error Scenario Test Runner
 * Runs multiple error scenarios and collects results
 */
export class ErrorScenarioRunner {
  private scenarios: Map<ErrorScenario, ErrorHandlingTestChain> = new Map();
  private results: Map<ErrorScenario, ChainReport> = new Map();

  /**
   * Register a scenario
   */
  registerScenario(scenario: ErrorScenario, chain: ErrorHandlingTestChain): this {
    this.scenarios.set(scenario, chain);
    return this;
  }

  /**
   * Run all scenarios
   */
  async runAll(): Promise<Map<ErrorScenario, ChainReport>> {
    this.results.clear();

    for (const [scenario, chain] of this.scenarios) {
      const report = await chain.run();
      this.results.set(scenario, report);
    }

    return new Map(this.results);
  }

  /**
   * Run a specific scenario
   */
  async runScenario(scenario: ErrorScenario): Promise<ChainReport | null> {
    const chain = this.scenarios.get(scenario);
    if (!chain) {
      return null;
    }

    const report = await chain.run();
    this.results.set(scenario, report);
    return report;
  }

  /**
   * Get results
   */
  getResults(): Map<ErrorScenario, ChainReport> {
    return new Map(this.results);
  }

  /**
   * Get summary
   */
  getSummary(): {
    totalScenarios: number;
    passedScenarios: number;
    failedScenarios: number;
    successRate: number;
  } {
    const totalScenarios = this.results.size;
    const passedScenarios = Array.from(this.results.values()).filter((r) => r.finalSuccess).length;
    const failedScenarios = totalScenarios - passedScenarios;
    const successRate = totalScenarios > 0 ? (passedScenarios / totalScenarios) * 100 : 0;

    return {
      totalScenarios,
      passedScenarios,
      failedScenarios,
      successRate,
    };
  }

  /**
   * Clear scenarios and results
   */
  clear(): void {
    this.scenarios.clear();
    this.results.clear();
  }
}

/**
 * Helper function to create a test chain
 */
export function createTestChain(): ErrorHandlingTestChain {
  return new ErrorHandlingTestChain();
}

/**
 * Helper function to create a scenario runner
 */
export function createScenarioRunner(): ErrorScenarioRunner {
  return new ErrorScenarioRunner();
}
