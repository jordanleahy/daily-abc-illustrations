// Quick test file to verify formatTimeRemaining function
import { formatTimeRemaining } from './timeUtils';

// Test function
export const testTimeFormatting = () => {
  const now = new Date();
  
  // Test cases
  const testCases = [
    {
      name: "2 days 5 hours 30 minutes",
      expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    },
    {
      name: "1 hour 25 minutes 10 seconds", 
      expiresAt: new Date(now.getTime() + 1 * 60 * 60 * 1000 + 25 * 60 * 1000 + 10 * 1000).toISOString(),
    },
    {
      name: "5 minutes 30 seconds",
      expiresAt: new Date(now.getTime() + 5 * 60 * 1000 + 30 * 1000).toISOString(),
    },
    {
      name: "30 seconds",
      expiresAt: new Date(now.getTime() + 30 * 1000).toISOString(),
    },
    {
      name: "Expired (past time)",
      expiresAt: new Date(now.getTime() - 1000).toISOString(),
    }
  ];

  console.log("=== Time Formatting Tests ===");
  testCases.forEach(testCase => {
    const result = formatTimeRemaining(testCase.expiresAt);
    console.log(`${testCase.name}: "${result}"`);
  });
};

// Auto-run test if needed
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.testTimeFormatting = testTimeFormatting;
}