import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { t } from '@/lib/i18n';

const STORAGE_KEY = 'reminder-settings';
const REMINDER_ID_KEY = 'reminder-notification-id';

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

export const DEFAULT_REMINDER: ReminderSettings = { enabled: false, hour: 21, minute: 0 };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function loadReminderSettings(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_REMINDER;
    const parsed = JSON.parse(raw) as Partial<ReminderSettings>;
    return {
      enabled: !!parsed.enabled,
      hour: typeof parsed.hour === 'number' ? parsed.hour : DEFAULT_REMINDER.hour,
      minute: typeof parsed.minute === 'number' ? parsed.minute : DEFAULT_REMINDER.minute,
    };
  } catch {
    return DEFAULT_REMINDER;
  }
}

export async function requestReminderPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// Rotating reminder copy lives in the profile dictionary (profile.notifications.messages.0..3).
const MESSAGE_COUNT = 4;

/** Persists settings and (re)schedules the daily reminder. Returns false if permission was denied. */
export async function saveReminderSettings(settings: ReminderSettings): Promise<boolean> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  await cancelReminder();

  if (!settings.enabled) return true;
  if (Platform.OS === 'web') return false;

  const granted = await requestReminderPermission();
  if (!granted) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, enabled: false }));
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: t('profile.notifications.channelName'),
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: t('profile.notifications.title'),
      body: t(`profile.notifications.messages.${new Date().getDate() % MESSAGE_COUNT}`),
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: settings.hour,
      minute: settings.minute,
      channelId: Platform.OS === 'android' ? 'reminders' : undefined,
    },
  });
  await AsyncStorage.setItem(REMINDER_ID_KEY, id);
  return true;
}

export async function cancelReminder(): Promise<void> {
  try {
    const id = await AsyncStorage.getItem(REMINDER_ID_KEY);
    if (id) await Notifications.cancelScheduledNotificationAsync(id);
    await AsyncStorage.removeItem(REMINDER_ID_KEY);
  } catch {
    // Nothing scheduled or notifications unavailable (web / Expo Go quirks).
  }
}

export function formatReminderTime(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
