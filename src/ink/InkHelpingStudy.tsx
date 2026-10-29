import { useId } from "react";
import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";
import {
  carryPose,
  InkArm,
  InkCharacter,
  inkColors,
  inkElbow,
  type InkPoint,
  type InkPose,
} from "./InkCharacter";

const easing = Easing.bezier(0.4, 0, 0.2, 1);
const key = (f: number, frames: number[], values: number[]) =>
  interpolate(f, frames, values, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
const pointKeys = (f: number, frames: number[], points: InkPoint[]) => ({
  x: key(
    f,
    frames,
    points.map((p) => p.x),
  ),
  y: key(
    f,
    frames,
    points.map((p) => p.y),
  ),
});
const topAnchor = (angle: number): InkPoint => {
  const r = (angle * Math.PI) / 180;
  return {
    x: 934 + Math.cos(r) * 70 + Math.sin(r) * 68,
    y: 266 + Math.sin(r) * 70 - Math.cos(r) * 68,
  };
};

export const inkSceneState = (frame: number, fps = 24, wobbleStrength = 1) => {
  // One shared acting clock: no drift between a hand and the block it holds.
  const f = Math.floor((frame * 12) / fps) * 2;
  const tilt =
    key(f, [0, 14, 24, 32, 40, 44, 68, 143], [0, 0, 8, -5, 12, 6, 0, 0]) *
    wobbleStrength;
  const contact = f >= 44;
  const anchor = topAnchor(tilt);
  const fixedContact = topAnchor(6 * wobbleStrength);
  const far = contact
    ? anchor
    : pointKeys(
        f,
        [0, 20, 30, 38, 44],
        [
          { x: 1080, y: 270 },
          { x: 1080, y: 270 },
          { x: 1055, y: 230 },
          { x: 1030, y: 208 },
          fixedContact,
        ],
      );
  const support = { x: 979, y: 452 };
  const near = pointKeys(
    f,
    [0, 20, 32, 44],
    [{ x: 1005, y: 466 }, { x: 1005, y: 466 }, { x: 995, y: 460 }, support],
  );
  const helperRoot = { x: 1252, y: 660 };
  const local = (p: InkPoint) => ({
    x: p.x - helperRoot.x,
    y: p.y - helperRoot.y,
  });
  const neck = { x: 0, y: -230 };
  const helper: InkPose = {
    head: { x: 4, y: -320 },
    neck,
    hip: { x: 0, y: 0 },
    farWrist: local(far),
    farElbow: inkElbow(neck, local(far)),
    nearWrist: local(near),
    nearElbow: inkElbow(neck, local(near)),
    farKnee: { x: -144, y: 120 },
    farAnkle: { x: -122, y: 255 },
    nearKnee: { x: 55, y: 122 },
    nearAnkle: { x: 185, y: 255 },
    expression: "smile",
    gaze: f < 80 ? local(anchor) : { x: -627, y: -273 },
    headTilt: key(f, [0, 32, 48, 80, 96, 143], [0, -8, -4, -4, 5, 5]),
  };
  const main: InkPose = {
    ...carryPose,
    expression: f < 24 ? "concern" : f < 60 ? "surprise" : "smile",
    headTilt: key(f, [0, 24, 44, 70, 96, 143], [-7, -11, -11, -3, 4, 4]),
    gaze:
      f < 80 ? { x: anchor.x - 780, y: anchor.y - 708 } : { x: 476, y: -368 },
  };
  return {
    frame: f,
    tilt,
    contact,
    anchor,
    far,
    support,
    near,
    main,
    helper,
    helperRoot,
  };
};

export const InkBlock = ({
  x,
  y,
  w,
  h,
  fill = inkColors.paper,
  striped = false,
  angle = 0,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  striped?: boolean;
  angle?: number;
}) => {
  const id = `ink-block-${useId().replace(/[^a-z0-9]/gi, "")}`;
  const d = `M 1 1 L ${w - 1} 0 L ${w} ${h - 1} L 0 ${h} Z`;
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${angle} ${w / 2} ${h})`}
      stroke={inkColors.ink}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} fill={fill} strokeWidth={5.5} />
      {striped && (
        <>
          <defs>
            <clipPath id={id}>
              <path d={d} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id})`} strokeWidth={4.3}>
            <path
              d={`M -20 ${h + 10} L ${w + 10} -20 M 7 ${h + 10} L ${w + 37} -20 M 34 ${h + 10} L ${w + 64} -20`}
            />
          </g>
          <path d={d} fill="none" strokeWidth={5.5} />
        </>
      )}
    </g>
  );
};

type ActionProps = { wobbleStrength?: number; style?: React.CSSProperties };
const InkHelpingActionInner = ({ wobbleStrength = 1, style }: ActionProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = inkSceneState(frame, fps, wobbleStrength);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: inkColors.paper,
        ...style,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        role="img"
        aria-label="A colleague catches a wobbling block; both share a relieved glance"
      >
        <rect width={1920} height={1080} fill={inkColors.paper} />
        <path
          d="M 180 932 Q 950 929 1810 932"
          fill="none"
          stroke={inkColors.ink}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <g transform="translate(780 708)">
          <InkCharacter pose={s.main} nearArm={false} />
        </g>
        <g transform={`translate(${s.helperRoot.x} ${s.helperRoot.y})`}>
          <InkCharacter
            pose={s.helper}
            badge={false}
            nearArm={false}
            farArm={false}
          />
        </g>
        <InkBlock x={788} y={518} w={190} h={184} striped />
        <InkBlock x={837} y={389} w={142} h={126} fill={inkColors.blue} />
        <InkBlock x={862} y={268} w={140} h={119} fill={inkColors.yellow} />
        <InkBlock x={864} y={130} w={140} h={136} striped angle={s.tilt} />
        <g transform="translate(780 708)">
          <InkArm pose={s.main} side="near" />
        </g>
        <g transform={`translate(${s.helperRoot.x} ${s.helperRoot.y})`}>
          <InkArm pose={s.helper} side="far" />
          <InkArm pose={s.helper} side="near" />
        </g>
        {s.frame >= 20 && s.frame < 60 && (
          <g
            fill="none"
            stroke={inkColors.ink}
            strokeWidth={4}
            strokeLinecap="round"
          >
            <path d="M 841 116 Q 829 126 828 141 M 828 109 Q 814 122 814 135" />
          </g>
        )}
        {s.frame >= 24 && s.frame < 60 && (
          <g fill={inkColors.ink}>
            <path d="M 512 283 Q 507 264 516 266 Q 524 269 522 288 Z M 489 302 Q 470 293 473 287 Q 480 282 493 296 Z" />
          </g>
        )}
      </svg>
    </div>
  );
};

const schema = {
  wobbleStrength: {
    type: "number",
    hiddenFromList: false,
    default: 1,
    min: 0,
    max: 1.2,
    step: 0.1,
    description: "Block wobble",
  },
} as const satisfies InteractivitySchema;
export const InkHelpingAction = Interactive.withSchema({
  Component: InkHelpingActionInner,
  componentName: "<InkHelpingAction>",
  schema,
  wrapInSequence: true,
});
export const InkHelpingStudy = () => {
  const { fps } = useVideoConfig();
  return (
    <InkHelpingAction
      name="Wobble, catch and shared glance"
      premountFor={fps}
      wobbleStrength={1}
    />
  );
};
