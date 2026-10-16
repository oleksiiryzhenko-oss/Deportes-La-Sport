import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { HeaderIconButton, type IconName } from '../components/ui';
import type { TabParamList } from './types';
import InicioScreen from '../screens/InicioScreen';
import EquipaScreen from '../screens/EquipaScreen';
import JogosScreen from '../screens/JogosScreen';
import EstatisticasScreen from '../screens/EstatisticasScreen';
import TaticaScreen from '../screens/TaticaScreen';

const Tab = createBottomTabNavigator<TabParamList>();

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: string; size: number }) {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  };
}

function RulesButton() {
  const navigation = useNavigation();
  return <HeaderIconButton icon="book-open-variant" onPress={() => navigation.navigate('Rules')} />;
}

function TeamSettingsButton() {
  const navigation = useNavigation();
  return <HeaderIconButton icon="cog-outline" onPress={() => navigation.navigate('TeamSettings')} />;
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.draw,
        tabBarStyle: { backgroundColor: Colors.white, borderTopColor: Colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '800', fontSize: 20 },
        headerShadowVisible: false,
        headerRightContainerStyle: { paddingRight: 16 },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={InicioScreen}
        options={{ title: 'Início', tabBarIcon: tabIcon('home-variant'), headerRight: RulesButton }}
      />
      <Tab.Screen
        name="Equipa"
        component={EquipaScreen}
        options={{ title: 'Equipa', tabBarIcon: tabIcon('tshirt-crew'), headerRight: TeamSettingsButton }}
      />
      <Tab.Screen name="Jogos" component={JogosScreen} options={{ title: 'Jogos', tabBarIcon: tabIcon('soccer') }} />
      <Tab.Screen
        name="Estatisticas"
        component={EstatisticasScreen}
        options={{ title: 'Estatísticas', tabBarIcon: tabIcon('chart-bar') }}
      />
      <Tab.Screen name="Tatica" component={TaticaScreen} options={{ title: 'Tática', tabBarIcon: tabIcon('strategy') }} />
    </Tab.Navigator>
  );
}
