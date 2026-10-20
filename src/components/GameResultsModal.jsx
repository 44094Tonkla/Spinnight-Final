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

  const currentUserId = currentUser?.uid || 'player-0';
  const highestScore = Math.max(
    0,
    ...players.map((player) => Number(scores[player.id] || 0))
  );

  const highestScoringPlayers = players.filter(
    (player) => Number(scores[player.id] || 0) === highestScore
  );

  // In Pass-and-Play, all players share the device, so punishment randomizing is always available
  const canRandomizePunishment = true;

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
      pickedBy: winner?.name || 'Winner',
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
    const text = newPunishmentInput.trim().slice(0, 120);
    if (!text || punishmentPool.includes(text)) return;
    updateGameState({ punishmentPool: [...punishmentPool, text] });
    setNewPunishmentInput('');
  };

  return (
    <div className="glass-card" style={{ width: '100%', maxWidth: '700px', padding: '2rem 1.5rem', textAlign: 'center' }}>
      <p style={{ color: 'var(--gold-primary)', fontSize: '0.8rem', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '800' }}>
        ✦ GAME RESULTS & PUNISHMENT ✦
      </p>

      <h2 className="brand-headline" style={{ fontSize: '2.2rem', marginBottom: '1.5rem', fontWeight: '900', color: 'var(--text-main)' }}>
        สรุปผลการแข่งขัน
      </h2>

      {/* Winner & Loser Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1.25rem', background: 'rgba(214, 175, 92, 0.15)', border: '2px solid var(--gold-bright)', borderRadius: '16px' }}>
          <p style={{ color: 'var(--gold-bright)', fontSize: '0.78rem', letterSpacing: '0.15em', fontWeight: '800', marginBottom: '0.5rem' }}>👑 WINNER (ผู้ชนะ)</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <img
              src={`/images/avatar/${winner?.avatar || winner?.avatarId || '1'}.png`}
              alt={winner?.name}
              onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
              style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <h4 style={{ color: 'var(--text-main)', fontSize: '1.3rem', fontFamily: 'var(--font-serif)', margin: 0 }}>{winner?.name || 'Player'}</h4>
          </div>
          <span style={{ color: 'var(--gold-primary)', fontWeight: '800', fontSize: '1.1rem' }}>{scores[winner?.id] || 0} pts</span>
        </div>

        <div style={{ padding: '1.25rem', background: 'rgba(230, 57, 70, 0.15)', border: '2px solid var(--pressure-red)', borderRadius: '16px' }}>
          <p style={{ color: '#FF6B6B', fontSize: '0.78rem', letterSpacing: '0.15em', fontWeight: '800', marginBottom: '0.5rem' }}>💀 LOSER (โดนทำโทษ)</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <img
              src={`/images/avatar/${loser?.avatar || loser?.avatarId || '1'}.png`}
              alt={loser?.name}
              onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
              style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <h4 style={{ color: 'var(--text-main)', fontSize: '1.3rem', fontFamily: 'var(--font-serif)', margin: 0 }}>{loser?.name || 'Player'}</h4>
          </div>
          <span style={{ color: '#FF6B6B', fontWeight: '800', fontSize: '1.1rem' }}>{scores[loser?.id] || 0} pts</span>
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: '700' }}>
          LEADERBOARD (อันดับคะแนนทั้งหมด)
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {sortedPlayers.map((p, idx) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(11, 6, 16, 0.6)', borderRadius: '10px', border: idx === 0 ? '1px solid var(--gold-bright)' : '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontWeight: '800', color: idx === 0 ? 'var(--gold-bright)' : 'var(--text-muted)', width: '20px' }}>#{idx + 1}</span>
                <img
                  src={`/images/avatar/${p.avatar || p.avatarId || '1'}.png`}
                  alt={p.name}
                  onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                  style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <span style={{ fontWeight: '700', color: idx === 0 ? 'var(--gold-bright)' : 'var(--text-main)' }}>{p.name}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-primary)', fontWeight: '800', fontSize: '1rem' }}>{scores[p.id] || 0} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Punishment Section */}
      <div style={{ padding: '1.5rem', background: 'rgba(11, 6, 16, 0.85)', border: '1px solid var(--gold-primary)', borderRadius: '16px', marginBottom: '2rem' }}>
        <h4 style={{ color: 'var(--gold-bright)', marginBottom: '0.75rem', fontFamily: 'var(--font-serif)', fontSize: '1.3rem' }}>
          🎯 สุ่มบทลงโทษสำหรับผู้แพ้ ({loser?.name})
        </h4>

        {selectedPunishment ? (
          <div style={{ padding: '1.5rem', background: 'rgba(122, 31, 61, 0.4)', border: '2px solid var(--burgundy-highlight)', borderRadius: '12px', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: '700', letterSpacing: '0.1em' }}>บทลงโทษที่สุ่มได้:</span>
            <p style={{ color: 'var(--gold-bright)', fontWeight: '800', fontSize: '1.3rem', margin: '0.5rem 0 0 0' }}>“{selectedPunishment}”</p>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
            กดปุ่มด้านล่างเพื่อสุ่มบทลงโทษสุดป่วนให้ผู้แพ้ประจำรอบนี้!
          </p>
        )}

        {!selectedPunishment && (
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleRandomPunishment} className="primary-button" style={{ fontSize: '1.1rem', padding: '0.85rem 2rem' }}>
              🎲 สุ่มบทลงโทษ
            </button>
          </div>
        )}
      </div>

      {/* Back to Lobby Button */}
      <button 
        onClick={onBackToLobby}
        className="primary-button" 
        style={{ width: '100%', maxWidth: '360px', padding: '1rem', fontSize: '1.1rem' }}
      >
        กลับสู่ Lobby / เลือกเล่นเกมถัดไป →
      </button>
    </div>
  );
};

export default GameResultsModal;
