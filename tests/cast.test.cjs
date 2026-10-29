const test = require("node:test");
const assert = require("node:assert/strict");
test("Colleague entrances and planted feet", () => {
  const { inkVisitorsState } = require("../src/ink/inkVisitors.ts");
  const { inkJourneyState } = require("../src/ink/inkJourney.ts");
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const segmentDistance = (p, a, b) => {
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const u = Math.max(
      0,
      Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)),
    );
    return Math.hypot(p.x - a.x - u * dx, p.y - a.y - u * dy);
  };
  let previous,
    minFace = Infinity,
    minHands = Infinity,
    maxLegError = 0,
    maxFrameTravel = 0,
    minVisitorHeadSeparation = Infinity;
  const initial = inkVisitorsState(-5);
  assert.equal(initial.length, 2, "Restore both extra colleagues");
  for (const v of initial)
    assert.ok(
      v.root.x - 90 * v.scale > 1920 || v.root.x + 90 * v.scale < 0,
      "Visitors start completely outside the frame",
    );
  for (let i = 0; i <= 2520; i++) {
    const time = -5 + i / 120;
    const all = inkVisitorsState(time);
    const journey = inkJourneyState(time);
    for (let n = 0; n < all.length; n++) {
      const v = all[n],
        p = v.pose;
      for (const side of ["near", "far"]) {
        const ankle = p[side + "Ankle"];
        const rendered = {
          x: v.root.x + v.mirror * v.scale * ankle.x,
          y: v.root.y + v.scale * ankle.y,
        };
        assert.ok(
          d(rendered, v.feet[side]) < 1e-6,
          "Mirrored scaled feet match their world anchors",
        );
        if (previous) {
          const last = previous[n];
          if (
            Math.abs(v.feet[side].y - initial[n].feet[side].y) < 1e-8 &&
            Math.abs(last.feet[side].y - initial[n].feet[side].y) < 1e-8
          )
            assert.ok(
              Math.abs(v.feet[side].x - last.feet[side].x) < 1e-6,
              "Stance foot remains planted",
            );
        }
        if (v.walking && v.walkWeight > 0.999999)
          maxLegError = Math.max(
            maxLegError,
            Math.abs(d(p.hip, p[side + "Knee"]) - 118),
            Math.abs(d(p[side + "Knee"], ankle) - 118),
          );
        minFace = Math.min(
          minFace,
          segmentDistance(p.head, p.neck, p[side + "Elbow"]),
          segmentDistance(p.head, p[side + "Elbow"], p[side + "Wrist"]),
        );
        minHands = Math.min(minHands, d(p.head, p[side + "Wrist"]));
      }
      if (i >= 5 && i % 5 === 0) {
        const last = inkVisitorsState(time - 1 / 24)[n];
        maxFrameTravel = Math.max(
          maxFrameTravel,
          Math.abs(v.root.x - last.root.x),
        );
      }
      if (time >= [0, 7][n]) {
        assert.ok(
          Math.abs(v.root.x - [1515, 800][n]) < 1e-6,
          "Colleagues settle before the doorway wave",
        );
        assert.ok(
          v.root.x - journey.camera + 90 * v.scale < 1920 &&
            v.root.x - journey.camera - 90 * v.scale > 0,
          "All restored colleagues remain in the goodbye framing",
        );
      }
    }
    if (time >= 7.5) {
      const actors = [
        { pose: journey.main, root: journey.mainRoot, scale: 1, mirror: 1 },
        { pose: journey.helper, root: journey.helperRoot, scale: 1, mirror: 1 },
        ...all,
      ];
      const point = (actor, p) => ({
        x: actor.root.x + actor.mirror * actor.scale * p.x,
        y: actor.root.y + actor.scale * p.y,
      });
      for (let i = 0; i < actors.length; i++)
        for (let j = 0; j < actors.length; j++)
          if (i !== j) {
            const a = actors[i],
              b = actors[j],
              head = point(b, b.pose.head);
            for (const side of ["near", "far"]) {
              const wrist = point(a, a.pose[side + "Wrist"]),
                elbow = point(a, a.pose[side + "Elbow"]),
                neck = point(a, a.pose.neck);
              assert.ok(
                d(wrist, head) > 91 * b.scale + 30 * a.scale,
                `A waving hand must not touch another colleague’s face: actor ${i}, neighbour ${j}, ${side}, time ${time}, distance ${d(wrist, head)}`,
              );
              assert.ok(
                segmentDistance(head, neck, elbow) >
                  91 * b.scale + 3 * a.scale &&
                  segmentDistance(head, elbow, wrist) >
                    91 * b.scale + 3 * a.scale,
                `Arm arcs stay clear of neighbouring heads: actor ${i}, neighbour ${j}, ${side}, time ${time}`,
              );
            }
          }
    }
    const heads = all.map((v) => ({
      x: v.root.x + v.mirror * v.scale * v.pose.head.x,
      y: v.root.y + v.scale * v.pose.head.y,
    }));
    minVisitorHeadSeparation = Math.min(
      minVisitorHeadSeparation,
      d(heads[0], heads[1]),
    );
    previous = all;
  }
  assert.ok(maxLegError < 1e-5);
  assert.ok(minFace > 84);
  assert.ok(minHands > 118);
  assert.ok(maxFrameTravel < 11);
  assert.ok(
    minVisitorHeadSeparation > 162,
    "Arriving colleagues have distinct silhouettes",
  );
  const last = inkVisitorsState(-1 / 24),
    next = inkVisitorsState(0);
  for (let i = 0; i < 2; i++)
    assert.deepEqual(
      last[i],
      next[i],
      "The restored cast does not jump at the laugh-to-walk boundary",
    );
});
