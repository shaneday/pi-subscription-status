# Pi subscription status

A local Pi extension that adds one compact status item for the active model's subscription allowance.

Examples:

```text
5h-72%(45m) wk-31%(2d)
mo-60%(12d)
```

The percentage is **remaining** allowance. The parenthesized time is an approximate reset countdown: days at 24 hours or more, hours at one hour or more, otherwise minutes.

## Scope

- Only the currently selected backend is shown.
- `openai-codex`: ChatGPT 5-hour and weekly windows from ChatGPT's undocumented usage endpoint.
- `github-copilot`: monthly premium-interaction quota from GitHub's undocumented Copilot endpoint.
- Other providers clear this extension's status item.
- Data is cached locally and fetched at most once per provider every 10 minutes.
- No command, OAuth refresh, model probe, custom footer, or external dependency.

Pi automatically loads this directory because it is under `~/.pi/agent/extensions/`.

## Check

```sh
node --test
```

Restart Pi or run `/reload` after changing the extension.
