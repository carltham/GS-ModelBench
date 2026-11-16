// Locations and settings shared by the summary builder.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const devTestsDir = dirname(dirname(fileURLToPath(import.meta.url)));
export const resultsDir = join(devTestsDir, "classifier-evaluation-results");
export const settings = JSON.parse(
  readFileSync(join(devTestsDir, "classifier-evaluation-settings.json"), "utf8"),
);
export const kinds = settings.kinds;
