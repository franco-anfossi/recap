// insights namespace — pestaña Insights (estadísticas), Calendario, resumen anual.
export default {
  dates: {
    // Patrones de date-fns, localizados para que el orden de las palabras suene natural.
    monthDay: "d 'de' MMMM",
  },
  stats: {
    eyebrow: 'Insights',
    subtitle: {
      one: '%{count} registro · %{pct}% de los días hasta hoy',
      other: '%{count} registros · %{pct}% de los días hasta hoy',
    },
    previousYear: 'Año anterior',
    nextYear: 'Año siguiente',
    empty: {
      title: 'Nada registrado en %{year}',
      message: 'Los insights aparecen cuando tienes algunos registros. Empieza con hoy.',
      action: 'Registrar hoy',
    },
    tiles: {
      average: 'Promedio',
      bestMonth: 'Mejor mes',
      bestMonthHint: '%{avg} de promedio',
      currentStreak: 'Racha actual',
      longestStreak: 'Racha más larga',
      days: '%{count}d',
    },
    sections: {
      energy: {
        title: 'Adónde fue la energía',
        captionRecent: 'Días en que cada fuego recibió energía, últimos 30 días',
        captionYear: 'Días en que cada fuego recibió energía',
      },
      monthly: {
        title: 'Mes a mes',
        caption: 'Ánimo promedio por mes',
      },
      heatmap: {
        title: 'El año en días',
        caption: 'Un cuadrito por día',
      },
      breakdown: {
        title: 'Desglose',
        caption: 'Qué tan seguido apareció cada ánimo',
      },
    },
    burnerNote: {
      dimmedWorking: '%{burner} está a fuego bajo a propósito, y tus días lo confirman. Así se ve una decisión funcionando.',
      quietRecent:
        '%{burner} no ha recibido energía en 30 días. Si es una decisión, déjalo marcado a fuego bajo. Si no, ese es tu próximo pequeño paso.',
      quietYear:
        '%{burner} no ha recibido energía este año. Si es una decisión, déjalo marcado a fuego bajo. Si no, ese es tu próximo pequeño paso.',
      imbalance: '%{top} se lleva casi toda tu energía; %{quiet} va en reserva.',
    },
    highlight: {
      title: 'Días geniales: %{count}',
      mostRecent: 'El más reciente, el %{date}',
      mostRecentWithNote: 'El más reciente, el %{date} — “%{note}”',
    },
  },
  calendar: {
    previousMonth: 'Mes anterior',
    nextMonth: 'Mes siguiente',
    dayLabel: '%{date}, %{mood}',
    summary: {
      title: 'Un mes mayormente %{mood}',
      subtitle: {
        one: '%{count} registro · promedio %{avg} / 5',
        other: '%{count} registros · promedio %{avg} / 5',
      },
    },
    empty: {
      pill: 'Aún no hay registros este mes',
      hint: 'Toca cualquier día pasado para agregar uno.',
    },
  },
  summary: {
    hero: {
      soFar: 'Hasta ahora',
      yearInReview: 'Resumen del año',
      titleMood: 'Un año mayormente %{word}.',
      titleEmpty: 'Tu año en ánimos.',
    },
    bigStats: {
      checkIns: 'registros',
      averageMood: 'ánimo promedio',
      bestStreak: 'mejor racha',
      days: '%{count}d',
    },
    monthly: {
      title: 'Mes a mes',
      // Se muestra como: before + <strong>mes</strong> + after
      bestMonthBefore: '',
      bestMonthAfter: ' fue tu mejor mes, con %{avg} / 5.',
    },
    distribution: {
      title: 'Cómo se sintieron los días',
    },
    energy: {
      title: 'Adónde fue la energía',
    },
    stoodOut: {
      title: 'Lo que destacó',
      topMood: {
        one: 'Tu ánimo más frecuente fue %{mood}, registrado %{count} vez.',
        other: 'Tu ánimo más frecuente fue %{mood}, registrado %{count} veces.',
      },
      busiestMonth: {
        one: '%{month} fue tu mes más constante, con %{count} registro.',
        other: '%{month} fue tu mes más constante, con %{count} registros.',
      },
      greatDays: {
        one: '%{count} día genial. Vale la pena recordarlo.',
        other: '%{count} días geniales. Vale la pena recordarlos.',
      },
      topBurner: '%{burner} recibió la mayor parte de tu energía este año.',
      topBurnerDimmedShows: '%{top} recibió la mayor parte de tu energía. %{dimmed} estuvo a fuego bajo a propósito, y se nota.',
      topBurnerDimmedPulled:
        '%{top} recibió la mayor parte de tu energía. %{dimmed} estuvo a fuego bajo a propósito, aunque igual te jaló un poco.',
      longestStreak: 'Tu racha más larga fue de %{count} días seguidos.',
      goalsCompleted: {
        one: 'Cumpliste %{done} de %{count} intención: %{titles}.',
        other: 'Cumpliste %{done} de %{count} intenciones: %{titles}.',
      },
      goalsInProgress: {
        one: '%{count} intención sigue en curso.',
        other: '%{count} intenciones siguen en curso.',
      },
    },
    empty: {
      title: 'Todavía no hay nada que resumir.',
      currentYear: 'Tu recap se arma solo con tus registros diarios. Registra hoy y vuelve después.',
      pastYear: 'No hubo entradas registradas en %{year}.',
      action: 'Registrar hoy',
    },
  },
} as const;
