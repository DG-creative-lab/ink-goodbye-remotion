import { Audio } from "@remotion/media";
import { interpolate, staticFile, useVideoConfig } from "remotion";

// Add your own audio file under public/audio and set its path in the film props.
export const inkMusicDefaults = {
  musicFile: "",
  musicStartSeconds: 0,
  musicVolume: 0.7,
};

export type InkMusicProps = typeof inkMusicDefaults;

export const InkMusic = ({
  musicFile,
  musicStartSeconds,
  musicVolume,
}: InkMusicProps) => {
  const { fps, durationInFrames } = useVideoConfig();
  if (!musicFile.trim()) return null;

  return (
    <Audio
      name="Music"
      src={staticFile(musicFile)}
      trimBefore={Math.round(Math.max(0, musicStartSeconds) * fps)}
      durationInFrames={durationInFrames}
      premountFor={fps}
      volume={(frame) =>
        Math.min(1, Math.max(0, musicVolume)) *
        interpolate(
          frame,
          [
            0,
            0.4 * fps,
            durationInFrames - 5.2 * fps,
            durationInFrames - 3.6 * fps,
            durationInFrames - 1.2 * fps,
            durationInFrames - 1,
          ],
          [0, 1, 1, 0.8, 0.8, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      }
    />
  );
};
