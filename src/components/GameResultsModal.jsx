import React, { useState, useRef } from 'react';
import { DEFAULT_PUNISHMENTS } from '../utils/punishments';
import { pickWithoutRepeat } from '../utils/random';
import '../styles/global.css';

const GameResultsModal = ({ gameState, currentUser, updateGameState, isHost, onBackToLobby }) => {
  const players = gameState?.players || [];
  const scores = gameState?.scores || {};

  // คลังบทลงโทษ/ประวัติที่ใช้ไปแล้ว/ผลสุ่มปัจจุบัน อ่านจากห้อง (ทุกคนเห็นเหมือนกัน)
  const punishmentPool = gameState?.punishmentPool?.length ? gameState.punishmentPool : DEFAULT_PUNISHMENTS;
  const punishment = gameState?.punishment || null;
  // FIX: ต้อง declare usedPunishments จาก gameState ก่อนใช้ใน handleRandomPunishment
  const usedPunishments = gameState?.usedPunishments || [];
  const selectedPunishment = typeof punishment === 'string'
    ? punishment
    : (punishment?.text || punishment?.title || null);

  const [newPunishmentInput, setNewPunishmentInput] = useState('');
  const rollingRef = useRef(false);

  // Sort players by score descending
  const sortedPlayers = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  const winner = sortedPlayers[0];
  const loser = sortedPlayers[sortedPlayers.length - 1];

  const currentUserId = currentUser?.uid || 'host-1';
  const highestScore = Math.max(
    0,
    ...players.map((player) => Number(scores[player.id] || 0))
  );

  const highestScoringPlayers = players.filter(
    (player) => Number(scores[player.id] || 0) === highestScore
  );

  const canRandomizePunishment =
    highestScoringPlayers.some((player) => player.id === currentUserId);

  const highestScoringNames =
    highestScoringPlayers.map((p) => p.name).join(', ') || 'ผู้ชนะ';

  const handleRandomPunishment = async () => {
    if (!canRandomizePunishment || punishment || rollingRef.current) return;

    const result = pickWithoutRepeat(punishmentPool, usedPunishments);
    if (!result) return;

    rollingRef.current = true;
    const punishmentObj = {
      text: result.picked,
      loserId: loser?.id || null,
      pickedBy: currentUserId,
      pickedAt: Date.now()
    };

    try {
      await updateGameState({
        punishment: punishmentObj,
        usedPunishments: result.usedItems
      });
    } catch (err) {
      console.error('Error randomizing punishment:', err);
    } finally {
      rollingRef.current = false;
    }
  };
  const handleAddCustomPunishment = (e) => {
    e.preventDefault();
    if (!isHost) return;
    const text = newPunishmentInput.trim().slice(0, 120);
    if (!text || punishmentPool.includes(text)) return;
    updateGameState({ punishmentPool: [...punishmentPool, text] });
    setNewPunishmentInput('');
  };

  return (
    <div className="glass-card" style={{ width: '100%', maxWidth: '700px', padding: '2rem', textAlign: 'center' }}>
      <p style={{ color: 'var(--gold-primary)', fontSize: '0.8rem', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '800' }}>
        ✦ GAME RESULTS & PUNISHMENT ✦
      </p>

      <h2 className="brand-headline" style={{ fontSize: '2.2rem', marginBottom: '1.5rem', fontWeight: '900' }}>
        สรุปผลการแข่งขัน
      </h2>

      {/* Winner & Loser Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1.25rem', background: 'rgba(214, 175, 92, 0.15)', border: '1px solid var(--gold-bright)', borderRadius: '14px' }}>
          <p style={{ color: 'var(--gold-bright)', fontSize: '0.78rem', letterSpacing: '0.15em', fontWeight: '700', marginBottom: '0.5rem' }}>👑 WINNER</p>
          <h4 style={{ color: 'var(--text-main)', fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>{winner?.name || 'Player'}</h4>
          <span style={{ color: 'var(--gold-primary)', fontWeight: '800' }}>{scores[winner?.id] || 0} pts</span>
        </div>

        <div style={{ padding: '1.25rem', background: 'rgba(230, 57, 70, 0.15)', border: '1px solid var(--pressure-red)', borderRadius: '14px' }}>
          <p style={{ color: '#FF6B6B', fontSize: '0.78rem', letterSpacing: '0.15em', fontWeight: '700', marginBottom: '0.5rem' }}>💀 LOSER (โดนทำโทษ)</p>
          <h4 style={{ color: 'var(--text-main)', fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>{loser?.name || 'Player'}</h4>
          <span style={{ color: '#FF6B6B', fontWeight: '800' }}>{scores[loser?.id] || 0} pts</span>
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: '700' }}>
          LEADERBOARD
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {sortedPlayers.map((p, idx) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(11, 6, 16, 0.6)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontWeight: '800', color: idx === 0 ? 'var(--gold-bright)' : 'var(--text-muted)' }}>#{idx + 1}</span>
                <span style={{ fontWeight: '700' }}>{p.name}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-primary)', fontWeight: '800' }}>{scores[p.id] || 0} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Punishment Section */}
      <div style={{ padding: '1.5rem', background: 'rgba(11, 6, 16, 0.8)', border: '1px solid var(--glass-border)', borderRadius: '14px', marginBottom: '2rem' }}>
        <h4 style={{ color: 'var(--gold-bright)', marginBottom: '0.75rem', fontFamily: 'var(--font-serif)' }}>🎯 สุ่มบทลงโทษผู้แพ้</h4>

        {selectedPunishment ? (
          <div style={{ padding: '1.25rem', background: 'rgba(122, 31, 61, 0.3)', border: '1px solid var(--burgundy)', borderRadius: '10px', marginBottom: '1rem' }}>
            <p style={{ color: 'var(--gold-bright)', fontWeight: '700', fontSize: '1.1rem' }}>“{selectedPunishment}”</p>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            {canRandomizePunishment 
              ? 'คุณได้คะแนนสูงสุดประจำรอบนี้! กดปุ่มด้านล่างเพื่อสุ่มบทลงโทษสำหรับผู้แพ้' 
              : `รอคุณ ${highestScoringNames} (ผู้มีคะแนนสูงสุด) สุ่มบทลงโทษสำหรับผู้แพ้...`}
          </p>
        )}

       {canRandomizePunishment && !selectedPunishment && (
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleRandomPunishment} className="primary-button" style={{ fontSize: '0.9rem' }}>
              🎲 สุ่มบทลงโทษ
            </button>
          </div>
        )}

        {/* Custom Punishment Form for Host */}
        {isHost && (
          <form onSubmit={handleAddCustomPunishment} style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="เพิ่มบทลงโทษใหม่..."
              value={newPunishmentInput}
              onChange={(e) => setNewPunishmentInput(e.target.value)}
              className="luxury-input"
              style={{ fontSize: '0.9rem', padding: '0.65rem 1rem' }}
            />
            <button type="submit" className="secondary-button" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
              เพิ่ม
            </button>
          </form>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button onClick={onBackToLobby} className="primary-button" style={{ padding: '0.9rem 2rem' }}>
          🏠 กลับหน้า LOBBY / เปลี่ยนเกม
        </button>
      </div>
    </div>
  );
};

export default GameResultsModal;
