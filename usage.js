const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function resetAt(window) {
  if (Number.isFinite(window?.reset_at) && window.reset_at > 0)
    return window.reset_at * 1000;
  if (Number.isFinite(window?.reset_after_seconds) && window.reset_after_seconds > 0)
    return Date.now() + window.reset_after_seconds * 1000;
}

function windowFromWham(window) {
  if (!Number.isFinite(window?.used_percent)) return;
  const resetsAt = resetAt(window);
  if (!resetsAt) return;
  return {
    label: window.limit_window_seconds <= 6 * 60 * 60 ? "5h" : "wk",
    used: Math.max(0, Math.min(100, window.used_percent)),
    resetsAt,
  };
}

export function openAIWindows(data) {
  const rateLimit = data?.rate_limit;
  const windows = [windowFromWham(rateLimit?.primary_window), windowFromWham(rateLimit?.secondary_window)]
    .filter(Boolean);
  return windows.sort((a, b) => (a.label === "5h" ? 0 : 1) - (b.label === "5h" ? 0 : 1));
}

export function copilotWindows(data) {
  const quota = data?.quota_snapshots?.premium_interactions;
  if (!quota || quota.unlimited || !Number.isFinite(quota.percent_remaining)) return [];
  const resetsAt = Date.parse(data.quota_reset_date);
  if (!Number.isFinite(resetsAt)) return [];
  return [{
    label: "mo",
    used: Math.max(0, Math.min(100, 100 - quota.percent_remaining)),
    resetsAt,
  }];
}

export function remainingStatus(windows, now = Date.now()) {
  return windows
    .filter((window) => window.resetsAt > now)
    .map((window) => {
      const remaining = Math.round(100 - window.used);
      const duration = window.resetsAt - now;
      const value = duration >= DAY ? `${Math.round(duration / DAY)}d`
        : duration >= HOUR ? `${Math.round(duration / HOUR)}h`
          : `${Math.max(0, Math.round(duration / 60000))}m`;
      return `${window.label}-${remaining}%(${value})`;
    })
    .join(" ");
}
