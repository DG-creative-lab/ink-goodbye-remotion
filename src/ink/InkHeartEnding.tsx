import { useEffect, useState } from "react";
import {
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
} from "remotion";
import { inkColors } from "./InkCharacter";
import { inkEndingMessage, inkEndingState } from "./inkEnding";

export type InkEndingMessage = typeof inkEndingMessage;

export const InkHeartEnding = ({
  time,
  message = inkEndingMessage,
}: {
  time: number;
  message?: InkEndingMessage;
}) => {
  const [fontHandle] = useState(() =>
    delayRender("Loading the handwritten goodbye"),
  );
  useEffect(() => {
    const font = new FontFace(
      "InkCaveat",
      `url(${staticFile("fonts/caveat/Caveat.ttf")})`,
      { weight: "400 700" },
    );
    font
      .load()
      .then((loaded) => {
        document.fonts.add(loaded);
        continueRender(fontHandle);
      })
      .catch(cancelRender);
  }, [fontHandle]);
  const s = inkEndingState(time);
  return (
    <g
      data-ending="heart-card"
      aria-label={`${message.lineOne} ${message.lineTwo} ${message.lineThree} ${message.closing} ${message.signature}`}
    >
      {s.appear > 0 ? (
        <g transform={`translate(${s.x} ${s.y}) rotate(${s.rotation})`}>
          <path
            data-ending-heart="red"
            transform={`scale(${s.scale * s.scaleX} ${s.scale * s.scaleY})`}
            d="M 0 -8 C -22 -34 -48 -7 -31 14 L 0 42 L 31 14 C 48 -7 22 -34 0 -8 Z"
            fill="#e54838"
            stroke={inkColors.ink}
            strokeWidth={4.8 + 1.2 * s.flight}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
        </g>
      ) : null}
      <g
        fill={inkColors.paper}
        fontFamily="InkCaveat"
        fontWeight={600}
        textAnchor="middle"
      >
        <text
          data-goodbye-line="one"
          x={960}
          y={405 + 7 * (1 - s.lineOne)}
          fontSize={60}
          opacity={s.lineOne}
        >
          {message.lineOne}
        </text>
        <text
          data-goodbye-line="two"
          x={960}
          y={480 + 7 * (1 - s.lineTwo)}
          fontSize={60}
          opacity={s.lineTwo}
        >
          {message.lineTwo}
        </text>
        <text
          data-goodbye-line="three"
          x={960}
          y={555 + 7 * (1 - s.lineThree)}
          fontSize={60}
          opacity={s.lineThree}
        >
          {message.lineThree}
        </text>
        <text
          data-goodbye-line="closing"
          x={960}
          y={665 + 7 * (1 - s.closing)}
          fontSize={92}
          opacity={s.closing}
        >
          {message.closing}
        </text>
        <path
          d="M 867 697 Q 955 708 1053 694"
          fill="none"
          stroke={inkColors.paper}
          strokeWidth={3.5}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - s.underline}
          opacity={s.underline}
        />
        <text
          data-goodbye-line="signature"
          x={960}
          y={775 + 3 * (1 - s.signature)}
          fontSize={46}
          fontWeight={500}
          opacity={s.signature}
        >
          {message.signature}
        </text>
      </g>
    </g>
  );
};
