import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import {
  buildFallbackPlan,
  generateChatbotPlan,
  pickExperimentVariant,
} from "../src/services/chatbotService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const casesPath = path.resolve(__dirname, "../testdata/chatbot_quality_cases.json");
const cases = JSON.parse(fs.readFileSync(casesPath, "utf8"));
const liveMode = process.argv.includes("--live") || process.env.CHATBOT_EVAL_LIVE === "1";

const scoreCase = ({testCase, plan}) => {
  const expected = testCase.expected || {};
  const allowedIds = new Set((testCase.context.locations || []).map(location => Number(location.id)));
  const selectedIds = Array.isArray(plan.locationIds) ? plan.locationIds.map(Number) : [];
  const selectedLocations = (testCase.context.locations || []).filter(location => selectedIds.includes(Number(location.id)));
  const checks = [];

  checks.push({
    name: "valid_ids",
    pass: selectedIds.every(id => allowedIds.has(id)),
  });
  checks.push({
    name: "reply_present",
    pass: typeof plan.reply === "string" && plan.reply.trim().length >= 10,
  });

  if (expected.intent) {
    checks.push({
      name: "intent",
      pass: plan.intent === expected.intent,
      expected: expected.intent,
      actual: plan.intent,
    });
  }

  if (Number.isFinite(Number(expected.minLocationIds))) {
    checks.push({
      name: "min_location_ids",
      pass: selectedIds.length >= Number(expected.minLocationIds),
      expected: expected.minLocationIds,
      actual: selectedIds.length,
    });
  }

  if (Array.isArray(expected.mustIncludeAny) && expected.mustIncludeAny.length) {
    checks.push({
      name: "must_include_any",
      pass: expected.mustIncludeAny.some(id => selectedIds.includes(Number(id))),
      expected: expected.mustIncludeAny,
      actual: selectedIds,
    });
  }

  if (expected.preferFollowing) {
    checks.push({
      name: "prefer_following",
      pass: selectedLocations.some(location => Number(location.from_following || 0) > 0 || Number(location.following_likes_count || 0) > 0),
      actual: selectedIds,
    });
  }

  if (expected.mustHaveRouteAction) {
    checks.push({
      name: "route_action",
      pass: Array.isArray(plan.actions) && plan.actions.some(action => action.type === "show_route"),
    });
  }

  const passed = checks.filter(check => check.pass).length;
  return {
    score: checks.length ? passed / checks.length : 1,
    checks,
  };
};

const run = async () => {
  const results = [];

  for (const testCase of cases) {
    const variant = pickExperimentVariant({
      userId: `eval-${testCase.id}`,
      sessionId: testCase.id,
      forcedVariant: process.env.CHATBOT_EVAL_VARIANT,
    });
    const generation = liveMode
      ? await generateChatbotPlan({
        message: testCase.message,
        context: testCase.context,
        experimentVariant: variant,
      })
      : {
        plan: buildFallbackPlan({
          message: testCase.message,
          context: testCase.context,
        }),
        model: "offline-fallback",
        experimentVariant: variant.name,
        usedFallback: true,
      };
    const evaluation = scoreCase({testCase, plan: generation.plan});

    results.push({
      id: testCase.id,
      score: Number(evaluation.score.toFixed(3)),
      model: generation.model,
      experimentVariant: generation.experimentVariant,
      selectedLocationIds: generation.plan.locationIds,
      checks: evaluation.checks,
    });
  }

  const averageScore = results.reduce((sum, result) => sum + result.score, 0) / Math.max(results.length, 1);
  const summary = {
    mode: liveMode ? "live" : "offline",
    averageScore: Number(averageScore.toFixed(3)),
    passed: results.every(result => result.score === 1),
    results,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (!summary.passed) process.exitCode = 1;
};

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
