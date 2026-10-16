import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import { Colors } from '../constants/colors';
import type { SlotPoint } from '../constants/football';

// The SVG is drawn in meters: a 68 × 105 m field with a 2 m grass margin on each side.
const MARGIN = 2;
const FIELD_W = 68;
const FIELD_H = 105;
const VIEW_W = FIELD_W + MARGIN * 2;
const VIEW_H = FIELD_H + MARGIN * 2;

export const PITCH_ASPECT = VIEW_W / VIEW_H;

export function pitchPoint(slot: SlotPoint, width: number, height: number) {
  return {
    x: ((MARGIN + slot.x * FIELD_W) / VIEW_W) * width,
    y: ((MARGIN + slot.y * FIELD_H) / VIEW_H) * height,
  };
}

const STRIPES = Array.from({ length: 10 }, (_, i) => i);

export function PitchBackground({ width, height }: { width: number; height: number }) {
  const line = { stroke: Colors.pitchLine, strokeWidth: 0.35, fill: 'none' };
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
      <Rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill={Colors.pitchDark} />
      <G transform={`translate(${MARGIN} ${MARGIN})`}>
        {STRIPES.filter((i) => i % 2 === 1).map((i) => (
          <Rect key={i} x={0} y={i * 10.5} width={FIELD_W} height={10.5} fill={Colors.pitchLight} />
        ))}

        <Rect x={0} y={0} width={FIELD_W} height={FIELD_H} {...line} />
        <Line x1={0} y1={52.5} x2={FIELD_W} y2={52.5} {...line} />
        <Circle cx={34} cy={52.5} r={9.15} {...line} />
        <Circle cx={34} cy={52.5} r={0.5} fill={Colors.pitchLine} />

        {/* Opponent end */}
        <Rect x={13.84} y={0} width={40.32} height={16.5} {...line} />
        <Rect x={24.84} y={0} width={18.32} height={5.5} {...line} />
        <Circle cx={34} cy={11} r={0.5} fill={Colors.pitchLine} />
        <Path d="M 26.69 16.5 A 9.15 9.15 0 0 0 41.31 16.5" {...line} />
        <Rect x={30.34} y={-1.6} width={7.32} height={1.6} {...line} fill={Colors.onPrimarySoft} />

        {/* Own end */}
        <Rect x={13.84} y={88.5} width={40.32} height={16.5} {...line} />
        <Rect x={24.84} y={99.5} width={18.32} height={5.5} {...line} />
        <Circle cx={34} cy={94} r={0.5} fill={Colors.pitchLine} />
        <Path d="M 26.69 88.5 A 9.15 9.15 0 0 1 41.31 88.5" {...line} />
        <Rect x={30.34} y={FIELD_H} width={7.32} height={1.6} {...line} fill={Colors.onPrimarySoft} />

        {/* Corner arcs */}
        <Path d="M 1 0 A 1 1 0 0 1 0 1" {...line} />
        <Path d="M 67 0 A 1 1 0 0 0 68 1" {...line} />
        <Path d="M 0 104 A 1 1 0 0 1 1 105" {...line} />
        <Path d="M 67 105 A 1 1 0 0 1 68 104" {...line} />
      </G>
    </Svg>
  );
}
