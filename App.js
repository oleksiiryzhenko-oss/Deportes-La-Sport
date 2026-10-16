import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SQLiteProvider } from 'expo-sqlite';
import RootNavigator from './src/navigation/RootNavigator';
import { Colors } from './src/constants/colors';
import { initDatabase } from './src/db/init';
import { linking } from './src/navigation/linking';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.white,
    text: Colors.text,
    border: Colors.border,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="deportes.db" onInit={initDatabase}>
        <NavigationContainer theme={theme} linking={linking}>
          <RootNavigator />
          <StatusBar style="light" />
        </NavigationContainer>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
