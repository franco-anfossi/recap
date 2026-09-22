// profile namespace — the You tab, intentions, reminders, account, legal and notification copy.
export default {
  header: {
    title: 'You',
    eyebrow: 'Profile',
  },
  identity: {
    anonymous: 'Anonymous',
  },
  social: {
    followers: 'Followers',
    friends: 'Friends',
    following: 'Following',
  },
  stats: {
    checkIns: {
      label: 'Check-ins',
      hint: 'in %{year}',
    },
    avgMood: {
      label: 'Avg mood',
      empty: 'No entries yet',
    },
    streak: {
      label: 'Streak',
      value: '%{count}d',
      hint: 'in a row',
    },
  },
  focus: {
    titleOn: 'All four burners on',
    titleDimmed: '%{burner} is turned down',
    subOn: 'You can’t keep all four on high. Choose one to turn down for now.',
    subDimmed: 'A deliberate choice for this season. Insights will read it that way.',
    sheet: {
      title: 'Which burner is turned down?',
      subtitle:
        'Health, work, family, friends. Being honest about the one you are dialing down keeps the other three sustainable.',
      allOn: 'All four on',
    },
  },
  recap: {
    eyebrow: 'Year in review',
    title: 'Your %{year} recap',
    subtitle: {
      one: '%{count} check-in so far. See how it’s shaping up.',
      other: '%{count} check-ins so far. See how it’s shaping up.',
    },
    empty: 'Starts filling in with your first check-in.',
  },
  intentions: {
    title: '%{year} intentions',
    add: '+ Add',
    addFirst: 'Add an intention',
    emptyTitle: 'Nothing set for %{year} yet.',
    emptyText: 'Add one or two intentions, each feeding a burner. Tag daily check-ins that move them forward.',
    progress: '%{done} of %{total} done',
    noBurner: 'No burner yet',
    addError: 'Could not add intention',
    deleteAlert: {
      title: 'Delete intention',
      message: 'This removes the intention and its links to past entries.',
    },
  },
  goal: {
    done: 'Done',
    notMoved: 'Not moved yet',
    daysMoved: {
      one: '%{count} day moved',
      other: '%{count} days moved',
    },
    thisWeek: '%{count} this week',
    lastToday: 'today',
    lastYesterday: 'yesterday',
    lastDaysAgo: 'last %{count} days ago',
    deleteLabel: 'Delete %{title}',
    sheet: {
      title: 'New intention',
      subtitle: 'Something for this year. Keep it small enough to actually do.',
      titlePlaceholder: 'e.g. Run twice a week',
      burnerQuestion: 'Which burner does it feed?',
      descriptionPlaceholder: 'Why it matters (optional)',
    },
  },
  reminder: {
    title: 'Reminder',
    rowTitle: 'Daily check-in reminder',
    everyDayAt: 'Every day at %{time}',
    off: 'Off',
    switchLabel: 'Remind me',
    sheet: {
      title: 'When should we nudge you?',
      subtitle: 'Evenings work best for most people. One notification a day, no more.',
    },
    permission: {
      title: 'Notifications are off',
      web: 'Reminders work in the iOS and Android apps.',
      native: 'Allow notifications for recap in Settings to get a daily reminder.',
    },
  },
  account: {
    title: 'Account',
    email: 'Email',
    memberSince: 'Member since',
    privacy: 'Privacy policy',
    terms: 'Terms of use',
    signOut: 'Sign out',
    deleteAccount: 'Delete account',
    signOutAlert: {
      title: 'Sign out',
      message: 'You can sign back in any time.',
      confirm: 'Sign out',
    },
    deleteAlert: {
      title: 'Delete your account?',
      message: 'This permanently removes your account, every check-in, intention and follow. It cannot be undone.',
      confirm: 'Delete everything',
      error: 'Could not delete account',
    },
  },
  version: 'recap · v1.0',
  legal: {
    lastUpdated: 'Last updated %{date}',
  },
  notifications: {
    channelName: 'Daily reminder',
    title: 'recap.',
    messages: {
      0: 'How was today, honestly?',
      1: 'Ten seconds. One face. Keep the streak.',
      2: 'Before the day ends: how did it feel?',
      3: 'Which burner got your energy today?',
    },
  },
} as const;
