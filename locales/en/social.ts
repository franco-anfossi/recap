// social namespace — Friends tab: feed, people search and feed entries.
export default {
  header: {
    eyebrow: 'Friends',
    feedTitle: 'Feed',
    searchTitle: 'Find people',
  },
  search: {
    placeholder: 'Search by name or email',
    clear: 'Clear search',
    hint: 'Type at least 3 characters to search.',
    followingTitle: 'Following',
    noResults: {
      title: 'No one found',
      message: 'Try their name or the email they signed up with.',
    },
  },
  feed: {
    empty: {
      title: 'Your feed is quiet',
      message: 'Follow a few friends to see their daily recaps here. Public entries show up too.',
      action: 'Find friends',
    },
  },
  alerts: {
    couldNotFollow: 'Could not follow',
    couldNotUnfollow: 'Could not unfollow',
  },
  user: {
    you: 'You',
    anonymous: 'Anonymous',
    follow: 'Follow',
    following: 'Following',
  },
  reactions: {
    react: 'React',
    reacted: 'Reacted',
    add: 'Add reaction',
    reactWith: 'React %{emoji}',
  },
} as const;
