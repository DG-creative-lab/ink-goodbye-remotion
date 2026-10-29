import { useCurrentFrame, useVideoConfig } from "remotion";
import { InkDepartureStage } from "../InkDepartureStage";
export const InkLaugh = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <InkDepartureStage
      time={frame / fps - 5}
      label="The colleagues share a quiet laugh beside their finished stack"
    />
  );
};
