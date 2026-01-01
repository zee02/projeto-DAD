

export const MATCH_SYSTEM_CONFIG = {
  // Pontuação por ronda
  SCORING_RULES: {
    '0-60': 0,
    '61-90': 1,
    '91-119': 2,
    '120+': 4,
  },

  // Meta de pontos para vencer partida
  MARKS_TO_WIN: 4,

  // Timeouts
  TURN_TIMEOUT: 30000, // 30 segundos por turno
  RECONNECT_TIMEOUT: 300000, // 5 minutos para reconectar
  ROUND_DISPLAY_TIME: 4000, // Mostrar resultado por 4 segundos

  // Modos de jogo
  GAME_MODES: {
    '3': { handSize: 3, description: '3-card Bisca' },
    '9': { handSize: 9, description: '9-card Bisca' },
  },

  // Tipos de eventos WebSocket
  EVENTS: {
    ROUND_END: 'match:round_end',
    MATCH_FINISHED: 'match:finished',
    DECK_EXHAUSTED: 'match:deck_exhausted',
    SCORE_UPDATE: 'match:score_update',
    VICTORY_WARNING: 'match:victory_warning',
    HISTORY_SUMMARY: 'match:history_summary',
  },
};

export default MATCH_SYSTEM_CONFIG;
