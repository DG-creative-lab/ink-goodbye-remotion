const test = require("node:test");
const assert = require("node:assert/strict");
test("Heart framing and message timing", () => {
  const {
    inkEndingState,
    inkEndingMessage,
  } = require("../src/ink/inkEnding.ts");
  const { inkJourneyState } = require("../src/ink/inkJourney.ts");
  const { inkVisitorsState } = require("../src/ink/inkVisitors.ts");
  const cubic = (a, b, c, d, t) => ({
    x:
      (1 - t) ** 3 * a.x +
      3 * (1 - t) ** 2 * t * b.x +
      3 * (1 - t) * t * t * c.x +
      t ** 3 * d.x,
    y:
      (1 - t) ** 3 * a.y +
      3 * (1 - t) ** 2 * t * b.y +
      3 * (1 - t) * t * t * c.y +
      t ** 3 * d.y,
  });
  const points = [{ x: 0, y: 42 }];
  for (let i = 0; i <= 100; i++) {
    const u = i / 100;
    points.push(
      cubic(
        { x: 0, y: -8 },
        { x: -22, y: -34 },
        { x: -48, y: -7 },
        { x: -31, y: 14 },
        u,
      ),
      cubic(
        { x: 31, y: 14 },
        { x: 48, y: -7 },
        { x: 22, y: -34 },
        { x: 0, y: -8 },
        u,
      ),
    );
  }
  let minimumMargin = Infinity,
    maxFrameTravel = 0,
    previous;
  for (let i = 0; i <= 1440; i++) {
    const time = i / 120,
      s = inkEndingState(time);
    for (const key of [
      "appear",
      "flight",
      "sceneOpacity",
      "lineOne",
      "lineTwo",
      "lineThree",
      "closing",
      "underline",
    ])
      assert.ok(s[key] >= 0 && s[key] <= 1);
    if (time <= 3.4)
      assert.equal(s.appear, 0, "Keep the heart absent until she has left");
    if (s.flight > 0)
      assert.equal(
        s.sceneOpacity,
        0,
        "The figures have dissolved before the heart enlarges; it does not engulf people",
      );
    if (s.lineOne > 0 || s.lineTwo > 0 || s.lineThree > 0 || s.closing > 0)
      assert.equal(s.flight, 1, "Let the heart land before reading begins");
    if (time >= 9)
      for (const key of [
        "lineOne",
        "lineTwo",
        "lineThree",
        "closing",
        "underline",
      ])
        assert.equal(s[key], 1, "Hold the complete message");
    if (s.appear > 0) {
      const angle = (s.rotation * Math.PI) / 180;
      for (const p of points) {
        const x = p.x * s.scale * s.scaleX,
          y = p.y * s.scale * s.scaleY;
        const px = s.x + x * Math.cos(angle) - y * Math.sin(angle),
          py = s.y + x * Math.sin(angle) + y * Math.cos(angle);
        minimumMargin = Math.min(minimumMargin, px, 1920 - px, py, 1080 - py);
      }
    }
    if (i >= 5 && i % 5 === 0) {
      const last = inkEndingState(time - 1 / 24);
      maxFrameTravel = Math.max(
        maxFrameTravel,
        Math.hypot(s.x - last.x, s.y - last.y),
      );
    }
    if (previous) {
      assert.ok(s.flight >= previous.flight);
      assert.ok(s.sceneOpacity <= previous.sceneOpacity);
    }
    previous = s;
  }
  assert.ok(minimumMargin > 40, "Keep the entire heart within the frame");
  assert.ok(maxFrameTravel < 60, "Heart flight has no sudden positional jump");
  assert.equal(
    inkEndingState(4.02).appear,
    1,
    "The heart is fully visible for its first beat",
  );
  assert.ok(
    inkEndingState(4.02).scaleX > 1.06 && inkEndingState(4.26).scaleX > 1.03,
    "Both little beats happen after the heart has appeared",
  );
  assert.equal(
    inkEndingState(3).sceneOpacity,
    1,
    "The original exit remains visible",
  );
  assert.ok(
    inkJourneyState(13.4).mainRoot.x + inkJourneyState(13.4).main.head.x - 91 >
      2410,
    "The protagonist is behind the jamb before the heart appears",
  );
  assert.equal(
    inkVisitorsState(8).length + 2,
    4,
    "Retain the four-person goodbye",
  );

  assert.equal(inkEndingState(9).signature, 0);
  assert.equal(inkEndingState(9.4).signature, 1);
  assert.equal(inkEndingMessage.signature, "Your name");
});
