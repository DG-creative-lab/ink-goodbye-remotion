const test = require("node:test");
const assert = require("node:assert/strict");
test("Walking and four-person separation", () => {
  const {
    inkJourneyState,
    journeyFloor,
    approachPlan,
    exitPlan,
  } = require("../src/ink/inkJourney.ts");
  const { inkVisitorsState } = require("../src/ink/inkVisitors.ts");
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const point = (a, p) => ({
    x: a.root.x + a.mirror * a.scale * p.x,
    y: a.root.y + a.scale * p.y,
  });
  let minHeadGap = Infinity,
    minPassingHandGap = Infinity,
    maxExtendedLegBend = 0,
    maxShoeY = 0,
    maxFrameJointTravel = 0,
    supportSamples = 0,
    previous;
  for (let i = 0; i <= 5040; i++) {
    const time = -5 + i / 240,
      s = inkJourneyState(time);
    const actors = [
      {
        id: "main",
        pose: s.main,
        root: s.mainRoot,
        scale: 1,
        mirror: 1,
        feet: s.feet,
        walking: s.walking,
        weight: s.walkWeight,
      },
      { id: "helper", pose: s.helper, root: s.helperRoot, scale: 1, mirror: 1 },
      ...inkVisitorsState(time).map((v) => ({
        ...v,
        mirror: v.mirror,
        weight: v.walkWeight,
      })),
    ];
    for (let a = 0; a < actors.length; a++) {
      const actor = actors[a];
      for (let b = a + 1; b < actors.length; b++) {
        const other = actors[b];
        const gap =
          distance(
            point(actor, actor.pose.head),
            point(other, other.pose.head),
          ) -
          91 * (actor.scale + other.scale);
        minHeadGap = Math.min(minHeadGap, gap);
        assert.ok(
          gap > 0,
          `Separate heads throughout arrivals, pass-by and waves: ${actor.id}/${other.id} at ${time}, gap ${gap}`,
        );
      }
      if (actor.feet)
        for (const side of ["near", "far"]) {
          const foot = actor.feet[side];
          maxShoeY = Math.max(maxShoeY, foot.y + 20 * actor.scale - s.cameraY);
          if (previous && actor.id === "main" && time >= 0) {
            const last = previous[a].feet[side];
            if (
              Math.abs(foot.y - journeyFloor(foot.x)) < 1e-6 &&
              Math.abs(last.y - journeyFloor(last.x)) < 1e-6
            )
              assert.ok(
                distance(foot, last) < 1e-6,
                "A stance foot does not slide, including the foreground path",
              );
          }
          // Follow the straighter leg through the transfer of weight. The trailing knee
          // is allowed to flex as the landing leg extends. Initial diagonal steps
          // transfer the character into the foreground plane.
          const onLevel = actor.id === "main" ? time > 2.8 : true;
          const grounded =
            actor.id === "main"
              ? Math.abs(foot.y - journeyFloor(foot.x)) < 1e-6
              : Math.abs(foot.y - actor.floorY) < 1e-6;
          if (actor.walking && actor.weight > 0.999999 && onLevel && grounded) {
            const reach = Math.max(
              ...["near", "far"].map((leg) =>
                distance(actor.pose.hip, actor.pose[leg + "Ankle"]),
              ),
            );
            const bend =
              (2 * Math.acos(Math.min(1, reach / 236)) * 180) / Math.PI;
            maxExtendedLegBend = Math.max(maxExtendedLegBend, bend);
            supportSamples++;
            assert.ok(
              bend < 25,
              `The weight transfer keeps one leg extended rather than both crouching: ${actor.id} ${time}, bend ${bend}`,
            );
          }
        }
    }
    if (time >= 0 && time <= 7.5) {
      const main = actors[0];
      for (const other of actors.slice(1))
        for (const side of ["near", "far"]) {
          const gap =
            distance(
              point(main, main.pose.head),
              point(other, other.pose[side + "Wrist"]),
            ) -
            91 -
            30 * other.scale;
          minPassingHandGap = Math.min(minPassingHandGap, gap);
          assert.ok(
            gap > 0,
            `A colleague's hand stays away from her face as she passes: ${other.id} ${time}, gap ${gap}`,
          );
        }
    }
    if (i >= 10 && i % 10 === 0) {
      const before = inkJourneyState(time - 1 / 24);
      for (const key of [
        "head",
        "neck",
        "nearKnee",
        "farKnee",
        "nearAnkle",
        "farAnkle",
      ])
        maxFrameJointTravel = Math.max(
          maxFrameJointTravel,
          distance(point(actors[0], s.main[key]), {
            x: before.mainRoot.x + before.main[key].x,
            y: before.mainRoot.y + before.main[key].y,
          }),
        );
    }
    previous = actors;
  }
  assert.ok(supportSamples > 1000);
  assert.ok(maxShoeY <= 1080, "Shoes remain in frame on the foreground plane");
  assert.ok(
    maxFrameJointTravel < 55,
    "No discontinuity in the walking body or leg joints",
  );
  assert.deepEqual(
    inkJourneyState(0).main,
    inkJourneyState(-1 / 24).main,
    "Departure still matches the end of laughter",
  );
  assert.ok(Math.abs(approachPlan.end - 7.05) < 1e-8);
  assert.ok(Math.abs(exitPlan.end - 13.3) < 1e-8);
});
