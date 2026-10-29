import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { spawn, spawnSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { getCompositions, openBrowser, renderMedia } from "@remotion/renderer";
import {
  browserOptions,
  filmId,
  frameRange,
  readProps,
} from "./render-options.mjs";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
process.chdir(root);
const { values } = parseArgs({
  options: {
    output: { type: "string" },
    props: { type: "string" },
    still: { type: "string" },
    frames: { type: "string" },
    workers: { type: "string", default: "2" },
    overwrite: { type: "boolean", default: false },
  },
});
const python =
  process.env.PYTHON || (process.platform === "win32" ? "python" : "python3");
const ffmpeg = process.env.FFMPEG || "ffmpeg";
const ffprobe = process.env.FFPROBE || "ffprobe";
const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${command} exited with ${result.status}`);
};
const child = (command, args) =>
  new Promise((resolve, reject) => {
    const process = spawn(command, args, { stdio: "inherit" });
    process.on("error", reject);
    process.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Print worker exited with ${code}`)),
    );
  });
const props = readProps(values.props);
const workers = Number(values.workers);
if (!Number.isInteger(workers) || workers < 1 || workers > 4)
  throw new Error("--workers must be between 1 and 4.");
const output = path.resolve(
  values.output || (values.still ? "out/ending.png" : "out/ink-goodbye.mp4"),
);
if (fs.existsSync(output) && !values.overwrite)
  throw new Error(
    `Output exists. Choose another --output or pass --overwrite: ${output}`,
  );
if (values.still && values.frames)
  throw new Error("Use either --still or --frames.");
run(python, ["-c", "import pypdfium2; from PIL import Image"]);
if (!values.still) {
  run(ffmpeg, ["-version"]);
  run(ffprobe, ["-version"]);
}
const serveUrl = await bundle({
  entryPoint: path.join(root, "src/index.ts"),
  outDir: path.join(root, "build"),
});
let browser = await openBrowser("chrome", browserOptions());
let composition;
try {
  composition = (
    await getCompositions(serveUrl, {
      inputProps: props,
      puppeteerInstance: browser,
    })
  ).find((c) => c.id === filmId);
} finally {
  await browser.close({ silent: true });
}
if (!composition) throw new Error(`Composition ${filmId} is missing.`);
const range = values.still
  ? frameRange(`${values.still}:${values.still}`, composition.durationInFrames)
  : frameRange(values.frames, composition.durationInFrames);
const count = range[1] - range[0] + 1;
const work = path.join(root, "out", `render-${Date.now()}`);
const pdfDir = path.join(work, "vector");
const pngDir = path.join(work, "frames");
fs.mkdirSync(pdfDir, { recursive: true });
fs.mkdirSync(path.dirname(output), { recursive: true });
const job = path.join(work, "job.json");
fs.writeFileSync(job, JSON.stringify({ serveUrl, props, pdfDir }));
// Isolated worker processes avoid shared-browser print state and bounded batches
// release browser resources during longer films. The editable SVGs stay intact.
const jobs = [];
const size = Math.ceil(count / workers);
for (let start = range[0]; start <= range[1]; start += size)
  jobs.push(
    child(process.execPath, [
      path.join(root, "scripts/print-worker.mjs"),
      job,
      String(start),
      String(Math.min(range[1], start + size - 1)),
    ]),
  );
await Promise.all(jobs);
run(python, [
  path.join(root, "scripts/rasterize.py"),
  pdfDir,
  pngDir,
  "--start",
  String(range[0]),
  "--end",
  String(range[1]),
]);
if (values.still) {
  fs.copyFileSync(path.join(pngDir, "frame-0000.png"), output);
  console.log(`Saved ${output}`);
} else {
  const args = [
    "-hide_banner",
    "-y",
    "-framerate",
    String(composition.fps),
    "-i",
    path.join(pngDir, "frame-%04d.png"),
  ];
  if ((composition.props.musicFile || "").trim()) {
    const audio = path.join(work, "music.wav");
    browser = await openBrowser("chrome", browserOptions());
    try {
      await renderMedia({
        serveUrl,
        composition,
        inputProps: props,
        codec: "wav",
        outputLocation: audio,
        frameRange: range,
        sampleRate: 48000,
        concurrency: 1,
        puppeteerInstance: browser,
        logLevel: "error",
      });
    } finally {
      await browser.close({ silent: true });
    }
    args.push(
      "-i",
      audio,
      "-map",
      "0:v:0",
      "-map",
      "1:a:0",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
    );
  }
  args.push(
    "-vf",
    "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
    "-c:v",
    "libx264",
    "-crf",
    "17",
    "-preset",
    "medium",
    "-r",
    String(composition.fps),
    "-colorspace",
    "bt709",
    "-color_primaries",
    "bt709",
    "-color_trc",
    "bt709",
    "-movflags",
    "+faststart",
    output,
  );
  run(ffmpeg, args);
  run(python, [
    path.join(root, "scripts/verify-video.py"),
    output,
    pngDir,
    "--count",
    String(count),
    "--ffmpeg",
    ffmpeg,
    "--ffprobe",
    ffprobe,
  ]);
  console.log(`Saved and verified ${output}`);
}
