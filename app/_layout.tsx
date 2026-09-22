import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import {
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts,
} from '@expo-google-fonts/dm-sans';

import { colors } from '@/constants/theme';
import { useAuthStore, useOnboardingStore } from '@/stores';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: true, duration: 300 });

export const unstable_settings = {
  initialRouteName: '(auth)',
};

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.brand,
    background: colors.background,
    card: colors.background,
    text: colors.ink,
    border: colors.border,
    notification: colors.brand,
  },
};

export default function RootLayout() {
  const segments = useSegments();
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);
  const splashHidden = useRef(false);
  const { hasHydrated, hasSeenWelcome, pendingSetupUserId, completedSetup } = useOnboardingStore();

  const [fontsLoaded] = useFonts({
    Fraunces_500Medium_Italic,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    checkAuth().finally(() => setAuthChecked(true));
  }, [checkAuth]);

  // Only the initial session check gates rendering. The auth store's isLoading also flips
  // during sign-in/sign-out, and unmounting the navigator then would reset navigation.
  const ready = fontsLoaded && hasHydrated && authChecked;

  useEffect(() => {
    if (!ready) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inSetup = segments[0] === 'setup';
    const needsSetup =
      !!user && pendingSetupUserId === user.id && !completedSetup[user.id];

    if (!isAuthenticated) {
      if (!inAuthGroup) {
        router.replace(hasSeenWelcome ? '/(auth)/login' : '/(auth)/welcome');
      }
    } else if (needsSetup) {
      if (!inSetup) router.replace('/setup');
    } else if (inAuthGroup || inSetup) {
      router.replace('/(tabs)');
    }

    if (!splashHidden.current) {
      splashHidden.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready, isAuthenticated, user, pendingSetupUserId, completedSetup, hasSeenWelcome, segments]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navigationTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="setup" options={{ gestureEnabled: false }} />
          <Stack.Screen name="entry/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="entry/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="summary/[year]" options={{ presentation: 'modal' }} />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
