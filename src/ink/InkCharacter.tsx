export const inkColors = {
  paper: "#fff9ed",
  ink: "#28241f",
  blue: "#316dc3",
  yellow: "#e9b53b",
} as const;

export type InkPoint = { x: number; y: number };
export type InkPose = {
  head: InkPoint;
  neck: InkPoint;
  hip: InkPoint;
  farElbow: InkPoint;
  farWrist: InkPoint;
  nearElbow: InkPoint;
  nearWrist: InkPoint;
  farKnee: InkPoint;
  farAnkle: InkPoint;
  nearKnee: InkPoint;
  nearAnkle: InkPoint;
  expression: "concern" | "surprise" | "smile" | "laugh";
  gaze: InkPoint;
  headTilt: number;
  laughAmount?: number;
};

const pt = (x: number, y: number): InkPoint => ({ x, y });
export const carryPose: InkPose = {
  head: pt(-155, -321),
  neck: pt(-125, -233),
  hip: pt(0, 0),
  farElbow: pt(-20, -170),
  farWrist: pt(28, -108),
  nearElbow: pt(-64, -70),
  nearWrist: pt(45, -11),
  farKnee: pt(-4, 80),
  farAnkle: pt(-142, 207),
  nearKnee: pt(146, 65),
  nearAnkle: pt(96, 207),
  expression: "concern",
  gaze: pt(170, -430),
  headTilt: -7,
};
export const standingPose: InkPose = {
  head: pt(0, -330),
  neck: pt(0, -240),
  hip: pt(0, 0),
  farElbow: pt(62, -136),
  farWrist: pt(66, -25),
  nearElbow: pt(-60, -130),
  nearWrist: pt(-63, -20),
  farKnee: pt(45, 105),
  farAnkle: pt(65, 207),
  nearKnee: pt(-44, 103),
  nearAnkle: pt(-60, 207),
  expression: "smile",
  gaze: pt(200, -330),
  headTilt: 0,
};

export const inkPoses: Record<string, InkPose> = {
  carry: carryPose,
  wobble: { ...carryPose, expression: "surprise", headTilt: -11 },
  relieved: {
    ...carryPose,
    expression: "smile",
    gaze: pt(470, -350),
    headTilt: 3,
  },
  stand: standingPose,
  offer: {
    ...standingPose,
    farElbow: pt(100, -185),
    farWrist: pt(210, -220),
    headTilt: 5,
  },
  make: {
    ...standingPose,
    head: pt(50, -290),
    neck: pt(35, -195),
    nearElbow: pt(92, -125),
    nearWrist: pt(160, -80),
    farElbow: pt(98, -155),
    farWrist: pt(190, -135),
    headTilt: 10,
  },
  laugh: {
    ...standingPose,
    nearElbow: pt(-76, -105),
    nearWrist: pt(16, -88),
    farElbow: pt(130, -140),
    farWrist: pt(114, -255),
    expression: "laugh",
    headTilt: -12,
  },
  wave: {
    ...standingPose,
    farElbow: pt(100, -180),
    farWrist: pt(130, -310),
    gaze: pt(210, -300),
    headTilt: 7,
  },
};

const limb = (a: InkPoint, b: InkPoint, c: InkPoint) =>
  `M ${a.x} ${a.y} L ${b.x} ${b.y} L ${c.x} ${c.y}`;

// Reaching arms use a two-link solve; other poses and foot contacts are authored.
export const inkElbow = (shoulder: InkPoint, wrist: InkPoint): InkPoint => {
  const dx = wrist.x - shoulder.x,
    dy = wrist.y - shoulder.y;
  const raw = Math.hypot(dx, dy);
  const d = Math.min(389.99, Math.max(70.01, raw));
  const a = (160 * 160 - 230 * 230 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, 160 * 160 - a * a));
  return {
    x: shoulder.x + (dx / raw) * a + (dy / raw) * h,
    y: shoulder.y + (dy / raw) * a - (dx / raw) * h,
  };
};

export const InkArm = ({
  pose,
  side,
}: {
  pose: InkPose;
  side: "near" | "far";
}) => {
  const elbow = side === "near" ? pose.nearElbow : pose.farElbow;
  const wrist = side === "near" ? pose.nearWrist : pose.farWrist;
  const angle =
    (Math.atan2(wrist.y - elbow.y, wrist.x - elbow.x) * 180) / Math.PI;
  return (
    <g
      fill="none"
      stroke={inkColors.ink}
      strokeWidth={6.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={limb(pose.neck, elbow, wrist)} />
      <path
        transform={`translate(${wrist.x} ${wrist.y}) rotate(${angle})`}
        d="M -3 -4 Q 1 -12 9 -10 L 11 -18 Q 15 -22 19 -17 L 17 -10 Q 26 -12 27 -5 Q 29 3 22 10 Q 12 15 3 8 Z"
        fill={inkColors.paper}
        strokeWidth={4.8}
      />
    </g>
  );
};

const Shoe = ({ ankle, angle = 0 }: { ankle: InkPoint; angle?: number }) => (
  <path
    transform={angle ? `rotate(${angle} ${ankle.x} ${ankle.y})` : undefined}
    d={`M ${ankle.x - 9} ${ankle.y + 7} Q ${ankle.x - 4} ${ankle.y - 10} ${ankle.x + 17} ${ankle.y - 5} Q ${ankle.x + 47} ${ankle.y} ${ankle.x + 41} ${ankle.y + 11} Q ${ankle.x + 15} ${ankle.y + 15} ${ankle.x - 9} ${ankle.y + 7} Z`}
    fill={inkColors.paper}
    stroke={inkColors.ink}
    strokeWidth={5.5}
    strokeLinejoin="round"
  />
);

export const InkCharacter = ({
  pose,
  badge = true,
  nearArm = true,
  farArm = true,
  footAngles,
}: {
  pose: InkPose;
  badge?: boolean;
  nearArm?: boolean;
  farArm?: boolean;
  footAngles?: { near: number; far: number };
}) => {
  const { neck, hip, head } = pose;
  const v = { x: hip.x - neck.x, y: hip.y - neck.y };
  const length = Math.hypot(v.x, v.y);
  const n = { x: -v.y / length, y: v.x / length };
  const b = (t: number, width: number) =>
    `${neck.x + v.x * t + n.x * width} ${neck.y + v.y * t + n.y * width}`;
  const body = `M ${neck.x} ${neck.y} C ${b(0.18, 28)} ${b(0.78, 18)} ${hip.x} ${hip.y} C ${b(0.82, -12)} ${b(0.3, -15)} ${neck.x} ${neck.y} Z`;
  const gaze = Math.max(-15, Math.min(15, (pose.gaze.x - head.x) / 25));
  const eyeY = Math.max(-7, Math.min(7, (pose.gaze.y - head.y) / 45));
  const laugh = Math.max(
    0,
    Math.min(1, pose.laughAmount ?? (pose.expression === "laugh" ? 1 : 0)),
  );
  return (
    <g
      data-character="ink-colleague"
      fill="none"
      stroke={inkColors.ink}
      strokeWidth={6.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {farArm && <InkArm pose={pose} side="far" />}
      <path d={limb(hip, pose.farKnee, pose.farAnkle)} />
      <path d={limb(hip, pose.nearKnee, pose.nearAnkle)} />
      <Shoe ankle={pose.farAnkle} angle={footAngles?.far} />
      <Shoe ankle={pose.nearAnkle} angle={footAngles?.near} />
      {badge ? (
        <path d={body} fill={inkColors.paper} strokeWidth={5.7} />
      ) : (
        <path d={`M ${neck.x} ${neck.y} Q ${b(0.55, -8)} ${hip.x} ${hip.y}`} />
      )}
      {badge && (
        <circle
          cx={neck.x + v.x * 0.25 + n.x * 4}
          cy={neck.y + v.y * 0.25 + n.y * 4}
          r={13}
          fill={inkColors.blue}
          stroke="none"
        />
      )}
      <path d={`M ${neck.x} ${neck.y + 2} L ${head.x} ${head.y + 60}`} />
      <g transform={`translate(${head.x} ${head.y}) rotate(${pose.headTilt})`}>
        <path
          d="M 4 -87 C 54 -89 91 -52 88 1 C 87 52 51 88 -3 88 C -56 88 -91 50 -88 -3 C -86 -54 -47 -89 4 -87 Z"
          fill={inkColors.paper}
          strokeWidth={5.5}
        />
        <g fill={inkColors.ink} stroke="none">
          <ellipse cx={-25 + gaze} cy={eyeY} rx={5.5} ry={8 - laugh * 4} />
          <ellipse cx={24 + gaze} cy={eyeY - 2} rx={5.5} ry={8 - laugh * 4} />
        </g>
        {pose.expression === "concern" || pose.expression === "surprise" ? (
          <>
            <g data-eyebrows="pair" strokeWidth={3.8}>
              <path data-eyebrow="left" d="M -43 -29 Q -27 -17 -17 -35" />
              <path data-eyebrow="right" d="M 16 -36 Q 31 -48 43 -28" />
            </g>
            {pose.expression === "surprise" ? (
              <ellipse
                cx={8}
                cy={37}
                rx={8}
                ry={12}
                fill={inkColors.ink}
                stroke="none"
              />
            ) : (
              <path d="M -8 39 Q 8 30 23 36" strokeWidth={4.2} />
            )}
          </>
        ) : (
          <>
            <g data-eyebrows="pair" strokeWidth={3.8}>
              <path data-eyebrow="left" d="M -43 -30 Q -30 -41 -17 -31" />
              <path data-eyebrow="right" d="M 15 -32 Q 30 -43 42 -29" />
            </g>
            <path
              d={`M -12 34 Q 8 53 31 31 Q ${8 + laugh * 8} ${53 + laugh * 46} -12 34 Z`}
              fill={inkColors.ink}
              strokeWidth={4.2}
            />
          </>
        )}
      </g>
      {nearArm && <InkArm pose={pose} side="near" />}
    </g>
  );
};

export const InkCharacterSheet = () => (
  <svg
    viewBox="0 0 1920 1080"
    width="100%"
    height="100%"
    role="img"
    aria-label="Eight authored poses of the approved ink character"
  >
    <rect width={1920} height={1080} fill={inkColors.paper} />
    <text x={80} y={76} fill={inkColors.ink} fontFamily="Arial" fontSize={28}>
      INK CHARACTER / DRAWN POSES
    </text>
    {Object.entries(inkPoses).map(([name, pose], i) => (
      <g
        key={name}
        transform={`translate(${260 + (i % 4) * 460} ${360 + Math.floor(i / 4) * 450})`}
      >
        <g transform="scale(.62)">
          <InkCharacter pose={pose} />
        </g>
        <text
          x={0}
          y={179}
          textAnchor="middle"
          fill={inkColors.ink}
          fontFamily="Arial"
          fontSize={19}
        >
          {name.toUpperCase()}
        </text>
      </g>
    ))}
  </svg>
);
