/**
 * Retry utility for handling flaky operations in Playwright tests
 */

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean; // Exponential backoff
  retryCondition?: (error: Error) => boolean; // Custom condition to determine if retry should happen
}

/**
 * Executes an operation with retry logic
 * @param operation - The async operation to retry
 * @param options - Retry configuration options
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = false,
    retryCondition
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // If we have a custom retry condition and it returns false, don't retry
      if (retryCondition && !retryCondition(lastError)) {
        throw lastError;
      }
      
      if (attempt === maxAttempts) {
        console.error(`Operation failed after ${maxAttempts} attempts:`, lastError.message);
        throw lastError;
      }
      
      const currentDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay;
      console.log(`Attempt ${attempt}/${maxAttempts} failed: ${lastError.message}. Retrying in ${currentDelay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }
  
  throw lastError!;
}

/**
 * Common retry conditions
 */
export const RetryConditions = {
  // Retry on network/timeout errors but not on assertion errors
  networkErrors: (error: Error) => {
    const message = error.message.toLowerCase();
    return message.includes('timeout') || 
           message.includes('network') || 
           message.includes('connection') ||
           message.includes('navigation');
  },
  
  // Retry on element not found but not on assertion errors
  elementErrors: (error: Error) => {
    const message = error.message.toLowerCase();
    return message.includes('element') || 
           message.includes('locator') ||
           message.includes('selector');
  },
  
  // Don't retry on assertion errors (expect failures)
  notAssertionErrors: (error: Error) => {
    return !error.message.includes('expect(');
  }
};