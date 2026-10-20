import React, { useState, useEffect, useRef } from 'react';
import { shuffleArray } from '../utils/random';
import '../styles/global.css';

const EMOJI_PAIRS = ['🍷', '🍸', '🍾', '🍻'];
const MEMORY_TIME_SECONDS = 45;

const MemoryBattleGame = ({ gameState, currentUser, updateGameState, isHost }) => {
  const currentUserId = currentUser?.uid || 'host-1';
  const players = gameState?.players || [];
  const memoryDeck = gameState?.memoryDeck || null;
  const memoryStartedAt = gameState?.memoryStartedAt || null;
  const isFinished = gameState?.memoryStatus === 'ROUND_OVER' || gameState?.gameStatus === 'RESULTS';
  const scores = gameState?.scores || {};

  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  // FIX: initialise myScore from shared Firestore scores so value survives refresh
  const [myScore, setMyScore] = useState(() => Number(scores[currentUserId] || 0));
  const [isCompleted, setIsCompleted] = useState(false);
  const [now, setNow] = useState(Date.now());

  const initRef = useRef(false);
  const finishedRef = useRef(false);

  // Sync myScore from Firestore when it changes (e.g. after a reconnect)
  useEffect(() => {
    const firestoreScore = Number(scores[currentUserId] || 0);
    setMyScore(firestoreScore);
  }, [scores, currentUserId]);

  // Reset flags when memoryDeck changes or is cleared
  useEffect(() => {
    if (!memoryDeck) {
      initRef.current = false;
      finishedRef.current = false;
    }
  }, [memoryDeck]);

  // Host: Shuffle deck once and store in shared room state with start timestamp
  useEffect(() => {
    if (memoryDeck) {
      setCards(memoryDeck.map((emoji, idx) => ({ id: idx, emoji, isFlipped: false })));
      setFlippedIndices([]);
      setMatchedPairs([]);
      setIsCompleted(false);
      return;
    }

    if (isHost && !initRef.current) {
      initRef.current = true;
      const newDeck = shuffleArray([...EMOJI_PAIRS, ...EMOJI_PAIRS]);
      updateGameState({
        memoryDeck: newDeck,
        memoryStartedAt: Date.now(),
        memoryStatus: 'PLAYING',
        gameStatus: 'PLAYING',
        scores: {},
        punishment: null
      });
    }
    // FIX: Guests do NOT create a local fallback deck — they wait for Host to push the shared deck
    // (removed guest fallback branch that created a local-only deck)
  }, [isHost, memoryDeck, updateGameState]);

  // Synchronized countdown timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 250);
    return () => clearInterval(timer);
  }, []);

  const elapsedSeconds = memoryStartedAt ? Math.floor((now - memoryStartedAt) / 1000) : 0;
  const timeLeft = memoryStartedAt ? Math.max(0, MEMORY_TIME_SECONDS - elapsedSeconds) : MEMORY_TIME_SECONDS;
  const isTimeExpired = memoryStartedAt ? timeLeft <= 0 : false;

  // Host: Conclude game when time expires or all players finished
  useEffect(() => {
    if (!isHost || isFinished || !memoryStartedAt) return;

    const allPlayersCompleted = players.length > 0 && players.every(p => {
      const pScore = scores[p.id];
      return typeof pScore === 'number' && pScore >= EMOJI_PAIRS.length * 10;
    });

    if (isTimeExpired || allPlayersCompleted) {
      if (finishedRef.current) return;
      finishedRef.current = true;

      const delay = allPlayersCompleted && !isTimeExpired ? 1000 : 0;
      const timer = setTimeout(() => {
        updateGameState({
          memoryStatus: 'ROUND_OVER',
          gameStatus: 'RESULTS'
        });
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isHost, isFinished, memoryStartedAt, isTimeExpired, players, scores, updateGameState]);

  const handleCardClick = (idx) => {
    if (isCompleted || isFinished || isTimeExpired) return;
    if (flippedIndices.length === 2) return;
    const card = cards[idx];
    if (!card || card.isFlipped || matchedPairs.includes(card.emoji)) return;

    const newFlipped = [...flippedIndices, idx];
    setFlippedIndices(newFlipped);
    setCards(prev => prev.map((c, i) => (i === idx ? { ...c, isFlipped: true } : c)));

    if (newFlipped.length === 2) {
      const [firstIdx, secondIdx] = newFlipped;
      if (cards[firstIdx].emoji === cards[secondIdx].emoji) {
        const updatedPairs = [...matchedPairs, cards[firstIdx].emoji];
        const newScore = myScore + 10;
        setMatchedPairs(updatedPairs);
        setMyScore(newScore);
        setFlippedIndices([]);

        // Record individual player's score to shared room state
        updateGameState({ [`scores.${currentUserId}`]: newScore });

        if (updatedPairs.length === EMOJI_PAIRS.length) {
          setIsCompleted(true);
        }
      } else {
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => (i === firstIdx || i === secondIdx) ? { ...c, isFlipped: false } : c));
          setFlippedIndices([]);
        }, 800);
      }
    }
  };

  return (
    <div className="glass-card" style={{ width: '100%', maxWidth: '550px', padding: '1.75rem', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-bright)' }}>🧠 MEMORY BATTLE</h3>
        <span className="counter">
          คะแนน: {myScore} | เวลา: {timeLeft}s | คู่ที่จับได้: {matchedPairs.length} / {EMOJI_PAIRS.length}
        </span>
      </div>

      {!isCompleted && !isTimeExpired ? (
        cards.length === 0 ? (
          <div style={{ padding: '2rem 0' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              {isHost ? 'กำลังเตรียมการ์ด...' : 'รอ Host เตรียมการ์ด...'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            maxWidth: '400px',
            margin: '0 auto 1.5rem'
          }}>
            {cards.map((card, idx) => {
              const isMatched = matchedPairs.includes(card.emoji);
              return (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(idx)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '12px',
                    background: card.isFlipped || isMatched ? 'linear-gradient(135deg, var(--burgundy), var(--burgundy-highlight))' : 'rgba(11, 6, 16, 0.85)',
                    border: '2px solid var(--gold-primary)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '2rem',
                    cursor: isMatched ? 'default' : 'pointer',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                    transition: 'all 0.25s ease',
                    opacity: isMatched ? 0.6 : 1
                  }}
                >
                  {card.isFlipped || isMatched ? card.emoji : '❓'}
                </div>
              );
            })}
          </div>
        )
      ) : isCompleted ? (
        <div style={{ padding: '2rem 1rem' }}>
          <h4 style={{ color: 'var(--gold-bright)', fontSize: '1.5rem', marginBottom: '1rem' }}>🎉 ยอดเยี่ยม! จับคู่การ์ดครบหมดแล้ว!</h4>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            คะแนนสะสมของคุณ: <strong style={{ color: 'var(--gold-bright)', fontSize: '1.5rem' }}>{myScore}</strong> คะแนน
          </p>
          {isHost ? (
            <button onClick={() => updateGameState({ memoryStatus: 'ROUND_OVER', gameStatus: 'RESULTS' })} className="primary-button">
              ดูผลสรุปคะแนนรวมทั้งหมด →
            </button>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>
              {timeLeft > 0 ? `กำลังรอเพื่อนในห้อง หรือรอเวลาหมด (${timeLeft}s)...` : 'กำลังสรุปผลคะแนนรวมของห้อง...'}
            </p>
          )}
        </div>
      ) : (
        <div style={{ padding: '2rem 1rem' }}>
          <h4 style={{ color: 'var(--gold-bright)', fontSize: '1.5rem', marginBottom: '1rem' }}>หมดเวลาการแข่งขัน!</h4>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            คะแนนที่คุณทำได้: <strong style={{ color: 'var(--gold-bright)', fontSize: '1.5rem' }}>{myScore}</strong> คะแนน
          </p>
          {isHost && (
            <button onClick={() => updateGameState({ memoryStatus: 'ROUND_OVER', gameStatus: 'RESULTS' })} className="primary-button">
              ดูผลสรุปคะแนนรวมทั้งหมด →
            </button>
          )}
        </div>
      )}

      {/* Real-time Scoreboard for all players */}
      {players.length > 1 && (
        <div style={{ marginTop: '1.25rem', textAlign: 'left' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '700' }}>
            SCOREBOARD
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {[...players]
              .sort((a, b) => (Number(scores[b.id] || 0)) - (Number(scores[a.id] || 0)))
              .map((p, idx) => (
                <div key={p.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.45rem 0.85rem',
                  background: p.id === currentUserId ? 'rgba(214, 175, 92, 0.12)' : 'rgba(11, 6, 16, 0.6)',
                  borderRadius: '8px',
                  border: p.id === currentUserId ? '1px solid var(--gold-primary)' : '1px solid rgba(255,255,255,0.06)'
                }}>
                  <span style={{ fontWeight: '700', fontSize: '0.85rem', color: idx === 0 ? 'var(--gold-bright)' : 'var(--text-main)' }}>
                    {idx === 0 ? '👑 ' : ''}{p.name}{p.id === currentUserId ? ' (คุณ)' : ''}
                  </span>
                  <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-primary)', fontWeight: '800', fontSize: '0.9rem' }}>
                    {scores[p.id] || 0} pts
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryBattleGame;
