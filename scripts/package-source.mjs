import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const output = path.resolve("out/ink-goodbye-remotion-source.zip");
fs.mkdirSync(path.dirname(output), { recursive: true });
const result = spawnSync(
  "git",
  [
    "archive",
    "--format=zip",
    "--prefix=ink-goodbye-remotion/",
    `--output=${output}`,
    "HEAD",
  ],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
if (result.status !== 0)
  throw new Error(
    "Run this command from a Git checkout with a commit. GitHub also provides a source ZIP.",
  );
console.log(output);
