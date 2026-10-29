import { useCurrentFrame, useVideoConfig } from "remotion";
import { InkDepartureStage } from "../InkDepartureStage";
export const InkGoodbye = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <InkDepartureStage
      time={frame / fps}
      label="She walks from the finished stack towards the door, then looks back and waves"
    />
  );
};
