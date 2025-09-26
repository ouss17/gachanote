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

export default function TabLayout() {
  const theme = useSelector((state : any) => state.theme.mode); // 'light' ou 'dark'
  const onboardingSeen = useSelector((state: any) => state.onboarding.seen);
  const dispatch = useDispatch();

  const colors = Theme[theme] || Theme.light;

  if (!onboardingSeen) {
    // Cache le menu (tabs) pendant la démo
    return <DemoScreen onFinish={() => dispatch(setOnboardingSeen())} />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          borderRadius: 20,
          marginHorizontal: 16,
          marginBottom: Platform.OS === 'ios' ? 24 : 12,
          height: 70,
          shadowColor: colors.surface,
          position: 'absolute',
        },
        tabBarIconStyle: {
          marginTop: 8,
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
        tabBarIndicatorStyle: {
          backgroundColor: colors.primary,
          height: 4,
          borderRadius: 2,
          position: 'absolute',
          bottom: 8,
          left: 32,
          right: 32,
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
