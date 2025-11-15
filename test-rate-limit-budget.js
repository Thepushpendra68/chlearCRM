// Test rate limiting and budget tracking
console.log('=== Testing Rate Limiting & Budget Tracking ===\n');

// Simulate budget tracking
let usageStats = {
  requests: 0,
  totalCost: 0,
  dailyCost: 0,
  monthlyCost: 0,
  lastResetDate: new Date().toDateString(),
  lastResetMonth: new Date().getMonth(),
  byModel: {},
};

const MODEL_COSTS = {
  "gemini-2.0-flash-exp": { input: 0.001, output: 0.004 },
  "gemini-1.5-flash-latest": { input: 0.00035, output: 0.00105 },
  "gemini-1.5-pro-latest": { input: 0.00125, output: 0.00375 },
  "gemini-pro-latest": { input: 0.0005, output: 0.0015 },
};

const RATE_LIMIT_CONFIG = {
  monthlyBudgetLimit: 100,
  dailyBudgetLimit: 5,
};

// Test 1: Check budget
console.log('Test 1: Budget check for valid request');
const modelName = "gemini-1.5-flash-latest";
const estimatedInputTokens = 1000;
const estimatedOutputTokens = 500;
const modelCosts = MODEL_COSTS[modelName] || MODEL_COSTS["gemini-1.5-flash-latest"];
const estimatedCost =
  (estimatedInputTokens / 1000) * modelCosts.input +
  (estimatedOutputTokens / 1000) * modelCosts.output;

console.log(`  Model: ${modelName}`);
console.log(`  Estimated input tokens: ${estimatedInputTokens}`);
console.log(`  Estimated output tokens: ${estimatedOutputTokens}`);
console.log(`  Estimated cost: $${estimatedCost.toFixed(6)}`);
console.log(`  Daily budget remaining: $${(RATE_LIMIT_CONFIG.dailyBudgetLimit - usageStats.dailyCost).toFixed(4)}`);
console.log(`  Can proceed: ${estimatedCost < (RATE_LIMIT_CONFIG.dailyBudgetLimit - usageStats.dailyCost)}`);
console.log('');

// Test 2: Record usage
console.log('Test 2: Record usage after successful API call');
usageStats.requests += 1;
usageStats.totalCost += estimatedCost;
usageStats.dailyCost += estimatedCost;
usageStats.monthlyCost += estimatedCost;

if (!usageStats.byModel[modelName]) {
  usageStats.byModel[modelName] = {
    requests: 0,
    tokens: { input: 0, output: 0 },
    cost: 0,
  };
}
usageStats.byModel[modelName].requests += 1;
usageStats.byModel[modelName].tokens.input += estimatedInputTokens;
usageStats.byModel[modelName].tokens.output += estimatedOutputTokens;
usageStats.byModel[modelName].cost += estimatedCost;

console.log(`  Total requests: ${usageStats.requests}`);
console.log(`  Total cost: $${usageStats.totalCost.toFixed(6)}`);
console.log(`  Daily cost: $${usageStats.dailyCost.toFixed(6)} / $${RATE_LIMIT_CONFIG.dailyBudgetLimit}`);
console.log(`  Monthly cost: $${usageStats.monthlyCost.toFixed(6)} / $${RATE_LIMIT_CONFIG.monthlyBudgetLimit}`);
console.log('');

// Test 3: Budget alert check
console.log('Test 3: Budget alert check');
const dailyPercent = (usageStats.dailyCost / RATE_LIMIT_CONFIG.dailyBudgetLimit) * 100;
const monthlyPercent = (usageStats.monthlyCost / RATE_LIMIT_CONFIG.monthlyBudgetLimit) * 100;

console.log(`  Daily usage: ${dailyPercent.toFixed(1)}%`);
console.log(`  Monthly usage: ${monthlyPercent.toFixed(1)}%`);

if (dailyPercent >= 80 && dailyPercent < 90) {
  console.log('  ⚠️ WARNING: Daily budget at 80%+');
} else if (dailyPercent >= 90) {
  console.log('  🚨 CRITICAL: Daily budget at 90%+');
}

if (monthlyPercent >= 80 && monthlyPercent < 90) {
  console.log('  ⚠️ WARNING: Monthly budget at 80%+');
} else if (monthlyPercent >= 90) {
  console.log('  🚨 CRITICAL: Monthly budget at 90%+');
}
console.log('');

// Test 4: Budget exceeded check
console.log('Test 4: Check budget when daily limit would be exceeded');
const largeRequestCost = 10.0; // $10 request
console.log(`  Request cost: $${largeRequestCost}`);
console.log(`  Current daily cost: $${usageStats.dailyCost.toFixed(6)}`);
console.log(`  Would exceed limit: ${usageStats.dailyCost + largeRequestCost > RATE_LIMIT_CONFIG.dailyBudgetLimit}`);
console.log(`  Reason: Daily budget exceeded`);
console.log('');

// Test 5: Model cost comparison
console.log('Test 5: Model cost comparison (per 1K tokens)');
Object.entries(MODEL_COSTS).forEach(([model, costs]) => {
  const totalPer1K = costs.input + costs.output;
  console.log(`  ${model}:`);
  console.log(`    Input: $${costs.input.toFixed(6)}/1K tokens`);
  console.log(`    Output: $${costs.output.toFixed(6)}/1K tokens`);
  console.log(`    Total: $${totalPer1K.toFixed(6)}/1K tokens`);
});
console.log('');

// Test 6: Usage statistics summary
console.log('Test 6: Usage statistics summary');
console.log(`  Total requests: ${usageStats.requests}`);
console.log(`  Total cost: $${usageStats.totalCost.toFixed(6)}`);
console.log('  By model:');
Object.entries(usageStats.byModel).forEach(([model, stats]) => {
  console.log(`    ${model}:`);
  console.log(`      Requests: ${stats.requests}`);
  console.log(`      Input tokens: ${stats.tokens.input}`);
  console.log(`      Output tokens: ${stats.tokens.output}`);
  console.log(`      Cost: $${stats.cost.toFixed(6)}`);
});

console.log('\n=== All Tests Complete ===');
