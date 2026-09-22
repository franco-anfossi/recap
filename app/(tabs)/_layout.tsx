import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { colors, fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

const TABS: { name: string; title: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index', title: 'Today', icon: 'sunny-outline', iconActive: 'sunny' },
  { name: 'calendar', title: 'Calendar', icon: 'calendar-outline', iconActive: 'calendar' },
  { name: 'stats', title: 'Insights', icon: 'stats-chart-outline', iconActive: 'stats-chart' },
  { name: 'social', title: 'Friends', icon: 'people-outline', iconActive: 'people' },
  { name: 'profile', title: 'You', icon: 'person-circle-outline', iconActive: 'person-circle' },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarButton: HapticTab,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? tab.iconActive : tab.icon} size={24} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: Platform.OS === 'ios' ? 86 : 68,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 26 : 10,
  },
  item: {
    gap: 2,
  },
  label: {
    fontFamily: fonts.sansSemibold,
    fontSize: 11,
  },
});
