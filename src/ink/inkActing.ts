import { standingPose, type InkPoint, type InkPose } from "./InkCharacter";
import { inkMix } from "./inkMotion";

// Shared upper-body match across the cut from the shared laugh to the doorway.
export const inkFarewellRest: InkPose = {
  ...standingPose,
  head: { x: 8, y: -330 },
  headTilt: 3,
  farElbow: { x: 60, y: -130 },
  farWrist: { x: 65, y: -20 },
  gaze: { x: 400, y: -320 },
};

export const inkHelperFarewellRest = (base: InkPose): InkPose => ({
  ...base,
  farElbow: { x: -95, y: -165 },
  farWrist: { x: -60, y: -25 },
  head: { x: base.head.x + 5, y: base.head.y },
  headTilt: 1,
  gaze: { x: 400, y: -330 },
});

// Quintic envelopes start and stop with zero velocity and acceleration.
export const inkSoftRamp = (t: number, a: number, b: number) => {
  const u = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const rotate = (p: InkPoint, pivot: InkPoint, degrees: number): InkPoint => {
  const a = (degrees * Math.PI) / 180,
    dx = p.x - pivot.x,
    dy = p.y - pivot.y;
  return {
    x: pivot.x + dx * Math.cos(a) - dy * Math.sin(a),
    y: pivot.y + dx * Math.sin(a) + dy * Math.cos(a),
  };
};

// Small shoulder lead, then a forearm arc around its elbow, with a soft release.
export const inkWaveArc = (
  pose: InkPose,
  side: "near" | "far",
  time: number,
  amount: number,
  phase = 0,
  amplitude = 9,
): InkPose => {
  const elbow = pose[`${side}Elbow`],
    wrist = pose[`${side}Wrist`];
  const shoulderAngle =
    amount * 1.8 * Math.sin((time * Math.PI * 2) / 1.15 + phase);
  const forearmAngle =
    amount * amplitude * Math.sin(((time - 0.11) * Math.PI * 2) / 1.15 + phase);
  const movedElbow = rotate(elbow, pose.neck, shoulderAngle);
  const movedWrist = rotate(wrist, pose.neck, shoulderAngle);
  return {
    ...pose,
    [`${side}Elbow`]: movedElbow,
    [`${side}Wrist`]: rotate(movedWrist, movedElbow, forearmAngle),
  };
};

export const inkLaughState = (
  time: number,
  initial: { main: InkPose; helper: InkPose },
) => {
  const envelope =
    inkSoftRamp(time, 0.55, 1.45) * (1 - inkSoftRamp(time, 3.25, 4.6));
  const breath = (delay: number) =>
    envelope *
    (Math.exp(-Math.pow((time - 1.65 - delay) / 0.26, 2)) +
      0.72 * Math.exp(-Math.pow((time - 2.3 - delay) / 0.3, 2)) +
      0.3 * Math.exp(-Math.pow((time - 2.95 - delay) / 0.33, 2)));
  const a = breath(0),
    b = breath(0.17);
  const main = inkMix(
    initial.main,
    {
      ...initial.main,
      nearElbow: { x: -76, y: -120 },
      nearWrist: { x: 4, y: -92 },
      farElbow: { x: 75, y: -140 },
      farWrist: { x: 75, y: -35 },
    },
    envelope,
  );
  main.neck = {
    x: initial.main.neck.x + 6 * envelope,
    y: initial.main.neck.y + 3.5 * a,
  };
  main.head = {
    x: initial.main.head.x + 9 * envelope,
    y: initial.main.head.y + 6 * a,
  };
  main.headTilt = initial.main.headTilt - 6 * envelope + 2 * a;
  main.laughAmount = envelope * 0.35 + a * 0.6;
  main.gaze = { x: 520, y: -368 };
  main.nearWrist = { x: main.nearWrist.x, y: main.nearWrist.y + 2.5 * a };
  const helper = inkMix(
    initial.helper,
    {
      ...initial.helper,
      farElbow: { x: -95, y: -165 },
      farWrist: { x: -125, y: -150 },
      nearElbow: { x: 75, y: -145 },
      nearWrist: { x: 58, y: -30 },
    },
    envelope,
  );
  helper.neck = {
    x: initial.helper.neck.x - 4 * envelope,
    y: initial.helper.neck.y + 3.5 * b,
  };
  helper.head = {
    x: initial.helper.head.x - 7 * envelope,
    y: initial.helper.head.y + 6 * b,
  };
  helper.headTilt = initial.helper.headTilt + 5 * envelope - 2 * b;
  helper.laughAmount = envelope * 0.3 + b * 0.6;
  helper.gaze = { ...initial.helper.gaze };
  // The laugh resolves into a departure cue, rather than replaying its first pose.
  const departure = inkSoftRamp(time, 3.4, 4.85);
  const mainDeparture = inkMix(
    main,
    {
      ...initial.main,
      head: inkFarewellRest.head,
      neck: inkFarewellRest.neck,
      headTilt: inkFarewellRest.headTilt,
      nearElbow: inkFarewellRest.nearElbow,
      nearWrist: inkFarewellRest.nearWrist,
      farElbow: inkFarewellRest.farElbow,
      farWrist: inkFarewellRest.farWrist,
      gaze: inkFarewellRest.gaze,
    },
    departure,
  );
  const helperDeparture = inkMix(
    helper,
    inkHelperFarewellRest(initial.helper),
    departure,
  );
  return { main: mainDeparture, helper: helperDeparture, envelope, departure };
};
