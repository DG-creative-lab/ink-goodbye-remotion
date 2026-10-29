import { Series, useVideoConfig } from "remotion";
import { InkLoad } from "./scenes/InkLoad";
import { InkHelp } from "./scenes/InkHelp";
import { InkMake } from "./scenes/InkMake";
import { InkLaugh } from "./scenes/InkLaugh";
import { InkGoodbye } from "./scenes/InkGoodbye";
import { InkNewChapter } from "./scenes/InkNewChapter";
import { type InkEndingMessage } from "./InkHeartEnding";
import { inkEndingMessage } from "./inkEnding";
import { InkMusic, inkMusicDefaults, type InkMusicProps } from "./InkMusic";
import { InkIdea, InkBegin } from "./InkIdeaStage";
export const InkGoodbyeFilm = ({
  lineOne = inkEndingMessage.lineOne,
  lineTwo = inkEndingMessage.lineTwo,
  lineThree = inkEndingMessage.lineThree,
  closing = inkEndingMessage.closing,
  signature = inkEndingMessage.signature,
  musicFile = inkMusicDefaults.musicFile,
  musicStartSeconds = inkMusicDefaults.musicStartSeconds,
  musicVolume = inkMusicDefaults.musicVolume,
}: Partial<InkEndingMessage & InkMusicProps>) => {
  const { fps } = useVideoConfig();
  return (
    <>
      <InkMusic
        musicFile={musicFile}
        musicStartSeconds={musicStartSeconds}
        musicVolume={musicVolume}
      />
      <Series>
        <Series.Sequence
          name="01 An idea we share"
          durationInFrames={4 * fps}
          premountFor={fps}
        >
          <InkIdea />
        </Series.Sequence>
        <Series.Sequence
          name="02 Let's begin"
          durationInFrames={4 * fps}
          premountFor={fps}
        >
          <InkBegin />
        </Series.Sequence>
        <Series.Sequence
          name="03 A precarious load"
          durationInFrames={4 * fps}
          premountFor={fps}
        >
          <InkLoad />
        </Series.Sequence>
        <Series.Sequence
          name="04 Someone lends a hand"
          durationInFrames={6 * fps}
          premountFor={fps}
        >
          <InkHelp />
        </Series.Sequence>
        <Series.Sequence
          name="05 Making something together"
          durationInFrames={5 * fps}
          premountFor={fps}
        >
          <InkMake />
        </Series.Sequence>
        <Series.Sequence
          name="06 A shared laugh"
          durationInFrames={5 * fps}
          premountFor={fps}
        >
          <InkLaugh />
        </Series.Sequence>
        <Series.Sequence
          name="07 Walking to the door and saying goodbye"
          durationInFrames={10 * fps}
          premountFor={fps}
        >
          <InkGoodbye />
        </Series.Sequence>
        <Series.Sequence
          name="08 A new chapter"
          durationInFrames={12 * fps}
          premountFor={fps}
        >
          <InkNewChapter
            lineOne={lineOne}
            lineTwo={lineTwo}
            lineThree={lineThree}
            closing={closing}
            signature={signature}
          />
        </Series.Sequence>
      </Series>
    </>
  );
};
