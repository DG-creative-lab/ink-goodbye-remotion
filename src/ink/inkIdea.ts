import type { InkPoint, InkPose } from "./InkCharacter";
import { inkSceneState } from "./InkHelpingStudy";
import { inkSoftRamp } from "./inkActing";
import { inkJoint, inkMix, inkPointMix } from "./inkMotion";
import { inkSetDownState } from "./inkSetDown";

export const ideaStrokes = [
  {
    start: 0.65,
    end: 1.4,
    side: "main",
    points: [
      { x: 910, y: 610 },
      { x: 1005, y: 610 },
      { x: 1005, y: 660 },
      { x: 910, y: 660 },
      { x: 910, y: 610 },
    ],
  },
  {
    start: 1.55,
    end: 2.05,
    side: "main",
    points: [
      { x: 937, y: 570 },
      { x: 1005, y: 570 },
      { x: 1005, y: 610 },
      { x: 937, y: 610 },
      { x: 937, y: 570 },
    ],
  },
  {
    start: 2.35,
    end: 2.85,
    side: "helper",
    points: [
      { x: 947, y: 532 },
      { x: 1013, y: 532 },
      { x: 1013, y: 570 },
      { x: 947, y: 570 },
      { x: 947, y: 532 },
    ],
  },
  {
    start: 2.95,
    end: 3.4,
    side: "helper",
    points: [
      { x: 948, y: 488 },
      { x: 1014, y: 488 },
      { x: 1014, y: 532 },
      { x: 948, y: 532 },
      { x: 948, y: 488 },
    ],
  },
] as const;

// Travel by ink length, keeping the pencil on the line as it is drawn.
export const ideaStrokePoint = (
  points: readonly InkPoint[],
  amount: number,
) => {
  const lengths = points
    .slice(1)
    .map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  let distance =
    Math.max(0, Math.min(1, amount)) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i])
      return inkPointMix(points[i], points[i + 1], distance / lengths[i]);
    distance -= lengths[i];
  }
  return points[points.length - 1];
};

const pencil = (time: number, side: "main" | "helper") => {
  const strokes = ideaStrokes.filter((stroke) => stroke.side === side);
  const rest = side === "main" ? { x: 859, y: 545 } : { x: 1125, y: 510 };
  let tip: InkPoint = rest;
  for (const stroke of strokes) {
    if (time < stroke.start) {
      const lastEnd =
        strokes.indexOf(stroke) === 0
          ? stroke.start - 0.4
          : strokes[strokes.indexOf(stroke) - 1].end;
      return inkPointMix(
        tip,
        stroke.points[0],
        inkSoftRamp(time, lastEnd, stroke.start),
      );
    }
    tip = ideaStrokePoint(
      stroke.points,
      inkSoftRamp(time, stroke.start, stroke.end),
    );
    if (time <= stroke.end) return tip;
  }
  const last = strokes[strokes.length - 1];
  return inkPointMix(tip, rest, inkSoftRamp(time, last.end, last.end + 0.35));
};

const planning = (time: number) => {
  const rest = inkSetDownState(5);
  const local = (p: InkPoint, root: InkPoint) => ({
    x: p.x - root.x,
    y: p.y - root.y,
  });
  const mainTip = pencil(time, "main"),
    helperTip = pencil(time, "helper");
  const look = inkSoftRamp(time, 3.55, 3.95);
  const main: InkPose = {
    ...rest.main,
    farWrist: local({ x: 858, y: 675 }, rest.mainRoot),
    nearWrist: local({ x: mainTip.x - 22, y: mainTip.y - 35 }, rest.mainRoot),
    gaze: local(
      inkPointMix({ x: 970, y: 570 }, { x: 1270, y: 340 }, look),
      rest.mainRoot,
    ),
    headTilt: 7 - 4 * look,
    expression: "smile",
  };
  // Supporting elbows hang beside the torso, outside the board's edges.
  main.farElbow = inkJoint(main.neck, main.farWrist, 180, 140, -1);
  main.nearElbow = inkJoint(main.neck, main.nearWrist, 174, 125, -1);
  const helper: InkPose = {
    ...rest.helper,
    nearWrist: local({ x: 1105, y: 650 }, rest.helperRoot),
    farWrist: local(
      { x: helperTip.x + 10, y: helperTip.y - 35 },
      rest.helperRoot,
    ),
    gaze: local(
      inkPointMix({ x: 980, y: 570 }, { x: 750, y: 378 }, look),
      rest.helperRoot,
    ),
    headTilt: -7 + 10 * look,
    expression: "smile",
  };
  helper.farElbow = inkJoint(helper.neck, helper.farWrist, 160, 180, 1);
  helper.nearElbow = inkJoint(helper.neck, helper.nearWrist, 160, 200, 1);
  return { ...rest, main, helper, mainTip, helperTip };
};

export const inkIdeaState = (time: number) => {
  const t = Math.max(0, time);
  const plan = planning(Math.min(t, 4));
  const rest = inkSetDownState(5);
  const reverse = inkSetDownState(4.8 * (1 - inkSoftRamp(t, 4.7, 7.7)));
  const release = inkSoftRamp(t, 4, 4.7);
  const ready = inkSoftRamp(t, 7.35, 7.8);
  const original = inkSceneState(0);
  const state =
    t < 4.7
      ? {
          ...rest,
          main: inkMix(plan.main, rest.main, release),
          helper: inkMix(plan.helper, rest.helper, release),
          offset: { x: 100, y: 225 },
        }
      : {
          ...reverse,
          main: inkMix(reverse.main, original.main, ready),
          helper: inkMix(reverse.helper, original.helper, ready),
          mainRoot: inkPointMix(reverse.mainRoot, { x: 780, y: 708 }, ready),
          helperRoot: inkPointMix(
            reverse.helperRoot,
            original.helperRoot,
            ready,
          ),
        };
  return {
    ...state,
    mainTip: plan.mainTip,
    helperTip: plan.helperTip,
    paperOpacity: 1 - inkSoftRamp(t, 4.05, 4.6),
    blocksOpacity: inkSoftRamp(t, 4.3, 4.7),
    pencilOpacity: 1 - inkSoftRamp(t, 3.9, 4.1),
    strokes: ideaStrokes.map((stroke) =>
      inkSoftRamp(t, stroke.start, stroke.end),
    ),
  };
};
