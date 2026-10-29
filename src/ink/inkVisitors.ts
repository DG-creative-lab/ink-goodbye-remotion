import { standingPose, type InkPose, type InkPoint } from "./InkCharacter";
import { inkMix, inkJoint, inkPointMix } from "./inkMotion";
import { inkSoftRamp, inkWaveArc } from "./inkActing";
import {
  makePlan,
  samplePlan,
  inkJourneyState,
  inkWalkingHeight,
} from "./inkJourney";

// Colleagues share one ground baseline. The shorter colleague joins from the
// left behind the departing protagonist, keeping the walking route clear.
const visitors = [
  {
    id: "colleague-one",
    scale: 1,
    baseY: 708,
    mirror: -1,
    upperOffset: -40,
    startX: 2130,
    plan: makePlan(-4.65, 6, 0, -60, 65, 0.7),
    waveStart: 6.1,
    waveEnd: 10.7,
    side: "near" as const,
  },
  {
    id: "colleague-two",
    scale: 0.84,
    baseY: 743.52,
    mirror: 1,
    upperOffset: 0,
    startX: -136.6,
    plan: makePlan(0.3, 11, 0, -60, 65, 0.7),
    waveStart: 7,
    waveEnd: 11.2,
    side: "far" as const,
  },
];

export const inkVisitorsState = (time: number) => {
  const main = inkJourneyState(time);
  return visitors.map((visitor, index) => {
    const sampled = samplePlan(time, visitor.plan);
    const moving =
      inkSoftRamp(time, visitor.plan.start - 0.3, visitor.plan.start) *
      (1 - inkSoftRamp(time, visitor.plan.end, visitor.plan.end + 0.4));
    const sourceY = 708 + moving * (inkWalkingHeight(sampled) - 708);
    const root = {
      x: visitor.startX + visitor.mirror * visitor.scale * sampled.x,
      y: visitor.baseY + visitor.scale * (sourceY - 708),
    };
    const local = (p: InkPoint) => ({ x: p.x - sampled.x, y: p.y - sourceY });
    const swing = (side: "near" | "far") =>
      Math.max(-32, Math.min(32, -(sampled.feet[side].x - sampled.x) * 0.3));
    const rest: InkPose = {
      ...standingPose,
      headTilt: index === 0 ? 4 : -5,
      farKnee: { x: local(sampled.feet.far).x * 0.55, y: 103 },
      nearKnee: { x: local(sampled.feet.near).x * 0.55, y: 105 },
      farAnkle: local(sampled.feet.far),
      nearAnkle: local(sampled.feet.near),
      farWrist: { ...standingPose.farWrist, y: 0 },
      nearWrist: { ...standingPose.nearWrist, y: 0 },
    };
    if (index === 1) {
      rest.nearElbow = { x: -75, y: -125 };
      rest.nearWrist = { x: -15, y: -50 };
      rest.farElbow = { x: 75, y: -160 };
      rest.farWrist = { x: 20, y: -90 };
      // Let the departing friend pass before bringing the hands together.
      const giveRoom = 1 - inkSoftRamp(time, 6.5, 7.3);
      rest.nearElbow = inkPointMix(
        rest.nearElbow,
        { x: -70, y: -95 },
        giveRoom,
      );
      rest.farElbow = inkPointMix(rest.farElbow, { x: 70, y: -95 }, giveRoom);
      rest.nearWrist = { x: -15, y: -50 + 100 * giveRoom };
      rest.farWrist = { x: 20, y: -90 + 140 * giveRoom };
    }
    const walk: InkPose = {
      ...rest,
      head: { x: 25, y: -330 },
      neck: { x: 12, y: -240 },
      headTilt: 3,
      nearElbow: { x: -50 + swing("near") * 0.35, y: -130 },
      nearWrist: { x: -50 + swing("near"), y: -25 },
      farElbow: { x: 50 + swing("far") * 0.35, y: -130 },
      farWrist: { x: 50 + swing("far"), y: -25 },
      farKnee: inkJoint({ x: 0, y: 0 }, local(sampled.feet.far), 118, 118),
      nearKnee: inkJoint({ x: 0, y: 0 }, local(sampled.feet.near), 118, 118),
    };
    let pose = inkMix(rest, walk, moving);
    const amount =
      index === 0
        ? inkSoftRamp(time, visitor.waveStart, visitor.waveStart + 0.8) *
          (1 - inkSoftRamp(time, visitor.waveEnd - 0.9, visitor.waveEnd))
        : 0;
    const raised: InkPose = {
      ...pose,
      ...(visitor.side === "near"
        ? { nearElbow: { x: -115, y: -250 }, nearWrist: { x: -145, y: -400 } }
        : { farElbow: { x: 100, y: -180 }, farWrist: { x: 155, y: -310 } }),
    };
    pose = inkWaveArc(
      inkMix(pose, raised, amount),
      visitor.side,
      time,
      amount * 0.65,
      index * 1.6,
      7,
    );
    if (index === 1)
      pose.headTilt +=
        3 * inkSoftRamp(time, 7.2, 8.0) * (1 - inkSoftRamp(time, 8.0, 8.8));
    // Preserve the taller colleague's head and arm height while returning the
    // hips and feet to the ground; the torso, rather than the legs, is taller.
    for (const key of [
      "head",
      "neck",
      "nearElbow",
      "farElbow",
      "nearWrist",
      "farWrist",
    ] as const)
      pose[key] = { ...pose[key], y: pose[key].y + visitor.upperOffset };
    // Eyes follow the friend in the local coordinates of either entry direction.
    pose.gaze = {
      x:
        (main.mainRoot.x + main.main.head.x - root.x) /
        (visitor.mirror * visitor.scale),
      y: (main.mainRoot.y + main.main.head.y - root.y) / visitor.scale,
    };
    const worldFeet = {
      far: {
        x: visitor.startX + visitor.mirror * visitor.scale * sampled.feet.far.x,
        y: visitor.baseY + 207 * visitor.scale,
      },
      near: {
        x:
          visitor.startX + visitor.mirror * visitor.scale * sampled.feet.near.x,
        y: visitor.baseY + 207 * visitor.scale,
      },
    };
    for (const side of ["near", "far"] as const)
      worldFeet[side].y -= visitor.scale * (915 - sampled.feet[side].y);
    return {
      id: visitor.id,
      root,
      scale: visitor.scale,
      mirror: visitor.mirror,
      floorY: visitor.baseY + 207 * visitor.scale,
      pose,
      footAngles: sampled.footAngles,
      feet: worldFeet,
      walking: time >= visitor.plan.start && time < visitor.plan.end,
      walkWeight: moving,
    };
  });
};
