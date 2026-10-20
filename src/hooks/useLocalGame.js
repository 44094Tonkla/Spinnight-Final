import { useState, useCallback, useEffect } from 'react';
import { generateDeck, DEFAULT_CARD_RULES } from '../utils/cardDeck';

const STORAGE_KEY = 'spinnight_local_session';
const LEADERBOARD_KEY = 'spinnight_leaderboard';

/**
 * Returns default initial game state for a given game type (pure local version)
 */
const getDefaultGameState = (gameType, initialPlayerId = null) => {
  switch (gameType) {
    case 'CARD':
      return {
        gameType: 'CARD',
        cardRules: DEFAULT_CARD_RULES,
        remainingDeck: generateDeck(),
        currentCard: null,
        drawnHistory: [],
        currentTurnPlayerId: initialPlayerId,
        lastDrawId: null
      };
    case 'BOMB':
      return {
        gameType: 'BOMB',
        currentHolderId: initialPlayerId,
        explodeAt: null,
        durationSec: 20,
        showTimerVisible: true,
        isExploded: false,
        loserId: null,
        bombStatus: 'READY'
      };
    case 'NEVER':
      return {
        gameType: 'NEVER',
        currentAskerId: initialPlayerId,
        currentQuestion: '',
        votes: {},
        roundStatus: 'SELECTING_ASKER',
        currentVotingPlayerId: null
      };
    case 'QUIZ':
      return {
        gameType: 'QUIZ',
        quizQuestionIds: null,
        quizQuestionIndex: 0,
        quizQuestionStartedAt: null,
        quizStartedAt: null,
        quizDurationSec: 120,
        quizAnswers: {},
        quizStatus: 'PLAYING',
        scores: {},
        punishment: null
      };
    case 'CAR_DODGE':
      return {
        gameType: 'CAR_DODGE',
        carDodgeStartedAt: null,
        carDodgeStatus: 'PLAYING',
        scores: {},
        punishment: null
      };
    case 'MEMORY':
      return {
        gameType: 'MEMORY',
        memoryDeck: null,
        memoryStartedAt: null,
        memoryStatus: 'PLAYING',
        scores: {},
        punishment: null
      };
    case 'SPIN':
    default:
      return {
        gameType: 'SPIN',
        currentRound: 1,
        spinRotation: 0,
        spinStartedAt: null,
        selectedPlayer: null,
        selectedPlayerId: null,
        currentChallenge: null,
        challengeRevealed: false,
        challengeStartedAt: null,
        scores: {},
        punishment: null,
        usedChallengeIds: []
      };
  }
};

/**
 * Deep merge a set of updates into state, supporting dot-notation keys
 * e.g. 'scores.player-0' => { scores: { 'player-0': value } }
 *      'quizAnswers.player-0.2' => nested object merge
 */
const applyUpdates = (prev, updates) => {
  const next = { ...prev };
  const gameState = { ...(prev.gameState || {}) };

  Object.entries(updates).forEach(([key, value]) => {
    if (key === 'status' || key === 'gameStatus' || key === 'gameType' || key === 'rounds') {
      next[key] = value;
    } else if (key.startsWith('scores.')) {
      const playerId = key.split('.')[1];
      gameState.scores = { ...(gameState.scores || {}), [playerId]: value };
      // Also update player score in players array
      next.players = (prev.players || []).map(p =>
        p.id === playerId ? { ...p, score: value } : p
      );
    } else if (key === 'scores' && typeof value === 'object') {
      gameState.scores = value;
      // Reset player scores too
      if (Object.keys(value).length === 0) {
        next.players = (prev.players || []).map(p => ({ ...p, score: 0 }));
      }
    } else if (key.startsWith('quizAnswers.')) {
      const parts = key.split('.');
      const userId = parts[1];
      const questionIndex = parts[2];
      const qa = { ...(gameState.quizAnswers || {}) };
      qa[userId] = { ...(qa[userId] || {}), [questionIndex]: value };
      gameState.quizAnswers = qa;
    } else if (key === 'punishment') {
      gameState.punishment = value;
    } else {
      gameState[key] = value;
    }
  });

  next.gameState = gameState;
  return next;
};

export const useLocalGame = () => {
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Persist session to localStorage on every change
  useEffect(() => {
    if (session) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch (e) {
        console.warn('Failed to persist session to localStorage:', e);
      }
    }
  }, [session]);

  // Unified roomData (same shape that useRoom exposes)
  const roomData = session
    ? {
        ...session,
        gameState: session.gameState || {}
      }
    : null;

  // In pass-and-play, currentUser is always player-0 (the device holder)
  const currentUser = { uid: session?.players?.[0]?.id || 'player-0' };

  /**
   * Internal session updater
   */
  const updateSession = useCallback((updater) => {
    setSession(prev => {
      if (!prev) return prev;
      return typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // ROOM MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Create a new local session with all players defined upfront.
   * players: [{ name, avatarId }]
   */
  const createRoom = useCallback(({ roomName, mode, rounds, players }) => {
    const playerObjects = (players || []).map((p, index) => ({
      id: `player-${index}`,
      name: p.name || `Player ${index + 1}`,
      avatar: p.avatarId || String(index + 1),
      avatarId: p.avatarId || String(index + 1),
      isHost: index === 0,
      isReady: true,
      score: 0
    }));

    const firstPlayerId = playerObjects.length > 0 ? playerObjects[0].id : 'player-0';

    const newSession = {
      roomCode: 'LOCAL',
      roomName: roomName || 'Friday Night Party',
      mode: mode || 'CLASSIC',
      rounds: Number(rounds) || 5,
      status: 'waiting',
      gameType: 'SPIN',
      gameStatus: 'LOBBY',
      hostId: firstPlayerId,
      players: playerObjects,
      gameState: getDefaultGameState('SPIN', firstPlayerId)
    };

    setSession(newSession);
    return 'LOCAL';
  }, []);

  /**
   * Add a player to the session (after room creation)
   */
  const addPlayer = useCallback((name, avatarId) => {
    updateSession(prev => {
      const newIndex = prev.players.length;
      const newPlayer = {
        id: `player-${newIndex}`,
        name: name || `Player ${newIndex + 1}`,
        avatar: avatarId || String(newIndex + 1),
        avatarId: avatarId || String(newIndex + 1),
        isHost: false,
        isReady: true,
        score: 0
      };
      return { ...prev, players: [...prev.players, newPlayer] };
    });
  }, [updateSession]);

  /**
   * Remove a player by id (cannot remove host)
   */
  const removePlayer = useCallback((playerId) => {
    updateSession(prev => {
      const filtered = prev.players.filter(p => p.id !== playerId);
      return { ...prev, players: filtered };
    });
  }, [updateSession]);

  /**
   * Edit a player's name/avatar
   */
  const editPlayer = useCallback((playerId, name, avatarId) => {
    updateSession(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId
          ? { ...p, name: name || p.name, avatar: avatarId || p.avatar, avatarId: avatarId || p.avatarId }
          : p
      )
    }));
  }, [updateSession]);

  // ─────────────────────────────────────────────────────────────────────────────
  // GAME STATE
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Merge updates into current gameState (supports dot-notation keys)
   */
  const updateGameState = useCallback((gameStateUpdates) => {
    const updates = typeof gameStateUpdates === 'function'
      ? null  // function form not typically used here but safe fallback
      : gameStateUpdates;

    if (!updates) return;

    setSession(prev => {
      if (!prev) return prev;
      return applyUpdates(prev, updates);
    });
  }, []);

  /**
   * Change game type and reset game state
   */
  const setGameType = useCallback((gameType) => {
    setSession(prev => {
      if (!prev) return prev;
      const pList = prev.players || [];
      const randomIndex = pList.length > 0 ? Math.floor(Math.random() * pList.length) : -1;
      const initialTurnPlayerId = randomIndex >= 0 ? pList[randomIndex].id : null;
      return {
        ...prev,
        gameType,
        gameStatus: 'LOBBY',
        status: 'waiting',
        players: pList.map(p => ({ ...p, score: 0 })),
        gameState: getDefaultGameState(gameType, initialTurnPlayerId)
      };
    });
  }, []);

  /**
   * Update card rules
   */
  const updateCardRules = useCallback((newRules) => {
    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        gameState: { ...(prev.gameState || {}), cardRules: newRules }
      };
    });
  }, []);

  /**
   * Card Game: Draw a card and advance turn
   */
  const drawCard = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;
      const gs = prev.gameState || {};
      const pList = prev.players || [];
      if (pList.length === 0) return prev;

      let deck = gs.remainingDeck || [];
      if (deck.length === 0) deck = generateDeck();
      if (deck.length === 0) return prev;

      const drawId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      if (gs.lastDrawId === drawId) return prev;

      const drawnCard = { ...deck[0], drawId };
      const newRemainingDeck = deck.slice(1);
      const history = gs.drawnHistory || [];

      const currentTurnId = gs.currentTurnPlayerId || pList[0].id;
      const currentIndex = pList.findIndex(p => p.id === currentTurnId);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % pList.length : 0;
      const nextTurnPlayer = pList[nextIndex];

      return {
        ...prev,
        gameState: {
          ...gs,
          remainingDeck: newRemainingDeck,
          currentCard: drawnCard,
          drawnHistory: [...history, drawnCard],
          currentTurnPlayerId: nextTurnPlayer ? nextTurnPlayer.id : null,
          lastDrawId: drawId
        }
      };
    });
  }, []);

  /**
   * Reshuffle & reset card deck
   */
  const resetDeck = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;
      const pList = prev.players || [];
      const randomIndex = pList.length > 0 ? Math.floor(Math.random() * pList.length) : -1;
      const randomStarter = randomIndex >= 0 ? pList[randomIndex] : null;
      return {
        ...prev,
        gameState: {
          ...(prev.gameState || {}),
          remainingDeck: generateDeck(),
          currentCard: null,
          drawnHistory: [],
          currentTurnPlayerId: randomStarter ? randomStarter.id : null,
          lastDrawId: null
        }
      };
    });
  }, []);

  /**
   * Never Have I Ever: Pick a random asker
   */
  const pickAsker = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;
      const pList = prev.players || [];
      if (pList.length === 0) return prev;
      const randomPlayer = pList[Math.floor(Math.random() * pList.length)];
      return {
        ...prev,
        gameState: {
          ...(prev.gameState || {}),
          currentAskerId: randomPlayer.id,
          currentQuestion: '',
          votes: {},
          roundStatus: 'TYPING',
          currentVotingPlayerId: null
        }
      };
    });
  }, []);

  /**
   * Never Have I Ever: Submit question and begin voting
   */
  const submitQuestion = useCallback((questionText) => {
    setSession(prev => {
      if (!prev) return prev;
      const pList = prev.players || [];
      // Start voting from first player
      const firstVoterId = pList.length > 0 ? pList[0].id : null;
      return {
        ...prev,
        gameState: {
          ...(prev.gameState || {}),
          currentQuestion: questionText,
          votes: {},
          roundStatus: 'VOTING',
          currentVotingPlayerId: firstVoterId
        }
      };
    });
  }, []);

  /**
   * Never Have I Ever: Submit vote for current voting player, advance to next
   * In pass-and-play, each player votes sequentially on the same device.
   * voteChoice: 'EVER' | 'NEVER'
   */
  const submitVote = useCallback((voteChoice) => {
    setSession(prev => {
      if (!prev) return prev;
      const gs = prev.gameState || {};
      const pList = prev.players || [];
      const votingPlayerId = gs.currentVotingPlayerId || (pList[0]?.id ?? null);
      if (!votingPlayerId) return prev;

      const updatedVotes = { ...(gs.votes || {}), [votingPlayerId]: voteChoice };
      const allVoted = Object.keys(updatedVotes).length >= pList.length;

      let nextVoterId = null;
      if (!allVoted) {
        const currentIndex = pList.findIndex(p => p.id === votingPlayerId);
        const nextIndex = (currentIndex + 1) % pList.length;
        // Find next player who hasn't voted yet
        for (let i = 1; i <= pList.length; i++) {
          const candidate = pList[(currentIndex + i) % pList.length];
          if (!updatedVotes[candidate.id]) {
            nextVoterId = candidate.id;
            break;
          }
        }
      }

      return {
        ...prev,
        gameState: {
          ...gs,
          votes: updatedVotes,
          roundStatus: allVoted ? 'REVEAL' : 'VOTING',
          currentVotingPlayerId: allVoted ? null : nextVoterId
        }
      };
    });
  }, []);

  /**
   * Never Have I Ever: Force reveal results
   */
  const revealResults = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        gameState: { ...(prev.gameState || {}), roundStatus: 'REVEAL' }
      };
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // BOMB ROULETTE
  // ─────────────────────────────────────────────────────────────────────────────

  const startBombGame = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;
      const pList = prev.players || [];
      if (pList.length === 0) return prev;
      const secretDurationSec = Math.floor(Math.random() * (35 - 15 + 1)) + 15;
      const explodeAt = Date.now() + secretDurationSec * 1000;
      const randomStarter = pList[Math.floor(Math.random() * pList.length)];
      return {
        ...prev,
        gameState: {
          ...(prev.gameState || {}),
          currentHolderId: randomStarter.id,
          explodeAt,
          durationSec: secretDurationSec,
          isExploded: false,
          loserId: null,
          bombStatus: 'ACTIVE'
        }
      };
    });
  }, []);

  const toggleBombTimerVisibility = useCallback((visible) => {
    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        gameState: { ...(prev.gameState || {}), showTimerVisible: visible }
      };
    });
  }, []);

  const passBomb = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;
      const gs = prev.gameState || {};
      if (gs.isExploded) return prev;
      const pList = prev.players || [];
      if (pList.length === 0) return prev;
      const currentHolderId = gs.currentHolderId;
      const currentIndex = pList.findIndex(p => p.id === currentHolderId);
      const nextIndex = (currentIndex + 1) % pList.length;
      const nextHolder = pList[nextIndex];
      return {
        ...prev,
        gameState: { ...gs, currentHolderId: nextHolder.id }
      };
    });
  }, []);

  const triggerExplosion = useCallback((loserUid) => {
    setSession(prev => {
      if (!prev) return prev;
      const gs = prev.gameState || {};
      if (gs.isExploded) return prev;
      return {
        ...prev,
        gameState: {
          ...gs,
          isExploded: true,
          loserId: loserUid || gs.currentHolderId,
          bombStatus: 'EXPLODED'
        }
      };
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // LOBBY / SESSION FLOW
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Toggle ready status for a player (no-op in pass-and-play, all are always ready)
   */
  const toggleReady = useCallback(() => {
    // No-op in local pass-and-play mode
  }, []);

  /**
   * Start the game
   */
  const startGame = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;
      const pList = prev.players || [];
      const randomIndex = pList.length > 0 ? Math.floor(Math.random() * pList.length) : -1;
      const initialTurnPlayerId = randomIndex >= 0 ? pList[randomIndex].id : null;
      const gameType = prev.gameType || 'SPIN';
      return {
        ...prev,
        status: 'playing',
        gameStatus: 'LOBBY',
        players: pList.map(p => ({ ...p, score: 0 })),
        gameState: getDefaultGameState(gameType, initialTurnPlayerId)
      };
    });
  }, []);

  /**
   * Return to lobby (reset active game state)
   */
  const backToLobby = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;
      const gameType = prev.gameType || 'SPIN';
      return {
        ...prev,
        status: 'waiting',
        gameStatus: 'LOBBY',
        gameState: getDefaultGameState(gameType)
      };
    });
  }, []);

  /**
   * Leave room: save top scorer to leaderboard, clear session
   */
  const leaveRoom = useCallback(() => {
    setSession(prev => {
      if (prev) {
        // Save winner to leaderboard localStorage
        try {
          const allPlayers = prev.players || [];
          const scores = prev.gameState?.scores || {};
          let topPlayer = null;
          let highestScore = -1;
          allPlayers.forEach((p) => {
            const pScore = Number(scores[p.id] !== undefined ? scores[p.id] : (p.score || 0));
            if (pScore > highestScore) {
              highestScore = pScore;
              topPlayer = {
                id: p.id,
                name: p.name || 'Anonymous',
                avatar: p.avatar || p.avatarId || '1',
                score: pScore
              };
            }
          });

          if (topPlayer && topPlayer.score > 0) {
            const leaderboardEntry = {
              id: 'lb_' + Date.now(),
              playerId: topPlayer.id,
              playerName: topPlayer.name,
              avatar: topPlayer.avatar,
              score: Math.max(0, topPlayer.score),
              roomCode: prev.roomCode || 'LOCAL',
              roomName: prev.roomName || 'Friday Night Party',
              gameType: prev.gameType || 'SPIN',
              achievedAt: Date.now()
            };
            const stored = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
            stored.unshift(leaderboardEntry);
            localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(stored.slice(0, 50)));
          }
        } catch (lbErr) {
          console.warn('Error saving winner to leaderboard:', lbErr);
        }

        localStorage.removeItem(STORAGE_KEY);
      }
      return null;
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // RETURN
  // ─────────────────────────────────────────────────────────────────────────────

  return {
    roomCode: session?.roomCode || null,
    roomData,
    currentUser,
    loading: false,
    error: null,

    // Room management
    createRoom,
    addPlayer,
    removePlayer,
    editPlayer,

    // Game actions
    updateGameState,
    setGameType,
    updateCardRules,
    drawCard,
    resetDeck,
    pickAsker,
    submitQuestion,
    submitVote,
    revealResults,

    // Bomb
    startBombGame,
    toggleBombTimerVisibility,
    passBomb,
    triggerExplosion,

    // Session flow
    backToLobby,
    leaveRoom,
    toggleReady,
    startGame,

    // Compatibility stubs
    joinRoom: () => {},
    setRoomCode: () => {}
  };
};

export default useLocalGame;
