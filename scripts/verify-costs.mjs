process.env.OPENAI_INPUT_USD_PER_1M = "2";
process.env.OPENAI_OUTPUT_USD_PER_1M = "8";
delete process.env.OPENAI_TOTAL_USD_PER_1M;

const { costPricingConfig, enrichUsageRecord, estimateApiCostUsd, usageTokens } = await import("../server.mjs");

const failures = [];

function fail(message) {
  failures.push(message);
}

const pricing = costPricingConfig();
if (!pricing.configured) fail("cost pricing should be configured when input and output rates are set");
if (pricing.inputUsdPer1M !== 2) fail("input token price should parse from OPENAI_INPUT_USD_PER_1M");
if (pricing.outputUsdPer1M !== 8) fail("output token price should parse from OPENAI_OUTPUT_USD_PER_1M");

const tokens = usageTokens({ input_tokens: 1_000_000, output_tokens: 500_000 });
if (tokens.inputTokens !== 1_000_000) fail("input tokens should be normalized");
if (tokens.outputTokens !== 500_000) fail("output tokens should be normalized");
if (tokens.totalTokens !== 1_500_000) fail("total tokens should fall back to input + output");

const estimatedCost = estimateApiCostUsd({ input_tokens: 1_000_000, output_tokens: 500_000 });
if (estimatedCost !== 6) fail(`estimated cost should be 6, received ${estimatedCost}`);

const enriched = enrichUsageRecord({
  id: "usage-test",
  status: "ok",
  usage: { input_tokens: 250_000, output_tokens: 125_000 },
});
if (enriched.estimatedCostUsd !== 1.5) fail(`enriched cost should be 1.5, received ${enriched.estimatedCostUsd}`);
if (enriched.costEstimateSource !== "env_rate_per_1m_tokens") fail("enriched record should include cost estimate source");

if (failures.length) {
  console.error("Cost verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Cost verification passed.");
