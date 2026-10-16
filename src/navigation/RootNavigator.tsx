import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import type { RootStackParamList } from './types';
import TabNavigator from './TabNavigator';
import PreviewScreen from '../screens/PreviewScreen';
import PlayerScreen from '../screens/PlayerScreen';
import PlayerFormScreen from '../screens/PlayerFormScreen';
import TeamSettingsScreen from '../screens/TeamSettingsScreen';
import MatchScreen from '../screens/MatchScreen';
import MatchFormScreen from '../screens/MatchFormScreen';
import RegrasScreen from '../screens/RegrasScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Preview"
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Preview" component={PreviewScreen} options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="Player" component={PlayerScreen} options={{ title: 'Jogador' }} />
      <Stack.Screen name="Match" component={MatchScreen} options={{ title: 'Jogo' }} />
      <Stack.Screen name="Rules" component={RegrasScreen} options={{ title: 'Regras do jogo' }} />
      <Stack.Group screenOptions={{ animation: 'slide_from_bottom' }}>
        <Stack.Screen name="PlayerForm" component={PlayerFormScreen} options={{ title: 'Jogador' }} />
        <Stack.Screen name="MatchForm" component={MatchFormScreen} options={{ title: 'Jogo' }} />
        <Stack.Screen name="TeamSettings" component={TeamSettingsScreen} options={{ title: 'A minha equipa' }} />
      </Stack.Group>
    </Stack.Navigator>
  );
}
