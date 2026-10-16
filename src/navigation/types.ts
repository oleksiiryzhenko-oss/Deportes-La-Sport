import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type TabParamList = {
  Inicio: undefined;
  Equipa: undefined;
  Jogos: undefined;
  Estatisticas: undefined;
  Tatica: undefined;
};

export type RootStackParamList = {
  Preview: undefined;
  Tabs: NavigatorScreenParams<TabParamList>;
  Player: { id: number };
  PlayerForm: { id?: number } | undefined;
  TeamSettings: undefined;
  Match: { id: number };
  MatchForm: { id?: number } | undefined;
  Rules: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
