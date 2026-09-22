import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { colors, fonts } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

// `title` is an i18n key; resolved at render time so it follows the active locale.
const TABS: { name: string; title: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index', title: 'common.tabs.today', icon: 'sunny-outline', iconActive: 'sunny' },
  { name: 'calendar', title: 'common.tabs.calendar', icon: 'calendar-outline', iconActive: 'calendar' },
  { name: 'stats', title: 'common.tabs.insights', icon: 'stats-chart-outline', iconActive: 'stats-chart' },
  { name: 'social', title: 'common.tabs.friends', icon: 'people-outline', iconActive: 'people' },
  { name: 'profile', title: 'common.tabs.you', icon: 'person-circle-outline', iconActive: 'person-circle' },
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
            title: t(tab.title),
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
