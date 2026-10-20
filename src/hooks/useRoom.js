import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  collection,
  addDoc
} from 'firebase/firestore';
import { db, ensureAnonymousAuth, auth } from '../config/firebase';
import { generateRoomCode } from '../utils/generateRoomCode';
import { generateDeck, DEFAULT_CARD_RULES } from '../utils/cardDeck';
import { deleteRoomCompletely } from '../utils/dbMaintenance';

/**
 * Returns default initial state for any gameType in rooms/{roomCode}/gameStates/{gameType}
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
        roundStatus: 'SELECTING_ASKER'
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

export const useRoom = (initialRoomCode = null) => {
  const [roomCode, setRoomCode] = useState(() => {
    return initialRoomCode || sessionStorage.getItem('spinnight_room_code') || null;
  });

  const [roomMeta, setRoomMeta] = useState(null);
  const [playersList, setPlayersList] = useState([]);
  const [activeGameState, setActiveGameState] = useState({});

  const [currentUser, setCurrentUser] = useState(() => {
    const savedId = sessionStorage.getItem('spinnight_player_id');
    return auth.currentUser || (savedId ? { uid: savedId } : null);
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Authenticate user on mount if needed
  useEffect(() => {
    ensureAnonymousAuth()
      .then(user => {
        setCurrentUser(user);
        sessionStorage.setItem('spinnight_player_id', user.uid);
      })
      .catch(err => console.error("Auth error:", err));
  }, []);

  // 1. Listen to Room Metadata: rooms/{roomCode}
  useEffect(() => {
    if (!roomCode) {
      setRoomMeta(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const roomRef = doc(db, 'rooms', roomCode);

    const unsubscribe = onSnapshot(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setRoomMeta(snapshot.data());
          setError(null);
        } else {
          setRoomMeta(null);
          setError('ไม่พบห้องนี้หรือห้องถูกลบไปแล้ว');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firestore room snapshot error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomCode]);

  // 2. Listen to Players Sub-collection: rooms/{roomCode}/players
  useEffect(() => {
    if (!roomCode) {
      setPlayersList([]);
      return;
    }

    const playersRef = collection(db, 'rooms', roomCode, 'players');
    const unsubscribe = onSnapshot(
      playersRef,
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setPlayersList(list);
      },
      (err) => {
        console.error('Firestore players snapshot error:', err);
      }
    );

    return () => unsubscribe();
  }, [roomCode]);

  // 3. Listen to Active Game State Sub-collection: rooms/{roomCode}/gameStates/{activeGameType}
  const activeGameType = roomMeta?.gameType || 'SPIN';

  useEffect(() => {
    if (!roomCode || !activeGameType) {
      setActiveGameState({});
      return;
    }

    const gameStateRef = doc(db, 'rooms', roomCode, 'gameStates', activeGameType);
    const unsubscribe = onSnapshot(
      gameStateRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setActiveGameState(snapshot.data());
        } else {
          setActiveGameState({});
        }
      },
      (err) => {
        console.error(`Firestore gameStates/${activeGameType} snapshot error:`, err);
      }
    );

    return () => unsubscribe();
  }, [roomCode, activeGameType]);

  // Unified Room Data merging Room Metadata + Players + Active Game State
  const roomData = useMemo(() => {
    if (!roomMeta) return null;

    return {
      ...roomMeta,
      players: playersList,
      gameState: {
        gameType: activeGameType,
        gameStatus: roomMeta.gameStatus || 'LOBBY',
        hostId: roomMeta.hostId,
        roomCode: roomMeta.roomCode,
        ...(activeGameState || {})
      }
    };
  }, [roomMeta, playersList, activeGameState, activeGameType]);

  /**
   * Create a new room in Cloud Firestore with the new Sub-collections architecture
   */
  const createRoom = useCallback(async ({ playerName, roomName, avatarId, avatar, mode, rounds }) => {
    try {
      setLoading(true);
      setError(null);

      const user = await ensureAnonymousAuth();
      setCurrentUser(user);

      const newRoomCode = generateRoomCode();
      const selectedAvatar = avatar || avatarId || '1';

      // 1. Room Metadata Document: rooms/{newRoomCode}
      const roomPayload = {
        roomCode: newRoomCode,
        hostId: user.uid,
        roomName: roomName || 'Friday Night Party',
        mode: mode || 'CLASSIC',
        rounds: Number(rounds) || 5,
        status: 'waiting',
        gameType: 'SPIN',
        gameStatus: 'LOBBY',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const roomRef = doc(db, 'rooms', newRoomCode);
      await setDoc(roomRef, roomPayload);

      // 2. Creator Player Sub-document: rooms/{newRoomCode}/players/{uid}
      const playerRef = doc(db, 'rooms', newRoomCode, 'players', user.uid);
      await setDoc(playerRef, {
        id: user.uid,
        name: playerName || 'Host',
        avatar: selectedAvatar,
        avatarId: selectedAvatar,
        isHost: true,
        isReady: true,
        score: 0,
        joinedAt: serverTimestamp()
      });

      // 3. Initial Game State Sub-document: rooms/{newRoomCode}/gameStates/SPIN
      const initialSpinRef = doc(db, 'rooms', newRoomCode, 'gameStates', 'SPIN');
      await setDoc(initialSpinRef, getDefaultGameState('SPIN', user.uid));

      setRoomCode(newRoomCode);
      sessionStorage.setItem('spinnight_room_code', newRoomCode);
      sessionStorage.setItem('spinnight_player_id', user.uid);

      return newRoomCode;
    } catch (err) {
      console.error('Error in createRoom:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Join an existing room with player sub-document creation
   */
  const joinRoom = useCallback(async (code, playerName, avatarId, avatar) => {
    try {
      setLoading(true);
      setError(null);

      const normalizedCode = code.trim().toUpperCase();
      const user = await ensureAnonymousAuth();
      setCurrentUser(user);

      const roomRef = doc(db, 'rooms', normalizedCode);
      const snap = await getDoc(roomRef);

      if (!snap.exists()) {
        throw new Error('ไม่พบห้องที่มีรหัสนี้ (ROOM NOT FOUND)');
      }

      const data = snap.data();
      if (data.status === 'playing' || data.status === 'finished') {
        throw new Error('เกมในห้องนี้เริ่มไปแล้วหรือจบลงแล้ว (GAME ALREADY STARTED)');
      }

      const playersSnap = await getDocs(collection(db, 'rooms', normalizedCode, 'players'));
      if (playersSnap.size >= 12) {
        throw new Error('ห้องนี้มีผู้เล่นเต็มแล้ว (ROOM FULL)');
      }

      const selectedAvatar = avatar || avatarId || '1';
      const playerRef = doc(db, 'rooms', normalizedCode, 'players', user.uid);
      const existingPlayerSnap = await getDoc(playerRef);

      if (existingPlayerSnap.exists()) {
        await updateDoc(playerRef, {
          name: playerName || existingPlayerSnap.data().name,
          avatar: selectedAvatar,
          avatarId: selectedAvatar
        });
      } else {
        await setDoc(playerRef, {
          id: user.uid,
          name: playerName || `Player ${playersSnap.size + 1}`,
          avatar: selectedAvatar,
          avatarId: selectedAvatar,
          isHost: false,
          isReady: false,
          score: 0,
          joinedAt: serverTimestamp()
        });
      }

      setRoomCode(normalizedCode);
      sessionStorage.setItem('spinnight_room_code', normalizedCode);
      sessionStorage.setItem('spinnight_player_id', user.uid);

      return normalizedCode;
    } catch (err) {
      console.error('Error in joinRoom:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update game state in Firestore: writes to Sub-collection gameStates/{gameType}
   * and records punishments into global 'punishments' collection.
   */
  const updateGameState = useCallback(async (gameStateUpdates) => {
    if (!roomCode) return;
    try {
      const activeGame = roomMeta?.gameType || 'SPIN';
      const gameRef = doc(db, 'rooms', roomCode, 'gameStates', activeGame);
      const roomRef = doc(db, 'rooms', roomCode);

      const roomUpdates = {};
      const gameUpdates = {};

      for (const [key, value] of Object.entries(gameStateUpdates)) {
        if (key === 'status' || key === 'gameStatus' || key === 'gameType' || key === 'rounds') {
          roomUpdates[key] = value;
          roomUpdates.updatedAt = serverTimestamp();
        } else if (key === 'punishment') {
          gameUpdates.punishment = value;

          // Record to global punishments collection if it is an assigned punishment
          if (value && typeof value === 'object' && value.text) {
            try {
              await addDoc(collection(db, 'punishments'), {
                roomId: roomCode,
                targetUserId: value.loserId || null,
                punishmentText: value.text,
                assignedBy: value.pickedBy || null,
                assignedAt: serverTimestamp()
              });
            } catch (pErr) {
              console.warn('Error saving to global punishments collection:', pErr);
            }
          }
        } else if (key.startsWith('scores.')) {
          const playerId = key.split('.')[1];
          gameUpdates[key] = value;
          // Synchronize score to player sub-collection document
          if (playerId) {
            try {
              const pRef = doc(db, 'rooms', roomCode, 'players', playerId);
              await updateDoc(pRef, { score: value });
            } catch (scErr) {
              console.warn('Error updating player doc score:', scErr);
            }
          }
        } else if (key === 'scores' && typeof value === 'object') {
          gameUpdates.scores = value;
          // When resetting scores to {}, also reset in players sub-collection
          if (Object.keys(value).length === 0) {
            try {
              const pSnap = await getDocs(collection(db, 'rooms', roomCode, 'players'));
              pSnap.forEach(async (pDoc) => {
                await updateDoc(pDoc.ref, { score: 0 });
              });
            } catch (rstErr) {
              console.warn('Error resetting player subcollection scores:', rstErr);
            }
          }
        } else {
          gameUpdates[key] = value;
        }
      }

      if (Object.keys(roomUpdates).length > 0) {
        await updateDoc(roomRef, roomUpdates);
      }
      if (Object.keys(gameUpdates).length > 0) {
        await setDoc(gameRef, gameUpdates, { merge: true });
      }
    } catch (err) {
      console.error('Error updating game state:', err);
      setError(err.message);
    }
  }, [roomCode, roomMeta]);

  /**
   * Return all players in room back to Lobby to select a new game
   */
  const backToLobby = useCallback(async () => {
    if (!roomCode || !roomData) return;
    const currentUid = currentUser?.uid || sessionStorage.getItem('spinnight_player_id');
    const isHost = roomData.hostId === currentUid || (roomData.players || []).find(p => p.id === currentUid)?.isHost;
    if (!isHost) {
      throw new Error("เฉพาะ Host เท่านั้นที่มีสิทธิ์กลับหน้า Lobby / เปลี่ยนเกม");
    }
    try {
      const roomRef = doc(db, 'rooms', roomCode);
      await updateDoc(roomRef, {
        status: 'waiting',
        gameStatus: 'LOBBY',
        updatedAt: serverTimestamp()
      });

      // Reset active game state cleanly in sub-collection
      const activeGame = roomMeta?.gameType || 'SPIN';
      const gameRef = doc(db, 'rooms', roomCode, 'gameStates', activeGame);
      await setDoc(gameRef, getDefaultGameState(activeGame));
    } catch (err) {
      console.error('Error going back to lobby:', err);
    }
  }, [roomCode, roomData, roomMeta, currentUser]);

  /**
   * Change Game Type (SPIN, CARD, NEVER, BOMB, CAR_DODGE, MEMORY, QUIZ) in Firestore
   * Sets up a fresh gameStates/{gameType} sub-document
   */
  const setGameType = useCallback(async (gameType) => {
    if (!roomCode || !roomData) return;
    const currentUid = currentUser?.uid || sessionStorage.getItem('spinnight_player_id');
    const isHost = roomData.hostId === currentUid || (roomData.players || []).find(p => p.id === currentUid)?.isHost;
    if (!isHost) {
      throw new Error("เฉพาะ Host เท่านั้นที่มีสิทธิ์เปลี่ยนเกมได้");
    }
    try {
      const roomRef = doc(db, 'rooms', roomCode);
      const playersList = roomData.players || [];
      const randomIndex = playersList.length > 0 
        ? Math.floor(Math.random() * playersList.length) 
        : -1;
      const initialTurnPlayerId = randomIndex >= 0 ? playersList[randomIndex].id : null;

      // 1. Update Room Metadata
      await updateDoc(roomRef, {
        gameType: gameType,
        gameStatus: 'LOBBY',
        status: 'waiting',
        updatedAt: serverTimestamp()
      });

      // 2. Initialize fresh state in rooms/{roomCode}/gameStates/{gameType}
      const gameRef = doc(db, 'rooms', roomCode, 'gameStates', gameType);
      const defaultState = getDefaultGameState(gameType, initialTurnPlayerId);
      await setDoc(gameRef, defaultState);

      // 3. Reset scores in players sub-collection
      const pSnap = await getDocs(collection(db, 'rooms', roomCode, 'players'));
      pSnap.forEach(async (pDoc) => {
        await updateDoc(pDoc.ref, { score: 0 });
      });
    } catch (err) {
      console.error('Error setting game type:', err);
    }
  }, [roomCode, roomData, currentUser]);

  /**
   * Update Card Rules in Firestore
   */
  const updateCardRules = useCallback(async (newRules) => {
    if (!roomCode) return;
    try {
      const gameRef = doc(db, 'rooms', roomCode, 'gameStates', 'CARD');
      await updateDoc(gameRef, { cardRules: newRules });
    } catch (err) {
      console.error('Error updating card rules:', err);
    }
  }, [roomCode]);

  /**
   * Card Game: Turn-based Draw Card function with race condition guard
   */
  const drawCard = useCallback(async () => {
    if (!roomCode || !roomData) return;
    const gs = roomData.gameState || {};
    const pList = roomData.players || [];
    if (pList.length === 0) return;

    const currentUid = currentUser?.uid || sessionStorage.getItem('spinnight_player_id');
    const currentTurnId = gs.currentTurnPlayerId || pList[0].id;

    if (currentUid && currentTurnId && currentUid !== currentTurnId) {
      console.warn("Not your turn to draw cards!");
      return;
    }

    let deck = gs.remainingDeck || [];
    if (deck.length === 0) {
      deck = generateDeck();
    }
    if (deck.length === 0) return;

    const drawId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    if (gs.lastDrawId === drawId) return;

    const drawnCard = { ...deck[0], drawId };
    const newRemainingDeck = deck.slice(1);
    const history = gs.drawnHistory || [];

    const currentIndex = pList.findIndex(p => p.id === currentTurnId);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % pList.length : 0;
    const nextTurnPlayer = pList[nextIndex];

    const gameRef = doc(db, 'rooms', roomCode, 'gameStates', 'CARD');
    await updateDoc(gameRef, {
      remainingDeck: newRemainingDeck,
      currentCard: drawnCard,
      drawnHistory: [...history, drawnCard],
      currentTurnPlayerId: nextTurnPlayer ? nextTurnPlayer.id : null,
      lastDrawId: drawId
    });
  }, [roomCode, roomData, currentUser]);

  /**
   * Reshuffle & reset card deck
   */
  const resetDeck = useCallback(async () => {
    if (!roomCode || !roomData) return;
    const pList = roomData.players || [];
    const randomIndex = pList.length > 0 ? Math.floor(Math.random() * pList.length) : -1;
    const randomStarter = randomIndex >= 0 ? pList[randomIndex] : null;

    const gameRef = doc(db, 'rooms', roomCode, 'gameStates', 'CARD');
    await updateDoc(gameRef, {
      remainingDeck: generateDeck(),
      currentCard: null,
      drawnHistory: [],
      currentTurnPlayerId: randomStarter ? randomStarter.id : null,
      lastDrawId: null
    });
  }, [roomCode, roomData]);

  /**
   * Never Have I Ever: Pick random asker
   */
  const pickAsker = useCallback(async () => {
    if (!roomCode || !roomData) return;
    const pList = roomData.players || [];
    if (pList.length === 0) return;

    const randomPlayer = pList[Math.floor(Math.random() * pList.length)];
    const gameRef = doc(db, 'rooms', roomCode, 'gameStates', 'NEVER');
    await updateDoc(gameRef, {
      currentAskerId: randomPlayer.id,
      currentQuestion: '',
      votes: {},
      roundStatus: 'TYPING'
    });
  }, [roomCode, roomData]);

  /**
   * Never Have I Ever: Submit Question
   */
  const submitQuestion = useCallback(async (questionText) => {
    if (!roomCode) return;
    const gameRef = doc(db, 'rooms', roomCode, 'gameStates', 'NEVER');
    await updateDoc(gameRef, {
      currentQuestion: questionText,
      votes: {},
      roundStatus: 'VOTING'
    });
  }, [roomCode]);

  /**
   * Never Have I Ever: Submit Vote
   */
  const submitVote = useCallback(async (voteChoice) => {
    const currentUid = currentUser?.uid || sessionStorage.getItem('spinnight_player_id');
    if (!roomCode || !roomData || !currentUid) return;

    const gs = roomData.gameState || {};
    const existingVotes = gs.votes || {};
    const updatedVotes = { ...existingVotes, [currentUid]: voteChoice };

    const pList = roomData.players || [];
    const allVoted = Object.keys(updatedVotes).length >= pList.length;

    const gameRef = doc(db, 'rooms', roomCode, 'gameStates', 'NEVER');
    const updates = { votes: updatedVotes };
    if (allVoted) {
      updates.roundStatus = 'REVEAL';
    }
    await updateDoc(gameRef, updates);
  }, [roomCode, roomData, currentUser]);

  /**
   * Never Have I Ever: Reveal Results
   */
  const revealResults = useCallback(async () => {
    if (!roomCode) return;
    const gameRef = doc(db, 'rooms', roomCode, 'gameStates', 'NEVER');
    await updateDoc(gameRef, { roundStatus: 'REVEAL' });
  }, [roomCode]);

  /**
   * Bomb Roulette: Start Bomb Game
   */
  const startBombGame = useCallback(async () => {
    if (!roomCode || !roomData) return;
    const pList = roomData.players || [];
    if (pList.length === 0) return;

    const secretDurationSec = Math.floor(Math.random() * (35 - 15 + 1)) + 15;
    const explodeAt = Date.now() + secretDurationSec * 1000;
    const randomStarter = pList[Math.floor(Math.random() * pList.length)];

    const gameRef = doc(db, 'rooms', roomCode, 'gameStates', 'BOMB');
    await updateDoc(gameRef, {
      currentHolderId: randomStarter.id,
      explodeAt: explodeAt,
      durationSec: secretDurationSec,
      isExploded: false,
      loserId: null,
      bombStatus: 'ACTIVE'
    });
  }, [roomCode, roomData]);

  /**
   * Bomb Roulette: Toggle Timer Visibility
   */
  const toggleBombTimerVisibility = useCallback(async (visible) => {
    if (!roomCode) return;
    const gameRef = doc(db, 'rooms', roomCode, 'gameStates', 'BOMB');
    await updateDoc(gameRef, { showTimerVisible: visible });
  }, [roomCode]);

  /**
   * Bomb Roulette: Pass Bomb to next player
   */
  const passBomb = useCallback(async () => {
    if (!roomCode || !roomData) return;
    const gs = roomData.gameState || {};
    if (gs.isExploded) return;

    const pList = roomData.players || [];
    if (pList.length === 0) return;

    const currentHolderId = gs.currentHolderId;
    const currentIndex = pList.findIndex(p => p.id === currentHolderId);
    const nextIndex = (currentIndex + 1) % pList.length;
    const nextHolder = pList[nextIndex];

    const gameRef = doc(db, 'rooms', roomCode, 'gameStates', 'BOMB');
    await updateDoc(gameRef, { currentHolderId: nextHolder.id });
  }, [roomCode, roomData]);

  /**
   * Bomb Roulette: Trigger explosion
   */
  const triggerExplosion = useCallback(async (loserUid) => {
    if (!roomCode || !roomData) return;
    const gs = roomData.gameState || {};
    if (gs.isExploded) return;

    const gameRef = doc(db, 'rooms', roomCode, 'gameStates', 'BOMB');
    await updateDoc(gameRef, {
      isExploded: true,
      loserId: loserUid || gs.currentHolderId,
      bombStatus: 'EXPLODED'
    });
  }, [roomCode, roomData]);

  /**
   * Leave the current room: removes player document and records champion to Leaderboard if empty
   */
  const leaveRoom = useCallback(async () => {
    const currentUid = currentUser?.uid || sessionStorage.getItem('spinnight_player_id');
    if (!roomCode || !currentUid) {
      setRoomCode(null);
      sessionStorage.removeItem('spinnight_room_code');
      return;
    }

    try {
      // 1. Delete player document from sub-collection
      const playerRef = doc(db, 'rooms', roomCode, 'players', currentUid);
      await deleteDoc(playerRef);

      // 2. Check remaining players in the sub-collection
      const remainingSnap = await getDocs(collection(db, 'rooms', roomCode, 'players'));

      if (remainingSnap.empty) {
        // เมื่อทุกคนออกจากห้อง: นำคนที่มีแต้มมากที่สุดไปจัดอันดับใน Leaderboard
        try {
          const allPlayers = roomData?.players || [];
          const scores = roomData?.gameState?.scores || {};

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

          if (topPlayer) {
            const leaderboardEntry = {
              playerId: topPlayer.id,
              playerName: topPlayer.name,
              avatar: topPlayer.avatar,
              score: Math.max(0, topPlayer.score),
              roomCode: roomCode,
              roomName: roomMeta?.roomName || 'Friday Night Party',
              gameType: activeGameType,
              achievedAt: serverTimestamp()
            };

            await addDoc(collection(db, 'leaderboard'), leaderboardEntry);

            // LocalStorage backup
            try {
              const stored = JSON.parse(localStorage.getItem('spinnight_leaderboard') || '[]');
              stored.unshift({
                ...leaderboardEntry,
                id: 'lb_' + Date.now(),
                achievedAt: Date.now()
              });
              localStorage.setItem('spinnight_leaderboard', JSON.stringify(stored.slice(0, 50)));
            } catch (lsErr) {
              console.warn('LocalStorage leaderboard error:', lsErr);
            }
          }
        } catch (lbErr) {
          console.error('Error saving winner to Leaderboard:', lbErr);
        }

        // Delete entire room and all subcollections
        await deleteRoomCompletely(roomCode);
      } else {
        // Elect new host if leaving player was host
        const roomRef = doc(db, 'rooms', roomCode);
        if (roomMeta?.hostId === currentUid) {
          const newHostDoc = remainingSnap.docs[0];
          await updateDoc(newHostDoc.ref, { isHost: true });
          await updateDoc(roomRef, { hostId: newHostDoc.id });
        }
      }
    } catch (err) {
      console.error('Error in leaveRoom:', err);
    } finally {
      setRoomCode(null);
      setRoomMeta(null);
      setPlayersList([]);
      setActiveGameState({});
      sessionStorage.removeItem('spinnight_room_code');
    }
  }, [roomCode, currentUser, roomData, roomMeta, activeGameType]);

  /**
   * Toggle ready status for a player in rooms/{roomCode}/players/{playerId}
   */
  const toggleReady = useCallback(async (targetPlayerId) => {
    if (!roomCode) return;
    const pid = targetPlayerId || currentUser?.uid || sessionStorage.getItem('spinnight_player_id');
    try {
      const pRef = doc(db, 'rooms', roomCode, 'players', pid);
      const snap = await getDoc(pRef);
      if (snap.exists()) {
        await updateDoc(pRef, { isReady: !snap.data().isReady });
      }
    } catch (err) {
      console.error('Error toggling ready status:', err);
    }
  }, [roomCode, currentUser]);

  /**
   * Host starts the game
   */
  const startGame = useCallback(async () => {
    if (!roomCode || !roomData) return;
    const currentUid = currentUser?.uid || sessionStorage.getItem('spinnight_player_id');
    const isHost = roomData.hostId === currentUid || (roomData.players || []).find(p => p.id === currentUid)?.isHost;
    if (!isHost) {
      throw new Error("เฉพาะ Host เท่านั้นที่มีสิทธิ์เริ่มเกมได้");
    }

    const roomRef = doc(db, 'rooms', roomCode);
    await updateDoc(roomRef, {
      status: 'playing',
      gameStatus: 'LOBBY',
      updatedAt: serverTimestamp()
    });

    const activeGame = roomMeta?.gameType || 'SPIN';
    const gameRef = doc(db, 'rooms', roomCode, 'gameStates', activeGame);
    await setDoc(gameRef, getDefaultGameState(activeGame));

    // Reset scores in players sub-collection
    const pSnap = await getDocs(collection(db, 'rooms', roomCode, 'players'));
    pSnap.forEach(async (pDoc) => {
      await updateDoc(pDoc.ref, { score: 0 });
    });
  }, [roomCode, roomData, roomMeta, currentUser]);

  return {
    roomCode,
    roomData,
    currentUser,
    loading,
    error,
    createRoom,
    joinRoom,
    updateGameState,
    setGameType,
    updateCardRules,
    drawCard,
    resetDeck,
    pickAsker,
    submitQuestion,
    submitVote,
    revealResults,
    startBombGame,
    toggleBombTimerVisibility,
    passBomb,
    triggerExplosion,
    backToLobby,
    leaveRoom,
    toggleReady,
    startGame,
    setRoomCode
  };
};

export default useRoom;
