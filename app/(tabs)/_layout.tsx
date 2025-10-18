import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Theme } from '@/constants/Themes';
import { setOnboardingSeen } from '@/redux/slices/onboardingSlice';
import { useDispatch } from 'react-redux';
import DemoScreen from '../DemoScreen';

type ThemeMode = 'light' | 'dark' | 'night';

export default function TabLayout() {
  const theme = useSelector((state: any) => state.theme.mode) as ThemeMode;
  const onboardingSeen = useSelector((state: any) => state.onboarding.seen);
  const dispatch = useDispatch();

  const colors = Theme[theme] || Theme.light;

  if (!onboardingSeen) {
    return <DemoScreen onFinish={() => dispatch(setOnboardingSeen())} />;
  }

  return (
    <View accessible={true} accessibilityLabel="Gachanote tabs" style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.card, // adapte le fond du menu au thème
            borderTopColor: colors.border, // adapte la bordure au thème
          },
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarIconStyle: {
            marginBottom: 2,
            alignItems: 'center',
            justifyContent: 'center',
          },
          tabBarLabelStyle: {
            fontWeight: '700',
            fontSize: 13,
            letterSpacing: 1,
            marginBottom: 8,
            color: colors.text, // adapte la couleur du texte au thème
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarAccessibilityLabel: 'Home tab',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="statistiques"
          options={{
            title: 'Statistiques',
            tabBarAccessibilityLabel: 'Statistiques tab',
            tabBarIcon: ({ color }) => <MaterialIcons name="bar-chart" size={28} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Paramètres',
            tabBarAccessibilityLabel: 'Paramètres tab',
            tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={28} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
