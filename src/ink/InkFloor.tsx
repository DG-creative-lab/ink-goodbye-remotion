import { InkGround } from "./InkStage";
import { inkColors, type InkPoint } from "./InkCharacter";
import { inkSoftRamp } from "./inkActing";
import { journeyFloor, type inkJourneyState } from "./inkJourney";
import { type inkVisitorsState } from "./inkVisitors";

export const InkFloor = ({
  id,
  time,
  journey,
  visitors,
}: {
  id: string;
  time: number;
  journey: ReturnType<typeof inkJourneyState>;
  visitors: ReturnType<typeof inkVisitorsState>;
}) => {
  const reveal = inkSoftRamp(time, 0.1, 1);
  const helperFeet = Object.fromEntries(
    (["near", "far"] as const).map((side) => [
      side,
      {
        x: journey.helperRoot.x + journey.helper[`${side}Ankle`].x,
        y: journey.helperRoot.y + journey.helper[`${side}Ankle`].y,
      },
    ]),
  ) as Record<"near" | "far", InkPoint>;
  const contacts = [
    {
      id: "main",
      feet: journey.feet,
      scale: 1,
      mirror: 1,
      floor: journeyFloor,
    },
    { id: "helper", feet: helperFeet, scale: 1, mirror: 1, floor: () => 915 },
    ...visitors.map((v) => ({ ...v, floor: () => v.floorY })),
  ];
  return (
    <g data-ground="shared-surface">
      <defs>
        <linearGradient
          id={`floor-wash-${id}`}
          x1="0"
          x2="0"
          y1="860"
          y2="1120"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ead8b0" stopOpacity="0" />
          <stop offset="0.3" stopColor="#ead8b0" stopOpacity="0.34" />
          <stop offset="1" stopColor="#ead8b0" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <g data-floor="continuous-plane" opacity={reveal}>
        <rect
          x={-1000}
          y={860}
          width={4500}
          height={500}
          fill={`url(#floor-wash-${id})`}
        />
        {contacts.flatMap((actor) =>
          (["near", "far"] as const).map((side) => {
            const foot = actor.feet[side];
            const floor = actor.floor(foot.x);
            const lift = Math.max(0, floor - foot.y);
            return (
              <ellipse
                key={`${actor.id}-${side}`}
                data-contact-shadow={`${actor.id}-${side}`}
                clipPath={
                  actor.id === "main" ? `url(#journey-jamb-${id})` : undefined
                }
                cx={foot.x + actor.mirror * actor.scale * 16}
                cy={floor + 14 * actor.scale}
                rx={31 * actor.scale}
                ry={3.5 * actor.scale}
                fill={inkColors.ink}
                opacity={0.16 * (1 - Math.min(1, lift / 50))}
              />
            );
          }),
        )}
      </g>
      <g data-floor="opening-baseline" opacity={1 - reveal}>
        <InkGround />
      </g>
    </g>
  );
};
