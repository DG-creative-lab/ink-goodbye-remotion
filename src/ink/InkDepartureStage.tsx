import { useId, type ReactNode } from "react";
import { InkCharacter, inkColors } from "./InkCharacter";
import { GroundBlocks, InkDoor, InkStage } from "./InkStage";
import {
  inkJourneyState,
  journeyCameraTravel,
  journeyDoorJamb,
} from "./inkJourney";
import { inkVisitorsState } from "./inkVisitors";
import { InkFloor } from "./InkFloor";

export const InkDepartureStage = ({
  time,
  label,
  children,
  sceneOpacity = 1,
}: {
  time: number;
  label: string;
  children?: ReactNode;
  sceneOpacity?: number;
}) => {
  const s = inkJourneyState(time);
  const visitors = inkVisitorsState(time);
  const id = useId().replace(/[^a-z0-9]/gi, "");
  return (
    <InkStage label={label} ground={false}>
      <defs>
        <clipPath id={`journey-jamb-${id}`}>
          <rect
            x={-1000}
            y={-200}
            width={journeyDoorJamb + 998}
            height={1500}
          />
        </clipPath>
        <filter
          id={`journey-occlusion-${id}`}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feMorphology
            in="SourceAlpha"
            operator="dilate"
            radius={s.keyline}
            result="spread"
          />
          <feFlood floodColor="black" />
          <feComposite in2="spread" operator="in" />
        </filter>
        <mask
          id={`journey-overlap-${id}`}
          maskUnits="userSpaceOnUse"
          x={-1000}
          y={-200}
          width={4500}
          height={1600}
        >
          <rect x={-1000} y={-200} width={4500} height={1600} fill="white" />
          <use
            href={`#journey-main-${id}`}
            filter={`url(#journey-occlusion-${id})`}
          />
        </mask>
      </defs>
      <g
        transform={`translate(${-s.camera} ${-s.cameraY})`}
        opacity={sceneOpacity === 1 ? undefined : sceneOpacity}
      >
        <InkFloor id={id} time={time} journey={s} visitors={visitors} />
        <g mask={s.keyline > 0 ? `url(#journey-overlap-${id})` : undefined}>
          <GroundBlocks />
          <g transform={`translate(${journeyCameraTravel} 0)`}>
            <InkDoor floorY={1075} />
          </g>
          <g transform={`translate(${s.helperRoot.x} ${s.helperRoot.y})`}>
            <InkCharacter pose={s.helper} badge={false} />
          </g>
          {visitors.map((visitor) => (
            <g
              key={visitor.id}
              data-colleague={visitor.id}
              transform={`translate(${visitor.root.x} ${visitor.root.y}) scale(${visitor.mirror * visitor.scale} ${visitor.scale})`}
            >
              <InkCharacter
                pose={visitor.pose}
                badge={false}
                footAngles={visitor.footAngles}
              />
            </g>
          ))}
        </g>
        <g clipPath={`url(#journey-jamb-${id})`}>
          <g
            id={`journey-main-${id}`}
            transform={`translate(${s.mainRoot.x} ${s.mainRoot.y})`}
          >
            <InkCharacter pose={s.main} footAngles={s.footAngles} />
          </g>
        </g>
        <path
          d={`M ${journeyDoorJamb} 240 L ${journeyDoorJamb} 1075`}
          fill="none"
          stroke={inkColors.ink}
          strokeWidth={4.3}
        />
      </g>
      {children}
    </InkStage>
  );
};
