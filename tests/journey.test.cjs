const test = require("node:test");
const assert = require("node:assert/strict");
test("Laugh, walk and doorway continuity", () => {
  const {
    inkJourneyState,
    approachPlan,
    exitPlan,
  } = require("../src/ink/inkJourney.ts");
  const { inkSetDownState } = require("../src/ink/inkSetDown.ts");
  const { inkLaughState } = require("../src/ink/inkActing.ts");
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const world = (p, r) => ({ x: p.x + r.x, y: p.y + r.y });
  const segmentDistance = (p, a, b) => {
    const dx = b.x - a.x,
      dy = b.y - a.y,
      u = Math.max(
        0,
        Math.min(
          1,
          ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy),
        ),
      );
    return Math.hypot(p.x - a.x - u * dx, p.y - a.y - u * dy);
  };
  const initial = inkLaughState(5, inkSetDownState(5)),
    first = inkJourneyState(0);
  assert.deepEqual(first.mainRoot, { x: 750, y: 708 });
  assert.deepEqual(first.helperRoot, { x: 1270, y: 708 });
  assert.equal(first.camera, 0);
  for (const person of ["main", "helper"])
    for (const key of [
      "head",
      "neck",
      "hip",
      "nearElbow",
      "farElbow",
      "nearWrist",
      "farWrist",
      "nearKnee",
      "farKnee",
      "nearAnkle",
      "farAnkle",
      "gaze",
    ])
      assert.deepEqual(
        first[person][key],
        initial[person][key],
        `No jump from laugh: ${person}.${key}`,
      );
  let previous,
    minFace = Infinity,
    minHand = Infinity,
    maxLegError = 0,
    maxFrameTravel = 0,
    maxCameraFrameTravel = 0;
  for (let i = 0; i <= 1920; i++) {
    const t = i / 120,
      s = inkJourneyState(t);
    assert.ok(s.camera >= 0 && s.camera <= 595);
    if (previous) {
      assert.ok(
        s.mainRoot.x >= previous.mainRoot.x - 1e-7,
        "Forward travel is monotonic",
      );
      assert.ok(
        s.camera >= previous.camera - 1e-7,
        "Camera pan is continuous and forward",
      );
      for (const side of ["near", "far"])
        if (
          Math.abs(s.feet[side].y - 915) < 1e-8 &&
          Math.abs(previous.feet[side].y - 915) < 1e-8
        )
          assert.ok(
            Math.abs(s.feet[side].x - previous.feet[side].x) < 1e-7,
            "Stance feet do not skate",
          );
    }
    for (const side of ["near", "far"]) {
      assert.ok(
        d(world(s.main[side + "Ankle"], s.mainRoot), s.feet[side]) < 1e-6,
      );
      assert.deepEqual(
        world(s.helper[side + "Ankle"], s.helperRoot),
        world(first.helper[side + "Ankle"], first.helperRoot),
        "Helper remains beside the stack",
      );
      if (s.walking && s.walkWeight > 0.999999)
        maxLegError = Math.max(
          maxLegError,
          Math.abs(d(s.main.hip, s.main[side + "Knee"]) - 118),
          Math.abs(d(s.main[side + "Knee"], s.main[side + "Ankle"]) - 118),
        );
      for (const p of [s.main, s.helper]) {
        minFace = Math.min(
          minFace,
          segmentDistance(p.head, p.neck, p[side + "Elbow"]),
          segmentDistance(p.head, p[side + "Elbow"], p[side + "Wrist"]),
        );
        minHand = Math.min(minHand, d(p.head, p[side + "Wrist"]));
      }
    }
    if (i >= 5 && i % 5 === 0) {
      const last = inkJourneyState(t - 1 / 24);
      maxFrameTravel = Math.max(
        maxFrameTravel,
        Math.abs(s.mainRoot.x - last.mainRoot.x),
      );
      maxCameraFrameTravel = Math.max(
        maxCameraFrameTravel,
        Math.abs(s.camera - last.camera),
      );
    }
    previous = s;
  }
  assert.ok(maxLegError < 1e-5, `Fixed walking segments: ${maxLegError}`);
  assert.ok(minFace > 84, `Face clearance: ${minFace}`);
  assert.ok(minHand > 118, `Hand clearance: ${minHand}`);
  assert.ok(maxFrameTravel < 11, "No frame-to-frame teleport");
  assert.ok(maxCameraFrameTravel < 9, "Camera pan stays smooth");
  assert.equal(inkJourneyState(7.4).mainRoot.x, 1965);
  assert.equal(inkJourneyState(7.4).camera, 595);
  assert.equal(inkJourneyState(9.9).mainRoot.x, 1965);
  assert.equal(inkJourneyState(14).mainRoot.x, 2565);
});
