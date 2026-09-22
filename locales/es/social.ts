// social namespace — pestaña Amigos: novedades, búsqueda de personas y entradas del feed.
export default {
  header: {
    eyebrow: 'Amigos',
    feedTitle: 'Novedades',
    searchTitle: 'Buscar personas',
  },
  search: {
    placeholder: 'Busca por nombre o correo',
    clear: 'Borrar búsqueda',
    hint: 'Escribe al menos 3 caracteres para buscar.',
    followingTitle: 'Siguiendo',
    noResults: {
      title: 'No encontramos a nadie',
      message: 'Prueba con su nombre o el correo con el que se registró.',
    },
  },
  feed: {
    empty: {
      title: 'Todo tranquilo por aquí',
      message: 'Sigue a algunos amigos para ver sus recaps diarios aquí. Las entradas públicas también aparecen.',
      action: 'Buscar amigos',
    },
  },
  alerts: {
    couldNotFollow: 'No se pudo seguir',
    couldNotUnfollow: 'No se pudo dejar de seguir',
  },
  user: {
    you: 'Tú',
    anonymous: 'Anónimo',
    follow: 'Seguir',
    following: 'Siguiendo',
  },
  reactions: {
    react: 'Reaccionar',
    reacted: 'Reaccionaste',
    add: 'Agregar reacción',
    reactWith: 'Reaccionar con %{emoji}',
  },
} as const;
