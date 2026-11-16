# Configuration

Settings are read from `modelbench.config.json` in the working directory. Environment variables
override the file. Command line options override both.

## File

```json
{
  "dataRoot": "studies",
  "server": { "host": "127.0.0.1", "port": 4300 },
  "providers": [
    { "id": "local-ollama", "type": "ollama", "url": "http://localhost:11434" }
  ],
  "runner": {
    "maxConsecutiveErrors": 5,
    "loadSampleIntervalS": 60,
    "defaultCallEstimateMs": 3000
  },
  "disturbance": {
    "gpuTemperatureC": 80,
    "gpuBusyPct": 20,
    "cpuLoadPctOfCores": 50
  },
  "user": "maintainer"
}
```

- If the file is missing, these defaults apply.
- `user` is recorded as `startedBy` on local runs and as the labeller name when labelling. The
  default is the operating system user name.
- Provider `type` is `ollama` or `openai-compatible`. An `openai-compatible` provider can have
  `apiKeyEnv`, the name of an environment variable holding its key. Keys are never written to
  the config file or to results.

## Environment variables

| Variable | Overrides |
|---|---|
| `MODELBENCH_DATA_ROOT` | `dataRoot` |
| `MODELBENCH_HOST` | `server.host` |
| `MODELBENCH_PORT` | `server.port` |
| `MODELBENCH_OLLAMA_URL` | `url` of the first `ollama` provider |
| `MODELBENCH_USER` | `user` |
