import { Easing, interpolate } from "remotion";
import type { InkPoint, InkPose } from "./InkCharacter";

export const inkRamp = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
export const inkPointMix = (a: InkPoint, b: InkPoint, t: number): InkPoint => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
export const inkMix = (a: InkPose, b: InkPose, t: number): InkPose => {
  const out = { ...a };
  for (const k of [
    "head",
    "neck",
    "hip",
    "farElbow",
    "farWrist",
    "nearElbow",
    "nearWrist",
    "farKnee",
    "farAnkle",
    "nearKnee",
    "nearAnkle",
    "gaze",
  ] as const)
    out[k] = inkPointMix(a[k], b[k], t);
  out.headTilt = a.headTilt + (b.headTilt - a.headTilt) * t;
  out.expression = t < 0.5 ? a.expression : b.expression;
  return out;
};

// A target-driven two-link chain; the pole keeps the knee/elbow on its authored side.
export const inkJoint = (
  origin: InkPoint,
  target: InkPoint,
  upper: number,
  lower: number,
  pole = 1,
): InkPoint => {
  const dx = target.x - origin.x,
    dy = target.y - origin.y;
  const raw = Math.max(0.001, Math.hypot(dx, dy));
  const d = Math.min(
    upper + lower - 0.001,
    Math.max(Math.abs(upper - lower) + 0.001, raw),
  );
  const a = (upper * upper - lower * lower + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, upper * upper - a * a));
  return {
    x: origin.x + (dx / raw) * a + ((pole * dy) / raw) * h,
    y: origin.y + (dy / raw) * a - ((pole * dx) / raw) * h,
  };
};

export const inkStep = (
  t: number,
  start: number,
  end: number,
  a: InkPoint,
  b: InkPoint,
  lift: number,
) => {
  const u = Math.max(0, Math.min(1, (t - start) / (end - start)));
  const p = inkPointMix(a, b, 0.5 - Math.cos(Math.PI * u) / 2);
  return { ...p, y: p.y - lift * Math.sin(Math.PI * u) ** 2 };
};
