import fs from "node:fs";
import path from "node:path";

export const filmId = "Ink-Goodbye-Film";
export function readProps(file) {
  const props = file
    ? JSON.parse(fs.readFileSync(path.resolve(file), "utf8"))
    : {};
  if (!props || Array.isArray(props) || typeof props !== "object")
    throw new Error("Props must be a JSON object.");
  const strings = [
    "lineOne",
    "lineTwo",
    "lineThree",
    "closing",
    "signature",
    "musicFile",
  ];
  const numbers = ["musicStartSeconds", "musicVolume"];
  for (const [key, value] of Object.entries(props)) {
    if (![...strings, ...numbers].includes(key))
      throw new Error(`Unknown film prop: ${key}`);
    if (strings.includes(key) && typeof value !== "string")
      throw new Error(`${key} must be a string.`);
    if (
      numbers.includes(key) &&
      (typeof value !== "number" || !Number.isFinite(value))
    )
      throw new Error(`${key} must be finite.`);
  }
  if ((props.musicStartSeconds ?? 0) < 0)
    throw new Error("musicStartSeconds must be zero or positive.");
  if ((props.musicVolume ?? 0.7) < 0 || (props.musicVolume ?? 0.7) > 1)
    throw new Error("musicVolume must be between zero and one.");
  if (props.musicFile) {
    const publicRoot = fs.realpathSync("public");
    const candidate = path.resolve("public", props.musicFile);
    if (
      !candidate.startsWith(`${publicRoot}${path.sep}`) ||
      !fs.existsSync(candidate) ||
      !fs.statSync(candidate).isFile() ||
      !fs.realpathSync(candidate).startsWith(`${publicRoot}${path.sep}`)
    ) {
      throw new Error(
        `Place your music file inside public/ before rendering: ${props.musicFile}`,
      );
    }
  }
  return props;
}
export function browserOptions() {
  if (process.env.REMOTION_BROWSER_EXECUTABLE)
    return { browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE };
  const candidates =
    process.platform === "darwin"
      ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
      : process.platform === "win32"
        ? [
            path.join(
              process.env.PROGRAMFILES ?? "",
              "Google/Chrome/Application/chrome.exe",
            ),
            path.join(
              process.env["PROGRAMFILES(X86)"] ?? "",
              "Google/Chrome/Application/chrome.exe",
            ),
          ]
        : [
            "/usr/bin/google-chrome",
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
          ];
  const browserExecutable = candidates.find((file) => fs.existsSync(file));
  return browserExecutable ? { browserExecutable } : {};
}
export function frameRange(value, total) {
  if (!value) return [0, total - 1];
  if (!/^\d+:\d+$/.test(value))
    throw new Error("Use --frames START:END, inclusive.");
  const [start, end] = value.split(":").map(Number);
  if (start < 0 || end < start || end >= total)
    throw new Error(`Frames must be inside 0:${total - 1}.`);
  return [start, end];
}
