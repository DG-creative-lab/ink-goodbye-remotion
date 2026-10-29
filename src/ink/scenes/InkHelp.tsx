import { Freeze, useCurrentFrame, useVideoConfig } from "remotion";
import { InkHelpingAction } from "../InkHelpingStudy";
export const InkHelp = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Freeze frame={28 + Math.round((frame / fps / 6) * 115)}>
      <InkHelpingAction
        name="Catch and shared glance"
        wobbleStrength={1}
        premountFor={fps}
      />
    </Freeze>
  );
};
