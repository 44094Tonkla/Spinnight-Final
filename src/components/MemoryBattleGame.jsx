import React, { useState, useEffect, useRef } from 'react';
import { shuffleArray } from '../utils/random';
import '../styles/global.css';

const EMOJI_PAIRS = ['🍷', '🍸', '🍾', '🍻', '🥃', '🍹'];

const MemoryBattleGame = ({ gameState, currentUser, updateGameState, isHost }) => {
  const players = gameState?.players || [];
  const memoryDeck = gameState?.memoryDeck || null;
  const scores = gameState?.scores || {};

  const currentTurnPlayerId = gameState?.currentTurnPlayerId || (players[0]?.id ?? 'p1');
  const currentTurnPlayer = players.find(p => p.id === currentTurnPlayerId) || players[0] || { id: 'p1', name: 'Player 1' };

  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [matchingStatus, setMatchingStatus] = useState(null); // 'MATCH' | 'NO_MATCH'

  const initRef = useRef(false);

  // Initialize deck once in local session without requiring isHost
  useEffect(() => {
    if (memoryDeck && memoryDeck.length > 0) {
      setCards(memoryDeck.map((emoji, idx) => ({ id: idx, emoji, isFlipped: false })));
      setFlippedIndices([]);
      setMatchedPairs([]);
      setIsCompleted(false);
      return;
    }

    if (!initRef.current) {
      initRef.current = true;
      const newDeck = shuffleArray([...EMOJI_PAIRS, ...EMOJI_PAIRS]);
      updateGameState({
        memoryDeck: newDeck,
        memoryStatus: 'PLAYING',
        gameStatus: 'PLAYING',
        currentTurnPlayerId: players[0]?.id || null,
        scores: {},
        punishment: null
      });
    }
  }, [memoryDeck, players, updateGameState]);

  const handleCardClick = (idx) => {
    if (isCompleted || flippedIndices.length === 2) return;
    const card = cards[idx];
    if (!card || card.isFlipped || matchedPairs.includes(card.emoji)) return;

    const newFlipped = [...flippedIndices, idx];
    setFlippedIndices(newFlipped);
    setCards(prev => prev.map((c, i) => (i === idx ? { ...c, isFlipped: true } : c)));

    if (newFlipped.length === 2) {
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = cards[firstIdx];
      const secondCard = cards[secondIdx];

      if (firstCard.emoji === secondCard.emoji) {
        // MATCH!
        setMatchingStatus('MATCH');
        const updatedPairs = [...matchedPairs, firstCard.emoji];
        const prevScore = Number(scores[currentTurnPlayer.id] || 0);
        const newScore = prevScore + 10;

        setMatchedPairs(updatedPairs);
        setFlippedIndices([]);

        // Award points to current player
        updateGameState({
          [`scores.${currentTurnPlayer.id}`]: newScore
        });

        setTimeout(() => setMatchingStatus(null), 1000);

        if (updatedPairs.length === EMOJI_PAIRS.length) {
          setIsCompleted(true);
        }
      } else {
        // NO MATCH -> Switch turn to next player
        setMatchingStatus('NO_MATCH');

        setTimeout(() => {
          setCards(prev => prev.map((c, i) => (i === firstIdx || i === secondIdx) ? { ...c, isFlipped: false } : c));
          setFlippedIndices([]);
          setMatchingStatus(null);

          // Rotate turn to next player in pass-and-play
          if (players.length > 1) {
            const currentIdx = players.findIndex(p => p.id === currentTurnPlayer.id);
            const nextIdx = (currentIdx + 1) % players.length;
            const nextPlayer = players[nextIdx];
            updateGameState({
              currentTurnPlayerId: nextPlayer.id
            });
          }
        }, 900);
      }
    }
  };

  const handleFinishGame = () => {
    updateGameState({
      memoryStatus: 'ROUND_OVER',
      gameStatus: 'RESULTS'
    });
  };

  return (
    <div className="glass-card" style={{ width: '100%', maxWidth: '620px', padding: '1.75rem', textAlign: 'center' }}>
      
      {/* Title */}
      <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-bright)', fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>
        🧠 MEMORY BATTLE
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
        สลับกันเปิดการ์ดทีละ 2 ใบ หากเปิดไม่ตรงกัน ตาจะเปลี่ยนไปยังเพื่อนคนถัดไปทันที
      </p>

      {/* Active Turn Indicator Banner */}
      {!isCompleted && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(122, 31, 61, 0.45), rgba(51, 25, 47, 0.7))',
          border: '2px solid var(--gold-primary)',
          borderRadius: '14px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <img
              src={`/images/avatar/${currentTurnPlayer.avatar || currentTurnPlayer.avatarId || '1'}.png`}
              alt={currentTurnPlayer.name}
              onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
              style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid var(--gold-bright)', objectFit: 'cover' }}
            />
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', fontWeight: '700', letterSpacing: '0.1em' }}>
                CURRENT TURN
              </span>
              <h4 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontFamily: 'var(--font-serif)' }}>
                ตาของ: {currentTurnPlayer.name}
              </h4>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {matchingStatus === 'MATCH' && (
              <span style={{ color: '#00E676', fontWeight: '800', fontSize: '0.9rem' }}>✓ จับคู่ถูกต้อง! (+10)</span>
            )}
            {matchingStatus === 'NO_MATCH' && (
              <span style={{ color: '#FF6B6B', fontWeight: '800', fontSize: '0.9rem' }}>✕ ไม่ตรงกัน! สลับตา...</span>
            )}
            <span style={{
              background: 'rgba(214, 175, 92, 0.2)',
              border: '1px solid var(--gold-bright)',
              borderRadius: '20px',
              padding: '0.35rem 0.85rem',
              color: 'var(--gold-bright)',
              fontWeight: '800',
              fontSize: '0.85rem'
            }}>
              คู่ที่จับได้: {matchedPairs.length} / {EMOJI_PAIRS.length}
            </span>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      {!isCompleted ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          maxWidth: '460px',
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
                  borderRadius: '14px',
                  background: card.isFlipped || isMatched 
                    ? 'linear-gradient(135deg, var(--burgundy), var(--burgundy-highlight))' 
                    : 'rgba(11, 6, 16, 0.85)',
                  border: isMatched 
                    ? '2px solid #00E676' 
                    : card.isFlipped 
                    ? '2px solid var(--gold-bright)' 
                    : '2px solid var(--gold-primary)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '2.4rem',
                  cursor: isMatched || card.isFlipped ? 'default' : 'pointer',
                  boxShadow: card.isFlipped ? '0 0 15px rgba(239, 217, 160, 0.4)' : '0 4px 15px rgba(0,0,0,0.5)',
                  transform: card.isFlipped || isMatched ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.25s ease',
                  opacity: isMatched ? 0.7 : 1
                }}
              >
                {card.isFlipped || isMatched ? card.emoji : '❓'}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: '2rem 1rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🎉</div>
          <h4 style={{ color: 'var(--gold-bright)', fontSize: '1.75rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>
            จับคู่การ์ดครบทั้งหมดแล้ว!
          </h4>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
            ยอดเยี่ยมมาก! การแข่งขันจบลงแล้ว ไปดูคะแนนของผู้เล่นทุกคนกัน
          </p>

          <button onClick={handleFinishGame} className="primary-button" style={{ padding: '1rem 2.5rem', fontSize: '1.15rem' }}>
            ดูผลสรุปคะแนนรวม & สุ่มบทลงโทษ →
          </button>
        </div>
      )}

      {/* Real-time Scoreboard */}
      <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.65rem', fontWeight: '700' }}>
          คะแนนสะสมของผู้เล่นในห้อง
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
          {[...players]
            .sort((a, b) => (Number(scores[b.id] || 0)) - (Number(scores[a.id] || 0)))
            .map((p, idx) => {
              const isTurn = p.id === currentTurnPlayer.id;
              return (
                <div key={p.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.85rem',
                  background: isTurn ? 'rgba(214, 175, 92, 0.18)' : 'rgba(11, 6, 16, 0.6)',
                  borderRadius: '10px',
                  border: isTurn ? '1px solid var(--gold-bright)' : '1px solid rgba(255,255,255,0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <img
                      src={`/images/avatar/${p.avatar || p.avatarId || '1'}.png`}
                      alt={p.name}
                      onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                      style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span style={{ fontWeight: '700', fontSize: '0.85rem', color: idx === 0 ? 'var(--gold-bright)' : 'var(--text-main)' }}>
                      {p.name}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-primary)', fontWeight: '800', fontSize: '0.9rem' }}>
                    {scores[p.id] || 0} pts
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default MemoryBattleGame;
