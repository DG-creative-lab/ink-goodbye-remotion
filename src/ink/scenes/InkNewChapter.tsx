import { useCurrentFrame, useVideoConfig } from "remotion";
import { InkDepartureStage } from "../InkDepartureStage";
import { InkHeartEnding, type InkEndingMessage } from "../InkHeartEnding";
import { inkEndingMessage, inkEndingState } from "../inkEnding";

export const InkNewChapter = ({
  lineOne = inkEndingMessage.lineOne,
  lineTwo = inkEndingMessage.lineTwo,
  lineThree = inkEndingMessage.lineThree,
  closing = inkEndingMessage.closing,
  signature = inkEndingMessage.signature,
}: Partial<InkEndingMessage>) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <InkDepartureStage
      time={10 + t}
      sceneOpacity={inkEndingState(t).sceneOpacity}
      label="She leaves through the door; the red heart takes two little beats, floats into a thank-you card and carries the helping hands and shared laughs into the next chapter"
    >
      <InkHeartEnding
        time={t}
        message={{ lineOne, lineTwo, lineThree, closing, signature }}
      />
    </InkDepartureStage>
  );
};
