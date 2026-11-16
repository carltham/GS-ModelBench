# Command line

`apps/cli` provides the `modelbench` command. It works on the data root directly through
`packages/store` and `packages/runner`, so it doesn't need the server.

## Commands

| Command | Purpose |
|---|---|
| `modelbench serve [--port 4300] [--host 127.0.0.1]` | Start the server and the GUI. |
| `modelbench studies` | List studies. |
| `modelbench study <study>` | Show a study: task, versions, campaigns. |
| `modelbench dataset import <study> <file> [--tag t]` | Import cases into the draft. |
| `modelbench dataset check <study>` | Coverage check and labeller disagreements for the draft. |
| `modelbench dataset freeze <study>` | Freeze the draft as the next dataset version. |
| `modelbench models [--provider p]` | List available models. |
| `modelbench plan <study> --models a,b [--context-size 2048,4096] [--repeats 3] [--dataset N]` | Show the plan without running. |
| `modelbench run <study> --campaign <slug> [same options as plan] [--yes]` | Plan, confirm, then run. `--yes` skips the confirmation. |
| `modelbench resume <run>` | Resume a paused or failed run. |
| `modelbench runs [<study>] [--status s]` | List runs. |
| `modelbench show <run>` | Run metrics, machine profile, disturbance. |
| `modelbench compare <run> <run> ...` | Metrics side by side, with comparability warnings. |
| `modelbench rescore <run> --dataset N` | Re-score against a dataset version. |
| `modelbench flag <run> --set\|--clear --note "..."` | Set or clear the disturbance flag. |
| `modelbench report <campaign>` | Generate the Markdown report and SVG charts. |
| `modelbench export <run> [-o file.zip]` | Export a run. |
| `modelbench import <file.zip>` | Import a run. |
| `modelbench delete <run>` | Delete a run. Asks for the run id to be typed. |
| `modelbench migrate <legacy folder>` | Convert the original `classifications-*.json` results. |

## Behaviour

- Every varied setting has a matching option: `--context-size`, `--temperature`,
  `--max-output-tokens`, `--reasoning`, `--structured-output`, `--repeats`, `--timeout`. Comma
  lists vary that setting.
- `run` prints a progress line per call and a results table at the end, the same as the GUI's
  run page.
- `Ctrl+C` during `run` pauses the run after the call in progress. `modelbench resume` continues it.
- Commands that write refuse to start while the server holds the lock, and tell the user to use
  the GUI or stop the server.
- `--json` on every read command prints machine-readable output.
- Exit codes: `0` success, `1` error, `2` invalid arguments, `3` lock held by another process.
