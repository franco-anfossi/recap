// insights namespace — Insights tab (stats), Calendar tab, yearly recap.
export default {
  dates: {
    // date-fns patterns, localized so word order reads naturally.
    monthDay: 'MMMM d',
  },
  stats: {
    eyebrow: 'Insights',
    subtitle: {
      one: '%{count} check-in · %{pct}% of days so far',
      other: '%{count} check-ins · %{pct}% of days so far',
    },
    previousYear: 'Previous year',
    nextYear: 'Next year',
    empty: {
      title: 'Nothing logged in %{year}',
      message: 'Insights appear once you have a few check-ins. Start with today.',
      action: 'Log today',
    },
    tiles: {
      average: 'Average',
      bestMonth: 'Best month',
      bestMonthHint: '%{avg} avg',
      currentStreak: 'Current streak',
      longestStreak: 'Longest streak',
      days: '%{count}d',
    },
    sections: {
      energy: {
        title: 'Where the energy went',
        captionRecent: 'Days each burner got energy, last 30 days',
        captionYear: 'Days each burner got energy',
      },
      monthly: {
        title: 'Month by month',
        caption: 'Average mood per month',
      },
      heatmap: {
        title: 'The year in days',
        caption: 'One square per day',
      },
      breakdown: {
        title: 'Breakdown',
        caption: 'How often each mood showed up',
      },
    },
    burnerNote: {
      dimmedWorking: '%{burner} is turned down on purpose, and your days agree. That is the trade-off working.',
      quietRecent:
        '%{burner} hasn’t had any energy in 30 days. If that is a choice, mark it as turned down. If not, it is the next small move.',
      quietYear:
        '%{burner} hasn’t had any energy this year. If that is a choice, mark it as turned down. If not, it is the next small move.',
      imbalance: '%{top} gets most of your energy; %{quiet} is running on fumes.',
    },
    highlight: {
      title: 'Great days: %{count}',
      mostRecent: 'Most recent on %{date}',
      mostRecentWithNote: 'Most recent on %{date} — “%{note}”',
    },
  },
  calendar: {
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    dayLabel: '%{date}, %{mood}',
    summary: {
      title: 'Mostly %{mood} this month',
      subtitle: {
        one: '%{count} check-in · average %{avg} / 5',
        other: '%{count} check-ins · average %{avg} / 5',
      },
    },
    empty: {
      pill: 'No check-ins yet this month',
      hint: 'Tap any past day to add one.',
    },
  },
  summary: {
    hero: {
      soFar: 'So far',
      yearInReview: 'Year in review',
      titleMood: 'A mostly %{word} year.',
      titleEmpty: 'Your year in moods.',
    },
    bigStats: {
      checkIns: 'check-ins',
      averageMood: 'average mood',
      bestStreak: 'best streak',
      days: '%{count}d',
    },
    monthly: {
      title: 'Month by month',
      // Rendered as: before + <strong>month</strong> + after
      bestMonthBefore: '',
      bestMonthAfter: ' was your best month at %{avg} / 5.',
    },
    distribution: {
      title: 'How the days felt',
    },
    energy: {
      title: 'Where the energy went',
    },
    stoodOut: {
      title: 'What stood out',
      topMood: {
        one: 'Your most common mood was %{mood}, logged %{count} time.',
        other: 'Your most common mood was %{mood}, logged %{count} times.',
      },
      busiestMonth: {
        one: '%{month} was your most consistent month with %{count} check-in.',
        other: '%{month} was your most consistent month with %{count} check-ins.',
      },
      greatDays: {
        one: '%{count} great day. Worth remembering.',
        other: '%{count} great days. Worth remembering.',
      },
      topBurner: '%{burner} got the most energy this year.',
      topBurnerDimmedShows: '%{top} got the most energy. %{dimmed} was turned down on purpose, and it shows.',
      topBurnerDimmedPulled:
        '%{top} got the most energy. %{dimmed} was turned down on purpose, though it still pulled you in.',
      longestStreak: 'Your longest streak ran %{count} days straight.',
      goalsCompleted: {
        one: 'You completed %{done} of %{count} intention: %{titles}.',
        other: 'You completed %{done} of %{count} intentions: %{titles}.',
      },
      goalsInProgress: {
        one: '%{count} intention still in progress.',
        other: '%{count} intentions still in progress.',
      },
    },
    empty: {
      title: 'Nothing to recap yet.',
      currentYear: 'Your recap builds itself from daily check-ins. Log today and come back.',
      pastYear: 'No entries were logged in %{year}.',
      action: 'Log today',
    },
  },
} as const;
