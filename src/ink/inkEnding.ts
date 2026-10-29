import { inkSoftRamp } from "./inkActing";

export const inkEndingMessage = {
  lineOne: "For the ideas we shared.",
  lineTwo: "The things we built.",
  lineThree: "And the laughs along the way.",
  closing: "Thank you.",
  signature: "Your name",
};

export const inkEndingState = (time: number) => {
  const appear = inkSoftRamp(time, 3.4, 3.9);
  const flight = inkSoftRamp(time, 5.1, 6.7);
  const phase = Math.max(0, time - 3.9) % 1.65;
  const beat =
    Math.exp(-Math.pow((phase - 0.12) / 0.1, 2)) +
    0.5 * Math.exp(-Math.pow((phase - 0.36) / 0.12, 2));
  const breath =
    0.006 * Math.sin((Math.max(0, time - 6.7) * Math.PI * 2) / 2.8);
  return {
    appear,
    flight,
    sceneOpacity: 1 - inkSoftRamp(time, 4.1, 4.9),
    x: 1670 + (960 - 1670) * flight,
    y: 820 + (420 - 820) * flight - 105 * Math.sin(Math.PI * flight),
    rotation: -8 * Math.sin(Math.PI * flight),
    scale: appear * (1.3 + (14 - 1.3) * flight),
    scaleX: 1 + beat * 0.07 * (1 - flight) + breath * flight,
    scaleY: 1 - beat * 0.035 * (1 - flight) + breath * flight,
    lineOne: inkSoftRamp(time, 6.8, 7.3),
    lineTwo: inkSoftRamp(time, 7.25, 7.75),
    lineThree: inkSoftRamp(time, 7.65, 8.15),
    closing: inkSoftRamp(time, 8.2, 8.75),
    underline: inkSoftRamp(time, 8.55, 9),
    signature: inkSoftRamp(time, 9, 9.4),
  };
};
