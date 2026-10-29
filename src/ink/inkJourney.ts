import { type InkPoint, type InkPose } from "./InkCharacter";
import {
  inkFarewellRest,
  inkLaughState,
  inkSoftRamp,
  inkWaveArc,
} from "./inkActing";
import { inkJoint, inkMix, inkPointMix, inkStep } from "./inkMotion";
import { inkSetDownState } from "./inkSetDown";

export const journeyCameraTravel = 595;
export const journeyDoorJamb = 2410;
export const journeyGreetingStart = 7.3;
export const journeyExitStart = 10;
const stepSeconds = 0.55;
const settled = inkSetDownState(5);
const start = inkLaughState(5, settled);

type Side = "near" | "far";
type Footfall = {
  side: Side;
  start: number;
  end: number;
  from: InkPoint;
  to: InkPoint;
};
type WalkPlan = {
  start: number;
  end: number;
  rootStart: number;
  rootEnd: number;
  feetStart: Record<Side, InkPoint>;
  steps: Footfall[];
  centres: number[];
  floor: (x: number) => number;
};
export const makePlan = (
  time: number,
  count: number,
  rootStart: number,
  far: number,
  near: number,
  firstStepSeconds = stepSeconds,
  floor: (x: number) => number = () => 915,
): WalkPlan => {
  const feetStart = {
    far: { x: far, y: floor(far) },
    near: { x: near, y: floor(near) },
  };
  const feet = { ...feetStart };
  const steps: Footfall[] = [];
  const centres = [rootStart];
  let cursor = time;
  for (let i = 0; i < count; i++) {
    const side: Side = i % 2 === 0 ? "far" : "near";
    const nextX = near + 100 * (i + 1);
    const next = { x: nextX, y: floor(nextX) };
    steps.push({
      side,
      start: cursor,
      end: cursor + (i === 0 ? firstStepSeconds : stepSeconds),
      from: feet[side],
      to: next,
    });
    cursor = steps[steps.length - 1].end;
    feet[side] = next;
    centres.push((feet.far.x + feet.near.x) / 2);
  }
  return {
    start: time,
    end: cursor,
    rootStart,
    rootEnd: centres[centres.length - 1],
    feetStart,
    steps,
    centres,
    floor,
  };
};
// The door is on the foreground plane, so there is no stair-like climb back
// through the group when the protagonist reaches it.
export const journeyFloor = (x: number) =>
  915 + 145 * inkSoftRamp(x, 815, 1165);
export const approachPlan = makePlan(0.3, 12, 750, 690, 815, 0.7, journeyFloor);
export const exitPlan = makePlan(
  journeyExitStart,
  6,
  approachPlan.rootEnd,
  1915,
  2015,
  stepSeconds,
  journeyFloor,
);

export const samplePlan = (time: number, plan: WalkPlan) => {
  const feet = { ...plan.feetStart };
  const footAngles = { far: 0, near: 0 };
  for (const step of plan.steps) {
    if (time < step.start) continue;
    feet[step.side] = inkStep(
      time,
      step.start,
      step.end,
      step.from,
      step.to,
      24,
    );
    if (time < step.end) {
      const u = (time - step.start) / (step.end - step.start);
      footAngles[step.side] =
        -14 * Math.sin(Math.PI * u) + 10 * Math.sin(2 * Math.PI * u);
    }
  }
  const active = plan.steps.findIndex((step) => time < step.end);
  const index = active < 0 ? plan.steps.length - 1 : active;
  const step = plan.steps[index];
  const duration = step.end - step.start;
  const u = Math.max(0, Math.min(1, (time - step.start) / duration));
  const x0 = plan.centres[index],
    x1 = plan.centres[index + 1];
  const v0 =
    index === 0
      ? 0
      : 200 /
        (duration + plan.steps[index - 1].end - plan.steps[index - 1].start);
  const v1 =
    index === plan.steps.length - 1
      ? 0
      : 200 /
        (duration + plan.steps[index + 1].end - plan.steps[index + 1].start);
  // Match velocity at footfall boundaries; only the start and stop decelerate.
  const x =
    (2 * u ** 3 - 3 * u * u + 1) * x0 +
    (u ** 3 - 2 * u * u + u) * duration * v0 +
    (-2 * u ** 3 + 3 * u * u) * x1 +
    (u ** 3 - u * u) * duration * v1;
  return { x, feet, footAngles, phase: index + u };
};

// The supporting leg approaches full extension instead of staying in a squat.
// Both ankle reaches constrain the hip, including steps onto a different depth plane.
export const inkWalkingHeight = (sampled: ReturnType<typeof samplePlan>) =>
  Math.max(
    ...Object.values(sampled.feet).map(
      (foot) =>
        foot.y - Math.sqrt(Math.max(1, 232 * 232 - (foot.x - sampled.x) ** 2)),
    ),
  );

const standingLegs = (feet: Record<Side, InkPoint>, root: InkPoint) => ({
  farKnee: { x: -35, y: 103 },
  nearKnee: { x: 35, y: 105 },
  farAnkle: { x: feet.far.x - root.x, y: feet.far.y - root.y },
  nearAnkle: { x: feet.near.x - root.x, y: feet.near.y - root.y },
});

export const inkJourneyState = (time: number) => {
  if (time < 0) {
    const laughter = inkLaughState(Math.max(0, time + 5), settled);
    return {
      main: laughter.main,
      mainRoot: { x: 750, y: 708 },
      helper: laughter.helper,
      helperRoot: { x: 1270, y: 708 },
      camera: 0,
      cameraY: 0,
      footAngles: { near: 0, far: 0 },
      feet: { far: { x: 690, y: 915 }, near: { x: 815, y: 915 } },
      walking: false,
      walkWeight: 0,
      keyline: 0,
    };
  }
  const exiting = time >= 9.7;
  const plan = exiting ? exitPlan : approachPlan;
  const sampled = samplePlan(time, plan);
  const prepare = exiting
    ? inkSoftRamp(time, 9.7, 10)
    : inkSoftRamp(time, 0, 0.3);
  const recover = 1 - inkSoftRamp(time, plan.end, plan.end + 0.45);
  const walkWeight = prepare * recover;
  const root = {
    x: sampled.x,
    y:
      (1 - walkWeight) * (plan.floor(sampled.x) - 207) +
      walkWeight * inkWalkingHeight(sampled),
  };
  const local = (p: InkPoint) => ({ x: p.x - root.x, y: p.y - root.y });
  const nearSwing = Math.max(
    -32,
    Math.min(32, -(sampled.feet.near.x - root.x) * 0.3),
  );
  const farSwing = Math.max(
    -32,
    Math.min(32, -(sampled.feet.far.x - root.x) * 0.3),
  );
  const walk: InkPose = {
    ...start.main,
    head: { x: 25, y: -300 },
    neck: { x: 12, y: -210 },
    headTilt: 3,
    gaze: { x: 400, y: -320 },
    laughAmount: 0,
    nearElbow: { x: -50 + nearSwing * 0.35, y: -130 },
    nearWrist: {
      x: -50 + nearSwing,
      y: -25 + 3 * Math.sin(sampled.phase * Math.PI),
    },
    farElbow: { x: 50 + farSwing * 0.35, y: -130 },
    farWrist: {
      x: 50 + farSwing,
      y: -25 - 3 * Math.sin(sampled.phase * Math.PI),
    },
    farAnkle: local(sampled.feet.far),
    nearAnkle: local(sampled.feet.near),
    farKnee: inkJoint({ x: 0, y: 0 }, local(sampled.feet.far), 118, 118),
    nearKnee: inkJoint({ x: 0, y: 0 }, local(sampled.feet.near), 118, 118),
  };
  const atDoor: InkPose = {
    ...inkFarewellRest,
    ...standingLegs(sampled.feet, root),
    laughAmount: 0,
  };
  const waveTime = time - journeyGreetingStart;
  const waveAmount =
    inkSoftRamp(waveTime, 0.4, 0.9) * (1 - inkSoftRamp(time, 9.1, 9.7));
  const raised = {
    ...atDoor,
    farElbow: { x: 100, y: -220 },
    farWrist: { x: 155, y: -340 },
    gaze: { x: -650, y: -330 },
    headTilt: -6,
    head: { x: 0, y: -330 },
  };
  const wave = inkWaveArc(raised, "far", waveTime, waveAmount, 0.3, 8);
  let resting = inkMix(atDoor, wave, inkSoftRamp(time, 7.3, 8.1));
  if (time < approachPlan.end) resting = { ...start.main };
  let main = inkMix(resting, walk, walkWeight);
  if (time >= 9.2) main = inkMix(resting, walk, inkSoftRamp(time, 9.2, 10.2));
  // Feet are world anchors. Leg recovery changes the knee pose, never the planted feet.
  const legWeight = exiting ? prepare : walkWeight;
  const restLegs = time < 0.3 ? start.main : atDoor;
  for (const side of ["near", "far"] as const) {
    main[`${side}Ankle`] = local(sampled.feet[side]);
    main[`${side}Knee`] = inkPointMix(
      restLegs[`${side}Knee`],
      walk[`${side}Knee`],
      legWeight,
    );
  }
  const helperRest = start.helper;
  const helperWave =
    inkSoftRamp(time, 5.4, 6.3) * (1 - inkSoftRamp(time, 10.2, 11.4));
  let helper = inkMix(
    helperRest,
    {
      ...helperRest,
      farElbow: { x: -100, y: -220 },
      farWrist: { x: -145, y: -385 },
    },
    helperWave,
  );
  helper = inkWaveArc(helper, "far", time, helperWave * 0.6, 0.8, 7);
  helper.gaze = inkPointMix(
    helperRest.gaze,
    { x: root.x - 1270, y: root.y - 330 - 708 },
    inkSoftRamp(time, 0, 0.6),
  );
  helper.headTilt = 1 + helperWave * 1.5;
  const camera = journeyCameraTravel * inkSoftRamp(time, 0.3, approachPlan.end);
  return {
    main,
    mainRoot: root,
    helper,
    helperRoot: { x: 1270, y: 708 },
    camera,
    cameraY: 40 * inkSoftRamp(time, 0.3, 3),
    feet: sampled.feet,
    footAngles: sampled.footAngles,
    walking: time >= plan.start && time < plan.end,
    walkWeight: legWeight,
    keyline: 11 * inkSoftRamp(time, 0.3, 0.9),
  };
};
