const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

test("Export frame ranges stay within the full film", async () => {
  const { frameRange } = await import("../scripts/render-options.mjs");
  assert.deepEqual(frameRange(undefined, 1200), [0, 1199]);
  assert.deepEqual(frameRange("1176:1199", 1200), [1176, 1199]);
  for (const invalid of ["-1:11", "12:11", "0:1200", "0.5:12", "all"])
    assert.throws(() => frameRange(invalid, 1200));
});

test("Editable props reject typos, invalid audio and external files", async () => {
  const { readProps } = await import("../scripts/render-options.mjs");
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ink-props-"));
  const file = path.join(temp, "props.json");
  const read = (props) => {
    fs.writeFileSync(file, JSON.stringify(props));
    return readProps(file);
  };
  try {
    assert.deepEqual(read({ signature: "", musicVolume: 0 }), {
      signature: "",
      musicVolume: 0,
    });
    for (const invalid of [
      null,
      [],
      { signatur: "Name" },
      { signature: 42 },
      { musicVolume: 1.1 },
      { musicStartSeconds: -1 },
      { musicFile: "audio/missing.wav" },
      { musicFile: "audio" },
      { musicFile: file },
      { musicFile: "../package.json" },
    ])
      assert.throws(() => read(invalid));
    fs.writeFileSync(file, "{broken");
    assert.throws(() => readProps(file));
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
