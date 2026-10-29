import { Freeze, useCurrentFrame, useVideoConfig } from "remotion";
import { InkHelpingAction } from "../InkHelpingStudy";
export const InkLoad = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Freeze frame={Math.round((frame / fps / 4) * 28)}>
      <InkHelpingAction
        name="A precarious load"
        wobbleStrength={1}
        premountFor={fps}
      />
    </Freeze>
  );
};
