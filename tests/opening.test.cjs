const test = require("node:test");
const assert = require("node:assert/strict");
test("Drawing, board support and lift handoff", () => {
  const {
    inkIdeaState,
    ideaStrokes,
    ideaStrokePoint,
  } = require("../src/ink/inkIdea.ts");
  const { inkSceneState } = require("../src/ink/InkHelpingStudy.tsx");
  const original = inkSceneState(0),
    last = inkIdeaState(8);
  assert.deepEqual(last.main, original.main);
  assert.deepEqual(last.helper, original.helper);
  assert.deepEqual(last.mainRoot, { x: 780, y: 708 });
  assert.deepEqual(last.helperRoot, original.helperRoot);
  assert.deepEqual(last.offset, { x: 0, y: 0 });
  assert.equal(last.paperOpacity, 0);
  assert.equal(last.pencilOpacity, 0);
  assert.equal(last.blocksOpacity, 1);
  let maxFrameTravel = 0,
    previous;
  const crossing = (a, b, c, d) => {
    const turn = (p, q, r) =>
      (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    return (
      turn(a, b, c) * turn(a, b, d) < 0 && turn(c, d, a) * turn(c, d, b) < 0
    );
  };
  for (let frame = 0; frame < 192; frame++) {
    const time = frame / 24,
      s = inkIdeaState(time);
    if (time <= 4) {
      for (const [who, side] of [
        ["main", "far"],
        ["helper", "near"],
      ]) {
        const pose = s[who],
          elbow = pose[`${side}Elbow`],
          wrist = pose[`${side}Wrist`];
        assert.ok(
          elbow.y > pose.neck.y + 80,
          "A board-support elbow stays below its shoulder",
        );
        assert.ok(
          Math.abs(elbow.x - pose.hip.x) < 50,
          "A board-support elbow stays beside the torso",
        );
        assert.ok(
          who === "main" ? elbow.x < wrist.x - 30 : elbow.x > wrist.x + 30,
          "Supporting forearms reach inward from outside the board",
        );
        const drawingSide = side === "far" ? "near" : "far";
        const drawingElbow = pose[`${drawingSide}Elbow`],
          drawingWrist = pose[`${drawingSide}Wrist`];
        assert.ok(
          !crossing(elbow, wrist, pose.neck, drawingElbow) &&
            !crossing(elbow, wrist, drawingElbow, drawingWrist),
          "Drawing and board-support arms do not form an accidental crossing",
        );
      }
    }
    for (const who of ["main", "helper"]) {
      const pose = s[who],
        root = s[`${who}Root`];
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
      ]) {
        const p = pose[key];
        assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
        if (previous) {
          const q = previous[who][key],
            r = previous[`${who}Root`];
          maxFrameTravel = Math.max(
            maxFrameTravel,
            Math.hypot(p.x + root.x - q.x - r.x, p.y + root.y - q.y - r.y),
          );
        }
      }
      const feet = ["nearAnkle", "farAnkle"].map((k) => pose[k].y + root.y);
      assert.ok(
        feet.some((y) => Math.abs(y - 915) < 0.001),
        "At least one foot remains planted",
      );
    }
    assert.ok(s.paperOpacity >= 0 && s.paperOpacity <= 1);
    assert.ok(s.blocksOpacity >= 0 && s.blocksOpacity <= 1);
    previous = s;
  }
  assert.ok(maxFrameTravel < 65, `No abrupt limb teleport: ${maxFrameTravel}`);
  for (const stroke of ideaStrokes) {
    assert.deepEqual(ideaStrokePoint(stroke.points, 0), stroke.points[0]);
    assert.deepEqual(ideaStrokePoint(stroke.points, 1), stroke.points.at(-1));
    for (const t of [
      stroke.start,
      (stroke.start + stroke.end) / 2,
      stroke.end,
    ]) {
      const s = inkIdeaState(t),
        index = ideaStrokes.indexOf(stroke),
        p = ideaStrokePoint(stroke.points, s.strokes[index]),
        tip = s[`${stroke.side}Tip`];
      assert.ok(
        Math.hypot(p.x - tip.x, p.y - tip.y) < 0.001,
        "Pencil follows its visible ink",
      );
    }
  }
  assert.ok(
    ideaStrokes.some((s) => s.side === "main") &&
      ideaStrokes.some((s) => s.side === "helper"),
  );
});
