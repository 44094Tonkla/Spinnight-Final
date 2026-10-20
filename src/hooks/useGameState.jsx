import { createContext, useContext, useMemo, useState } from 'react';
import useLocalGame from './useLocalGame';
import { DEFAULT_CARD_RULES } from '../utils/cardDeck';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const roomHook = useLocalGame();
  const { roomData, roomCode, currentUser, loading, error } = roomHook;

  // Local UI state for demo/fallback when no session is active yet
  const [localDemoState, setLocalDemoState] = useState({
    roomCode: 'LOCAL',
    roomName: 'FRIDAY NIGHT PARTY',
    mode: 'CLASSIC',
    rounds: 5,
    status: 'LOBBY',
    rawStatus: 'waiting',
    players: [],
    hostId: 'player-0',
    gameType: 'SPIN',
    gameStatus: 'LOBBY',
    spinRotation: 0,
    spinStartedAt: null,
    currentRound: 1,
    scores: {},
    cardRules: DEFAULT_CARD_RULES,
    remainingDeck: [],
    currentCard: null,
    drawnHistory: [],
    currentTurnPlayerId: 'player-0',
    currentAskerId: 'player-0',
    currentQuestion: '',
    votes: {},
    roundStatus: 'SELECTING_ASKER',
    currentVotingPlayerId: null,
    currentHolderId: 'player-0',
    explodeAt: null,
    durationSec: 20,
    showTimerVisible: true,
    isExploded: false,
    loserId: null,
    bombStatus: 'READY',
    quizQuestionIds: null,
    quizQuestionIndex: 0,
    quizQuestionStartedAt: null,
    quizAnswers: {},
    quizStatus: 'PLAYING',
    memoryDeck: null,
    memoryStartedAt: null,
    memoryStatus: 'PLAYING'
  });

  // Derive unified gameState from local session or fallback to demo state
  const gameState = useMemo(() => {
    if (!roomData) {
      return localDemoState;
    }

    const gs = roomData.gameState || {};

    let mappedStatus = 'LOBBY';
    if (roomData.status === 'playing') mappedStatus = 'PLAYING';
    else if (roomData.status === 'finished') mappedStatus = 'FINISHED';
    else if (roomData.status === 'waiting') mappedStatus = 'LOBBY';

    return {
      roomCode: roomData.roomCode || 'LOCAL',
      roomName: roomData.roomName || 'FRIDAY NIGHT PARTY',
      mode: roomData.mode || 'CLASSIC',
      rounds: roomData.rounds || 5,
      status: mappedStatus,
      rawStatus: roomData.status || 'waiting',
      players: roomData.players || [],
      selectedPlayerId: gs.selectedPlayerId || null,
      selectedPlayer: gs.selectedPlayer || null,
      currentChallenge: gs.currentChallenge || null,
      currentRound: gs.currentRound || 1,
      gameStatus: roomData.gameStatus || gs.gameStatus || 'LOBBY',
      scores: gs.scores || {},
      currentTurn: gs.currentTurn || 0,
      spinResult: gs.spinResult || null,
      spinRotation: gs.spinRotation ?? 0,
      spinStartedAt: gs.spinStartedAt ?? null,
      boardState: gs.boardState || {},
      hostId: roomData.hostId || 'player-0',
      // Card Game state
      gameType: roomData.gameType || gs.gameType || 'SPIN',
      cardRules: gs.cardRules || DEFAULT_CARD_RULES,
      remainingDeck: gs.remainingDeck || [],
      currentCard: gs.currentCard || null,
      drawnHistory: gs.drawnHistory || [],
      currentTurnPlayerId: gs.currentTurnPlayerId || (roomData.players && roomData.players.length > 0 ? roomData.players[0].id : 'player-0'),
      // Never Have I Ever state
      currentAskerId: gs.currentAskerId || 'player-0',
      currentQuestion: gs.currentQuestion || '',
      votes: gs.votes || {},
      roundStatus: gs.roundStatus || 'SELECTING_ASKER',
      currentVotingPlayerId: gs.currentVotingPlayerId || null,
      // Bomb Roulette state
      currentHolderId: gs.currentHolderId || 'player-0',
      explodeAt: gs.explodeAt || null,
      durationSec: gs.durationSec || 20,
      showTimerVisible: gs.showTimerVisible !== undefined ? gs.showTimerVisible : true,
      isExploded: gs.isExploded || false,
      loserId: gs.loserId || null,
      bombStatus: gs.bombStatus || 'READY',
      // Quiz
      quizQuestionIds: gs.quizQuestionIds || null,
      quizQuestionIndex: gs.quizQuestionIndex ?? 0,
      quizQuestionStartedAt: gs.quizQuestionStartedAt ?? null,
      quizStartedAt: gs.quizStartedAt ?? gs.quizQuestionStartedAt ?? null,
      quizDurationSec: gs.quizDurationSec || 120,
      quizAnswers: gs.quizAnswers || {},
      quizStatus: gs.quizStatus || 'PLAYING',
      // Memory
      memoryDeck: gs.memoryDeck || null,
      memoryStartedAt: gs.memoryStartedAt ?? null,
      memoryStatus: gs.memoryStatus || 'PLAYING',
      // Car Dodge
      carDodgeStartedAt: gs.carDodgeStartedAt ?? null,
      carDodgeStatus: gs.carDodgeStatus || 'PLAYING',
      // Misc
      challengeRevealed: gs.challengeRevealed ?? false,
      challengeStartedAt: gs.challengeStartedAt ?? null,
      lastDrawId: gs.lastDrawId || null,
      punishment: ('punishment' in gs) ? gs.punishment : null,
      punishmentPool: gs.punishmentPool || null,
      usedPunishments: gs.usedPunishments || []
    };
  }, [roomData, roomCode, localDemoState]);

  const mergeLocal = (prev, updates) => {
    const next = { ...prev };
    Object.entries(updates).forEach(([key, value]) => {
      if (key.startsWith('scores.')) {
        next.scores = {
          ...(next.scores || {}),
          [key.slice('scores.'.length)]: value
        };
      } else if (key.startsWith('quizAnswers.')) {
        const parts = key.split('.');
        const userId = parts[1];
        const questionIndex = parts[2];
        next.quizAnswers = { ...(next.quizAnswers || {}) };
        next.quizAnswers[userId] = {
          ...(next.quizAnswers[userId] || {}),
          [questionIndex]: value
        };
      } else {
        next[key] = value;
      }
    });
    return next;
  };

  const updateGameState = (action) => {
    const updates = typeof action === 'function' ? action(gameState) : action;
    setLocalDemoState(prev => mergeLocal(prev, updates));
    if (roomHook.updateGameState) {
      return roomHook.updateGameState(updates);
    }
    return Promise.resolve();
  };

  const setGameType = (type) => {
    updateGameState({
      gameType: type,
      gameStatus: 'LOBBY',
      punishment: null,
      scores: {},
      quizQuestionIds: null,
      quizQuestionIndex: 0,
      quizAnswers: {},
      memoryDeck: null,
      carDodgeStartedAt: null
    });
    if (roomHook.setGameType) {
      roomHook.setGameType(type);
    }
  };

  const startGame = async () => {
    updateGameState({
      status: 'PLAYING',
      rawStatus: 'playing',
      gameStatus: 'LOBBY',
      punishment: null,
      scores: {},
      quizQuestionIds: null,
      quizQuestionIndex: 0,
      quizAnswers: {},
      memoryDeck: null,
      carDodgeStartedAt: null
    });
    if (roomHook.startGame) {
      await roomHook.startGame();
    }
  };

  const backToLobby = async () => {
    updateGameState({
      status: 'LOBBY',
      rawStatus: 'waiting',
      gameStatus: 'LOBBY',
      punishment: null,
      scores: {},
      quizQuestionIds: null,
      quizQuestionIndex: 0,
      quizAnswers: {},
      memoryDeck: null,
      carDodgeStartedAt: null
    });
    if (roomHook.backToLobby) {
      await roomHook.backToLobby();
    }
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        setGameState: updateGameState,
        currentUser: roomHook.currentUser || { uid: 'player-0' },
        loading: false,
        error: null,
        createRoom: roomHook.createRoom,
        joinRoom: roomHook.joinRoom || (() => {}),
        addPlayer: roomHook.addPlayer,
        removePlayer: roomHook.removePlayer,
        editPlayer: roomHook.editPlayer,
        updateGameState,
        setGameType,
        updateCardRules: roomHook.updateCardRules || ((rules) => updateGameState({ cardRules: rules })),
        drawCard: roomHook.drawCard || (() => {}),
        resetDeck: roomHook.resetDeck || (() => {}),
        pickAsker: roomHook.pickAsker || (() => {}),
        submitQuestion: roomHook.submitQuestion || (() => {}),
        submitVote: roomHook.submitVote || (() => {}),
        revealResults: roomHook.revealResults || (() => {}),
        startBombGame: roomHook.startBombGame || (() => {}),
        toggleBombTimerVisibility: roomHook.toggleBombTimerVisibility || (() => {}),
        passBomb: roomHook.passBomb || (() => {}),
        triggerExplosion: roomHook.triggerExplosion || (() => {}),
        backToLobby,
        leaveRoom: roomHook.leaveRoom || (() => {}),
        toggleReady: roomHook.toggleReady || (() => {}),
        startGame,
        roomCode: gameState.roomCode
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGameState = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameProvider');
  }
  return context;
};

export default useGameState;
