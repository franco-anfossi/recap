// profile namespace — la pestaña Tú, intenciones, recordatorios, cuenta, legal y notificaciones.
export default {
  header: {
    title: 'Tú',
    eyebrow: 'Perfil',
  },
  identity: {
    anonymous: 'Anónimo',
  },
  social: {
    followers: 'Seguidores',
    friends: 'Amigos',
    following: 'Siguiendo',
  },
  stats: {
    checkIns: {
      label: 'Registros',
      hint: 'en %{year}',
    },
    avgMood: {
      label: 'Ánimo prom.',
      empty: 'Aún sin registros',
    },
    streak: {
      label: 'Racha',
      value: '%{count}d',
      hint: 'seguidos',
    },
  },
  focus: {
    titleOn: 'Los cuatro fuegos encendidos',
    titleDimmed: '%{burner} a fuego bajo',
    subOn: 'No puedes tener los cuatro a fuego alto. Elige uno para bajar por ahora.',
    subDimmed: 'Una decisión consciente para esta etapa. Insights lo leerá así.',
    sheet: {
      title: '¿Qué fuego va bajo?',
      subtitle:
        'Salud, trabajo, familia, amigos. Ser honesto con el que estás bajando es lo que mantiene a los otros tres.',
      allOn: 'Los cuatro encendidos',
    },
  },
  recap: {
    eyebrow: 'Resumen del año',
    title: 'Tu recap de %{year}',
    subtitle: {
      one: '%{count} registro hasta ahora. Mira cómo va tomando forma.',
      other: '%{count} registros hasta ahora. Mira cómo va tomando forma.',
    },
    empty: 'Empieza a llenarse con tu primer registro.',
  },
  intentions: {
    title: 'Intenciones %{year}',
    add: '+ Agregar',
    addFirst: 'Agregar una intención',
    emptyTitle: 'Nada fijado para %{year} todavía.',
    emptyText: 'Agrega una o dos intenciones, cada una alimentando un fuego. Marca los registros diarios que las hacen avanzar.',
    progress: '%{done} de %{total} logradas',
    noBurner: 'Sin fuego todavía',
    addError: 'No se pudo agregar la intención',
    deleteAlert: {
      title: 'Eliminar intención',
      message: 'Se eliminará la intención y sus vínculos con registros anteriores.',
    },
  },
  goal: {
    done: 'Lograda',
    notMoved: 'Aún sin avances',
    daysMoved: {
      one: '%{count} día de avance',
      other: '%{count} días de avance',
    },
    thisWeek: '%{count} esta semana',
    lastToday: 'hoy',
    lastYesterday: 'ayer',
    lastDaysAgo: 'hace %{count} días',
    deleteLabel: 'Eliminar %{title}',
    sheet: {
      title: 'Nueva intención',
      subtitle: 'Algo para este año. Que sea lo bastante pequeño como para lograrlo de verdad.',
      titlePlaceholder: 'p. ej. Correr dos veces por semana',
      burnerQuestion: '¿Qué fuego alimenta?',
      descriptionPlaceholder: 'Por qué importa (opcional)',
    },
  },
  reminder: {
    title: 'Recordatorio',
    rowTitle: 'Recordatorio diario',
    everyDayAt: 'Todos los días a las %{time}',
    off: 'Apagado',
    switchLabel: 'Recuérdame',
    sheet: {
      title: '¿A qué hora te avisamos?',
      subtitle: 'A la mayoría le funciona mejor por la noche. Una notificación al día, nada más.',
    },
    permission: {
      title: 'Las notificaciones están desactivadas',
      web: 'Los recordatorios funcionan en las apps de iOS y Android.',
      native: 'Permite las notificaciones de recap en Ajustes para recibir un recordatorio diario.',
    },
  },
  account: {
    title: 'Cuenta',
    email: 'Correo',
    memberSince: 'Miembro desde',
    privacy: 'Política de privacidad',
    terms: 'Términos de uso',
    signOut: 'Cerrar sesión',
    deleteAccount: 'Eliminar cuenta',
    signOutAlert: {
      title: 'Cerrar sesión',
      message: 'Puedes volver a entrar cuando quieras.',
      confirm: 'Cerrar sesión',
    },
    deleteAlert: {
      title: '¿Eliminar tu cuenta?',
      message: 'Se borrará para siempre tu cuenta, todos tus registros, intenciones y seguimientos. No se puede deshacer.',
      confirm: 'Eliminar todo',
      error: 'No se pudo eliminar la cuenta',
    },
  },
  version: 'recap · v1.0',
  legal: {
    lastUpdated: 'Última actualización: %{date}',
  },
  notifications: {
    channelName: 'Recordatorio diario',
    title: 'recap.',
    messages: {
      0: '¿Cómo estuvo hoy, en serio?',
      1: 'Diez segundos. Una carita. Mantén la racha.',
      2: 'Antes de que termine el día: ¿cómo se sintió?',
      3: '¿Qué fuego se llevó tu energía hoy?',
    },
  },
} as const;
