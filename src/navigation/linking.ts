import type { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import type { RootStackParamList } from './types';

// deporteslasport://jogo/12, deporteslasport://jogador/3, deporteslasport://tatica ...
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Tabs: {
        screens: {
          Inicio: '',
          Equipa: 'equipa',
          Jogos: 'jogos',
          Estatisticas: 'estatisticas',
          Tatica: 'tatica',
        },
      },
      Player: { path: 'jogador/:id', parse: { id: Number } },
      Match: { path: 'jogo/:id', parse: { id: Number } },
      PlayerForm: 'equipa/novo-jogador',
      MatchForm: 'jogos/novo',
      TeamSettings: 'equipa/definicoes',
      Rules: 'regras',
    },
  },
};
