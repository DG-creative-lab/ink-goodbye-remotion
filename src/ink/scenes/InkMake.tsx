import { useCurrentFrame, useVideoConfig } from "remotion";
import { InkArm, InkCharacter } from "../InkCharacter";
import { InkStack, InkStage } from "../InkStage";
import { inkSetDownState } from "../inkSetDown";

export const InkMake = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = inkSetDownState(frame / fps);
  return (
    <InkStage label="They adjust their grip, lower the same blocks to the ground, release and straighten up">
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
      <InkStack offset={s.offset} />
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
