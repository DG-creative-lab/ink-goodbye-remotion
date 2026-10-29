import fs from "node:fs";
import path from "node:path";
import { openBrowser, getCompositions, renderStill } from "@remotion/renderer";
import { browserOptions, filmId } from "./render-options.mjs";

const job = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const start = Number(process.argv[3]);
const end = Number(process.argv[4]);
for (let chunk = start; chunk <= end; chunk += 80) {
  const browser = await openBrowser("chrome", browserOptions());
  try {
    const composition = (
      await getCompositions(job.serveUrl, {
        inputProps: job.props,
        puppeteerInstance: browser,
      })
    ).find((c) => c.id === filmId);
    for (let frame = chunk; frame <= Math.min(chunk + 79, end); frame++) {
      await renderStill({
        serveUrl: job.serveUrl,
        composition,
        inputProps: job.props,
        frame,
        output: path.join(
          job.pdfDir,
          `frame-${String(frame).padStart(4, "0")}.pdf`,
        ),
        imageFormat: "pdf",
        puppeteerInstance: browser,
        timeoutInMilliseconds: 60000,
        logLevel: "error",
      });
    }
    console.log(`Vector frames ${chunk}–${Math.min(chunk + 79, end)} complete`);
  } finally {
    await browser.close({ silent: true });
  }
}
