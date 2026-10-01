# Agent notes

## Current state

- Repository: `~/.pi/agent/extensions/pi-subscription-status`.
- `index.js` is automatically discovered by Pi from this directory.
- It uses one `ctx.ui.setStatus()` entry, never a custom footer.
- `cache.json` is local, ignored by Git, and has a 10-minute TTL.
- `node --test` passes (three parser/formatting checks).
- Commits: `4988b4e` initialization; `4e51545` implementation.

## Design decisions

- Do not add `/usage`: the complete data fits the status text and extra detail is not needed yet.
- Do not refresh or write OAuth credentials. Pi owns authentication refresh.
- Do not use a model probe as a fallback: allowance reporting must not consume allowance.
- Only display the active provider, so OpenAI and Copilot never appear together.

## Sources reviewed

- `patlux/pi-chatgpt-limit`: small Pi-native OpenAI usage request.
- `mtrojnar/pi-usage`: safer request handling and provider-aware auth patterns.
- `satas20/pi-usage-bar`: Copilot endpoint: `https://api.github.com/copilot_internal/user`.
- `inouemoby/pi-codex-usage`: extra OAuth mutation/features deliberately excluded.
- `aporcelli/pi-usage`: command-first approach deliberately excluded.
