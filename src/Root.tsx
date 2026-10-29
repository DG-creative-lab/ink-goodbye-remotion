import { Composition, Folder, Still } from "remotion";
import { InkHelpingStudy } from "./ink/InkHelpingStudy";
import { InkCharacterSheet } from "./ink/InkCharacter";
import { InkGoodbyeFilm } from "./ink/InkGoodbyeFilm";
import { InkLoad } from "./ink/scenes/InkLoad";
import { InkHelp } from "./ink/scenes/InkHelp";
import { InkMake } from "./ink/scenes/InkMake";
import { InkLaugh } from "./ink/scenes/InkLaugh";
import { InkGoodbye } from "./ink/scenes/InkGoodbye";
import { InkNewChapter } from "./ink/scenes/InkNewChapter";
import { InkIdea, InkBegin } from "./ink/InkIdeaStage";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Ink-Goodbye">
        <Composition
          id="Ink-Goodbye-Film"
          component={InkGoodbyeFilm}
          defaultProps={{
            lineOne: "For the ideas we shared.",
            lineTwo: "The things we built.",
            lineThree: "And the laughs along the way.",
            closing: "Thank you.",
            signature: "Your name",
            musicFile: "",
            musicStartSeconds: 0,
            musicVolume: 0.7,
          }}
          width={1920}
          height={1080}
          fps={24}
          durationInFrames={1200}
        />
        <Folder name="Ink-Scenes">
          <Composition
            id="Ink-00-Idea"
            component={InkIdea}
            width={1920}
            height={1080}
            fps={24}
            durationInFrames={96}
          />
          <Composition
            id="Ink-00-Begin"
            component={InkBegin}
            width={1920}
            height={1080}
            fps={24}
            durationInFrames={96}
          />
          <Composition
            id="Ink-01-Load"
            component={InkLoad}
            width={1920}
            height={1080}
            fps={24}
            durationInFrames={96}
          />
          <Composition
            id="Ink-02-Helping"
            component={InkHelp}
            width={1920}
            height={1080}
            fps={24}
            durationInFrames={144}
          />
          <Composition
            id="Ink-03-Making"
            component={InkMake}
            width={1920}
            height={1080}
            fps={24}
            durationInFrames={120}
          />
          <Composition
            id="Ink-04-Laugh"
            component={InkLaugh}
            width={1920}
            height={1080}
            fps={24}
            durationInFrames={120}
          />
          <Composition
            id="Ink-05-Goodbye"
            component={InkGoodbye}
            width={1920}
            height={1080}
            fps={24}
            durationInFrames={240}
          />
          <Composition
            id="Ink-06-New-Chapter"
            component={InkNewChapter}
            defaultProps={{
              lineOne: "For the ideas we shared.",
              lineTwo: "The things we built.",
              lineThree: "And the laughs along the way.",
              closing: "Thank you.",
              signature: "Your name",
            }}
            width={1920}
            height={1080}
            fps={24}
            durationInFrames={288}
          />
        </Folder>
        <Composition
          id="Ink-Helping-Study"
          component={InkHelpingStudy}
          width={1920}
          height={1080}
          fps={24}
          durationInFrames={144}
        />
        <Still
          id="Ink-Character-Sheet"
          component={InkCharacterSheet}
          width={1920}
          height={1080}
        />
      </Folder>
    </>
  );
};
