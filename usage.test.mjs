import assert from "node:assert/strict";
import test from "node:test";
import { copilotWindows, openAIWindows, remainingStatus } from "./usage.js";

const now = Date.UTC(2026, 0, 1);

test("formats remaining allowance and approximate reset time", () => {
  assert.equal(remainingStatus([
    { label: "5h", used: 28, resetsAt: now + 45 * 60_000 },
    { label: "wk", used: 69, resetsAt: now + 2 * 24 * 60 * 60_000 },
  ], now), "5h-72%(45m) wk-31%(2d)");
});

test("classifies OpenAI windows by duration", () => {
  assert.deepEqual(openAIWindows({ rate_limit: {
    primary_window: { used_percent: 28, limit_window_seconds: 300, reset_at: now / 1000 + 60 },
    secondary_window: { used_percent: 69, limit_window_seconds: 604800, reset_at: now / 1000 + 60 },
  } }).map(({ label, used }) => ({ label, used })), [
    { label: "5h", used: 28 },
    { label: "wk", used: 69 },
  ]);
});

test("reads the Copilot premium-interaction allowance", () => {
  assert.deepEqual(copilotWindows({ quota_reset_date: "2026-02-01", quota_snapshots: {
    premium_interactions: { percent_remaining: 60 },
  } }).map(({ label, used }) => ({ label, used })), [{ label: "mo", used: 40 }]);
});
