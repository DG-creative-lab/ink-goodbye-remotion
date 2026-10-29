import {
  inkElbow,
  standingPose,
  type InkPoint,
  type InkPose,
} from "./InkCharacter";
import { inkSceneState } from "./InkHelpingStudy";
import { helperStand } from "./InkStage";
import { inkJoint, inkMix, inkPointMix, inkRamp, inkStep } from "./inkMotion";

export const settledBlockOffset = { x: 100, y: 225 };
const add = (a: InkPoint, b: InkPoint) => ({ x: a.x + b.x, y: a.y + b.y });
const local = (p: InkPoint, root: InkPoint) => ({
  x: p.x - root.x,
  y: p.y - root.y,
});

export const inkSetDownState = (time: number) => {
  const initial = inkSceneState(142);
  const lower = inkRamp(time, 0.7, 2.7);
  const regrip = inkRamp(time, 0.05, 0.65);
  const rise = inkRamp(time, 3.05, 4.55);
  const offset = {
    x: settledBlockOffset.x * lower,
    y: settledBlockOffset.y * lower,
  };
  const mainRoot = inkPointMix(
    inkPointMix({ x: 780, y: 708 }, { x: 740, y: 780 }, lower),
    { x: 750, y: 708 },
    rise,
  );
  const mainHead = inkPointMix(
    inkPointMix({ x: 625, y: 387 }, { x: 835, y: 450 }, lower),
    { x: 750, y: 378 },
    rise,
  );
  const mainNeck = inkPointMix(
    inkPointMix({ x: 655, y: 475 }, { x: 825, y: 540 }, lower),
    { x: 750, y: 468 },
    rise,
  );
  const mainFeet = {
    far: inkStep(time, 3.25, 3.85, { x: 638, y: 915 }, { x: 690, y: 915 }, 22),
    near: inkStep(time, 0.05, 0.65, { x: 876, y: 915 }, { x: 815, y: 915 }, 30),
  };
  const mainGrips = {
    far: add({ x: 808, y: 600 - 115 * regrip }, offset),
    near: add({ x: 825, y: 697 - 122 * regrip }, offset),
  };
  const main: InkPose = {
    ...initial.main,
    head: local(mainHead, mainRoot),
    neck: local(mainNeck, mainRoot),
    farWrist: local(mainGrips.far, mainRoot),
    nearWrist: local(mainGrips.near, mainRoot),
    farKnee: local(
      inkPointMix({ x: 776, y: 788 }, { x: 800, y: 835 }, lower),
      mainRoot,
    ),
    nearKnee: local(
      inkPointMix({ x: 926, y: 773 }, { x: 845, y: 800 }, lower),
      mainRoot,
    ),
    farAnkle: local(mainFeet.far, mainRoot),
    nearAnkle: local(mainFeet.near, mainRoot),
    headTilt: 4 - lower * 8,
    gaze: inkPointMix(
      initial.main.gaze,
      { x: 950 - mainRoot.x, y: 700 - mainRoot.y },
      lower,
    ),
  };
  main.farElbow = inkJoint(
    main.neck,
    main.farWrist,
    Math.hypot(105, 63),
    Math.hypot(48, 62),
    1,
  );
  main.nearElbow = inkJoint(
    main.neck,
    main.nearWrist,
    Math.hypot(61, 163),
    Math.hypot(109, 59),
    -1,
  );
  const restingMain = {
    ...standingPose,
    farKnee: standingPose.nearKnee,
    farAnkle: standingPose.nearAnkle,
    nearKnee: standingPose.farKnee,
    nearAnkle: standingPose.farAnkle,
    gaze: { x: 520, y: -368 },
  };
  const finalMain = inkMix(main, restingMain, rise);
  finalMain.head = main.head;
  finalMain.neck = main.neck;
  for (const side of ["near", "far"] as const) {
    finalMain[`${side}Ankle`] = local(mainFeet[side], mainRoot);
    finalMain[`${side}Knee`] = inkPointMix(
      main[`${side}Knee`],
      restingMain[`${side}Knee`],
      rise,
    );
  }

  const helperRoot = { x: 1252 + 18 * lower, y: 660 + 48 * rise };
  const helperHead = { x: 1256 + 14 * lower, y: 340 };
  const helperNeck = { x: helperRoot.x, y: 430 };
  const helperFeet = {
    far: inkStep(
      time,
      3.15,
      3.75,
      { x: 1130, y: 915 },
      { x: 1210, y: 915 },
      24,
    ),
    near: inkStep(
      time,
      3.85,
      4.45,
      { x: 1437, y: 915 },
      { x: 1335, y: 915 },
      24,
    ),
  };
  const helperGrips = {
    far: add(initial.far, offset),
    near: add(initial.near, offset),
  };
  const helper: InkPose = {
    ...initial.helper,
    head: local(helperHead, helperRoot),
    neck: local(helperNeck, helperRoot),
    farWrist: local(helperGrips.far, helperRoot),
    nearWrist: local(helperGrips.near, helperRoot),
    farAnkle: local(helperFeet.far, helperRoot),
    nearAnkle: local(helperFeet.near, helperRoot),
    headTilt: 5 - 10 * lower,
    gaze: { x: mainHead.x - helperRoot.x, y: mainHead.y - helperRoot.y },
  };
  helper.farElbow = inkElbow(helper.neck, helper.farWrist);
  helper.nearElbow = inkElbow(helper.neck, helper.nearWrist);
  const finalHelper = inkMix(helper, helperStand, rise);
  finalHelper.head = helper.head;
  finalHelper.neck = helper.neck;
  for (const side of ["near", "far"] as const) {
    finalHelper[`${side}Ankle`] = local(helperFeet[side], helperRoot);
    finalHelper[`${side}Knee`] = inkPointMix(
      initial.helper[`${side}Knee`],
      helperStand[`${side}Knee`],
      rise,
    );
  }
  return {
    main: finalMain,
    mainRoot,
    helper: finalHelper,
    helperRoot,
    offset,
    mainFeet,
    helperFeet,
    mainGrips,
    helperGrips,
    contact: time <= 3.05,
    grounded: time >= 2.7,
  };
};
