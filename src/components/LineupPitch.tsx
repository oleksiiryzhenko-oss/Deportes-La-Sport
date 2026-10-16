import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { slotRole, type Formation, type Position } from '../constants/football';
import type { Player } from '../db/types';
import { shortName } from '../lib/format';
import { Jersey } from './Jersey';
import { PITCH_ASPECT, PitchBackground, pitchPoint } from './Pitch';

interface Props {
  formation: Formation;
  lineup: Record<number, Player | undefined>;
  kitColor: string;
  /** Passing this makes the pitch interactive (tap a slot, drag a player onto another slot to swap). */
  onSlotPress?: (slot: number) => void;
  onSwap?: (from: number, to: number) => void;
  onDragActive?: (active: boolean) => void;
}

export function LineupPitch({ formation, lineup, kitColor, onSlotPress, onSwap, onDragActive }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const interactive = !!onSlotPress;
  const tokenSize = Math.max(30, size.width * 0.12);
  const points = formation.slots.map((s) => pitchPoint(s, size.width, size.height));

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const handleDrop = (from: number, dx: number, dy: number) => {
    const x = points[from].x + dx;
    const y = points[from].y + dy;
    let best = -1;
    let bestDistance = Infinity;
    points.forEach((p, i) => {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    });
    if (best !== -1 && best !== from && bestDistance < tokenSize * 1.3) onSwap?.(from, best);
  };

  return (
    <View style={[styles.container, { pointerEvents: interactive ? 'auto' : 'none' }]} onLayout={onLayout}>
      {size.width > 0 && (
        <>
          <PitchBackground width={size.width} height={size.height} />
          {points.map((point, slot) => (
            <PitchToken
              key={`${formation.id}-${slot}`}
              x={point.x}
              y={point.y}
              size={tokenSize}
              player={lineup[slot]}
              role={slotRole(formation.slots[slot], slot)}
              kitColor={kitColor}
              interactive={interactive}
              onPress={() => onSlotPress?.(slot)}
              onDrop={(dx, dy) => handleDrop(slot, dx, dy)}
              onDragActive={onDragActive}
            />
          ))}
        </>
      )}
    </View>
  );
}

interface TokenProps {
  x: number;
  y: number;
  size: number;
  player: Player | undefined;
  role: Position;
  kitColor: string;
  interactive: boolean;
  onPress: () => void;
  onDrop: (dx: number, dy: number) => void;
  onDragActive?: (active: boolean) => void;
}

const DRAG_THRESHOLD = 6;

function PitchToken({ x, y, size, player, role, kitColor, interactive, onPress, onDrop, onDragActive }: TokenProps) {
  const [pan] = useState(() => new Animated.ValueXY());
  const [dragging, setDragging] = useState(false);

  // The responder must survive re-renders mid-gesture, so it is created once and reads the latest callbacks through a ref.
  const latest = useRef({ onPress, onDrop, onDragActive, canDrag: !!player });
  useEffect(() => {
    latest.current = { onPress, onDrop, onDragActive, canDrag: !!player };
  });

  // eslint-disable-next-line react-hooks/refs -- the ref is only read inside touch handlers, never during render
  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => latest.current.onDragActive?.(true),
      onPanResponderMove: (_, g) => {
        if (!latest.current.canDrag) return;
        if (Math.abs(g.dx) > DRAG_THRESHOLD || Math.abs(g.dy) > DRAG_THRESHOLD) setDragging(true);
        pan.setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: (_, g) => {
        const moved = Math.abs(g.dx) > DRAG_THRESHOLD || Math.abs(g.dy) > DRAG_THRESHOLD;
        pan.setValue({ x: 0, y: 0 });
        setDragging(false);
        latest.current.onDragActive?.(false);
        if (!moved) latest.current.onPress();
        else if (latest.current.canDrag) latest.current.onDrop(g.dx, g.dy);
      },
      onPanResponderTerminate: () => {
        pan.setValue({ x: 0, y: 0 });
        setDragging(false);
        latest.current.onDragActive?.(false);
      },
    })
  );

  const width = size * 2.2;

  return (
    <Animated.View
      {...(interactive ? responder.panHandlers : {})}
      style={[
        styles.token,
        {
          left: x - width / 2,
          top: y - size / 2,
          width,
          zIndex: dragging ? 10 : 1,
          transform: pan.getTranslateTransform(),
        },
      ]}
    >
      <View style={[styles.tokenIcon, { height: size }, dragging && styles.dragging]}>
        {player ? (
          <Jersey color={kitColor} number={player.number} size={size} />
        ) : (
          <View style={[styles.emptySlot, { width: size * 0.82, height: size * 0.82, borderRadius: size }]}>
            <MaterialCommunityIcons name="plus" size={size * 0.42} color={Colors.white} />
          </View>
        )}
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {player ? shortName(player.name) : role}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: PITCH_ASPECT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.pitchDark,
  },
  token: {
    position: 'absolute',
    alignItems: 'center',
  },
  tokenIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragging: {
    transform: [{ scale: 1.15 }],
  },
  emptySlot: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.35)',
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
    maxWidth: '100%',
  },
});
