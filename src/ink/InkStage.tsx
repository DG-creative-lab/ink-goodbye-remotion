import { type CSSProperties, type ReactNode } from "react";
import { inkColors, standingPose, type InkPose } from "./InkCharacter";
import { InkBlock } from "./InkHelpingStudy";

export const InkGround = () => (
  <path
    data-ground="shared-floor"
    d="M 180 932 Q 950 929 1810 932"
    fill="none"
    stroke={inkColors.ink}
    strokeWidth={2.5}
    strokeLinecap="round"
  />
);
export const InkStage = ({
  label,
  children,
  style,
  ground = true,
}: {
  label: string;
  children: ReactNode;
  style?: CSSProperties;
  ground?: boolean;
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundColor: inkColors.paper,
      ...style,
    }}
  >
    <svg
      viewBox="0 0 1920 1080"
      width="100%"
      height="100%"
      role="img"
      aria-label={label}
    >
      <rect width={1920} height={1080} fill={inkColors.paper} />
      {ground ? <InkGround /> : null}
      {children}
    </svg>
  </div>
);

export const helperStand: InkPose = {
  ...standingPose,
  head: { x: 0, y: -368 },
  neck: { x: 0, y: -278 },
  gaze: { x: -230, y: -300 },
  headTilt: -5,
  farKnee: standingPose.nearKnee,
  farAnkle: standingPose.nearAnkle,
  nearKnee: standingPose.farKnee,
  nearAnkle: standingPose.farAnkle,
  farElbow: { x: -90, y: -175 },
  farWrist: { x: -180, y: -210 },
  nearElbow: { x: 80, y: -145 },
  nearWrist: { x: 54, y: -20 },
};
export const InkStack = ({
  offset = { x: 0, y: 0 },
  angle = 0,
}: {
  offset?: { x: number; y: number };
  angle?: number;
}) => (
  <g transform={`translate(${offset.x} ${offset.y})`}>
    <InkBlock x={788} y={518} w={190} h={184} striped />
    <InkBlock x={837} y={389} w={142} h={126} fill={inkColors.blue} />
    <InkBlock x={862} y={268} w={140} h={119} fill={inkColors.yellow} />
    <InkBlock x={864} y={130} w={140} h={136} striped angle={angle} />
  </g>
);
export const GroundBlocks = ({ settle = 0 }: { settle?: number }) => (
  <InkStack offset={{ x: 100, y: 225 }} angle={settle} />
);
export const InkDoor = ({ floorY = 930 }: { floorY?: number }) => (
  <g
    fill="none"
    stroke={inkColors.ink}
    strokeWidth={4.3}
    strokeLinejoin="round"
    strokeLinecap="round"
  >
    <path d={`M 1490 ${floorY} L 1490 240 L 1815 240 L 1815 ${floorY}`} />
    <path
      d={`M 1490 240 L 1390 285 L 1390 ${floorY} L 1490 ${floorY} Z`}
      fill="#fff4d8"
    />
    <path d="M 1410 626 L 1410 666" strokeWidth={6} />
  </g>
);
