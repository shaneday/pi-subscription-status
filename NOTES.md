# Agent notes

## Current state

- Repository created at `~/.pi/agent/extensions/pi-subscription-status`.
- Intended implementation: one `ctx.ui.setStatus()` entry, never a custom footer.
- Cache is local, ignored by Git, and has a 10-minute TTL.

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
