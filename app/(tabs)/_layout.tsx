import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { setOnboardingSeen } from '@/redux/slices/onboardingSlice';
import { useDispatch } from 'react-redux';
import DemoScreen from '../DemoScreen';
import { Theme } from '@/constants/Themes';

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
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
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
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="statistiques"
        options={{
          title: 'Statistiques',
          tabBarIcon: ({ color }) => <MaterialIcons name="bar-chart" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
