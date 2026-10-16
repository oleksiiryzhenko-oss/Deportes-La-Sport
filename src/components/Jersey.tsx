import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { Colors } from '../constants/colors';
import { isLightColor } from '../lib/color';

const SHIRT = 'M30 10 L42 5 Q50 14 58 5 L70 10 L95 27 L85 45 L74 38 L74 95 L26 95 L26 38 L15 45 L5 27 Z';

export function Jersey({ color, number, size = 40 }: { color: string; number?: number | null; size?: number }) {
  const light = isLightColor(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d={SHIRT}
        fill={color}
        stroke={light ? 'rgba(4,52,148,0.35)' : 'rgba(255,255,255,0.9)'}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      {number != null && (
        <SvgText
          x={50}
          y={72}
          fontSize={number >= 10 ? 32 : 38}
          fontWeight="800"
          fill={light ? Colors.primary : Colors.white}
          textAnchor="middle"
        >
          {number}
        </SvgText>
      )}
    </Svg>
  );
}
