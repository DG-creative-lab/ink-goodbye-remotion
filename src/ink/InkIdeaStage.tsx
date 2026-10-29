import { useCurrentFrame, useVideoConfig } from "remotion";
import { InkArm, InkCharacter, inkColors, type InkPoint } from "./InkCharacter";
import { InkStack, InkStage } from "./InkStage";
import { ideaStrokes, inkIdeaState } from "./inkIdea";

const Pencil = ({ tip, direction }: { tip: InkPoint; direction: number }) => (
  <path
    d={`M ${tip.x} ${tip.y} L ${tip.x + direction * 24} ${tip.y - 58}`}
    fill="none"
    stroke={inkColors.ink}
    strokeWidth={5}
    strokeLinecap="round"
  />
);

export const InkIdeaStage = ({ time }: { time: number }) => {
  const s = inkIdeaState(time);
  return (
    <InkStage label="They take turns sketching an idea, share a glance, and lift the real blocks to begin">
      <g transform={`translate(${s.mainRoot.x} ${s.mainRoot.y})`}>
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
      <g data-idea="shared-plan" opacity={s.paperOpacity}>
        <path
          d="M 868 467 L 1122 471 L 1115 691 L 864 686 Z"
          fill={inkColors.paper}
          stroke={inkColors.ink}
          strokeWidth={3.6}
          strokeLinejoin="round"
        />
        {ideaStrokes.map((stroke, i) => (
          <path
            key={i}
            data-plan-stroke={i}
            d={stroke.points
              .map((p, j) => `${j ? "L" : "M"} ${p.x} ${p.y}`)
              .join(" ")}
            fill={
              i === 1 ? inkColors.blue : i === 2 ? inkColors.yellow : "none"
            }
            fillOpacity={s.strokes[i] === 1 ? 0.3 : 0}
            stroke={inkColors.ink}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - s.strokes[i]}
            opacity={s.strokes[i] > 0 ? 1 : 0}
          />
        ))}
      </g>
      <g opacity={s.blocksOpacity}>
        <InkStack offset={s.offset} />
      </g>
      <g opacity={s.pencilOpacity}>
        <Pencil tip={s.mainTip} direction={-1} />
        <Pencil tip={s.helperTip} direction={1} />
      </g>
      <g transform={`translate(${s.mainRoot.x} ${s.mainRoot.y})`}>
        <InkArm pose={s.main} side="near" />
      </g>
      <g transform={`translate(${s.helperRoot.x} ${s.helperRoot.y})`}>
        <InkArm pose={s.helper} side="far" />
        <InkArm pose={s.helper} side="near" />
      </g>
    </InkStage>
  );
};

export const InkIdea = () => {
  const frame = useCurrentFrame(),
    { fps } = useVideoConfig();
  return <InkIdeaStage time={frame / fps} />;
};

export const InkBegin = () => {
  const frame = useCurrentFrame(),
    { fps } = useVideoConfig();
  return <InkIdeaStage time={4 + frame / fps} />;
};
