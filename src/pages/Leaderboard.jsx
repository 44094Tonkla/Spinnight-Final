import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import '../styles/global.css';

const DEFAULT_CHAMPIONS = [
  { id: 'c1', playerName: 'NANA (CHAMP)', avatar: '1', score: 120, gameType: 'QUIZ', roomName: 'FRIDAY NIGHT VIP', roomCode: 'SPIN99', date: 'วันนี้' },
  { id: 'c2', playerName: 'POND SPEED', avatar: '2', score: 105, gameType: 'CAR_DODGE', roomName: 'CHAOS CLUB', roomCode: 'SPIN88', date: 'วันนี้' },
  { id: 'c3', playerName: 'MINT MEMORY', avatar: '3', score: 95, gameType: 'MEMORY', roomName: 'WINE NIGHT', roomCode: 'SPIN77', date: 'เมื่อวาน' },
  { id: 'c4', playerName: 'BOSS SPINNER', avatar: '4', score: 85, gameType: 'SPIN', roomName: 'ROULETTE BAR', roomCode: 'SPIN66', date: 'เมื่อวาน' },
  { id: 'c5', playerName: 'MAY PARTY', avatar: '5', score: 70, gameType: 'CARD', roomName: 'SECRET LOUNGE', roomCode: 'SPIN55', date: '2 วันที่แล้ว' },
];

const Leaderboard = () => {
  const [entries, setEntries] = useState([]);
  const [filterGame, setFilterGame] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    try {
      const q = query(
        collection(db, 'leaderboard'),
        orderBy('score', 'desc'),
        limit(50)
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => ({
              id: d.id,
              ...d.data()
            }));
            setEntries(list);
          } else {
            // Check localStorage fallback
            const localLb = JSON.parse(localStorage.getItem('spinnight_leaderboard') || '[]');
            setEntries(localLb.length > 0 ? localLb : DEFAULT_CHAMPIONS);
          }
          setLoading(false);
        },
        (err) => {
          console.warn('Leaderboard Firestore snapshot error, using local fallback:', err.message);
          const localLb = JSON.parse(localStorage.getItem('spinnight_leaderboard') || '[]');
          setEntries(localLb.length > 0 ? localLb : DEFAULT_CHAMPIONS);
          setLoading(false);
        }
      );
    } catch (e) {
      console.warn('Leaderboard setup error:', e);
      const localLb = JSON.parse(localStorage.getItem('spinnight_leaderboard') || '[]');
      setEntries(localLb.length > 0 ? localLb : DEFAULT_CHAMPIONS);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const filtered = entries.filter((item) => {
    if (filterGame === 'ALL') return true;
    return item.gameType === filterGame;
  });

  const top1 = filtered[0] || null;
  const top2 = filtered[1] || null;
  const top3 = filtered[2] || null;
  const remaining = filtered.slice(3);

  const getGameBadge = (type) => {
    switch (type) {
      case 'QUIZ':
        return { label: 'QUICK QUIZ', color: '#00E676', bg: 'rgba(0, 230, 118, 0.15)' };
      case 'CAR_DODGE':
        return { label: 'CAR DODGE', color: '#FF9800', bg: 'rgba(255, 152, 0, 0.15)' };
      case 'MEMORY':
        return { label: 'MEMORY BATTLE', color: '#9C27B0', bg: 'rgba(156, 39, 176, 0.15)' };
      case 'CARD':
        return { label: 'CARD GAME', color: '#29B6F6', bg: 'rgba(41, 182, 246, 0.15)' };
      case 'SPIN':
        return { label: 'SPIN WHEEL', color: 'var(--gold-bright)', bg: 'rgba(214, 175, 92, 0.15)' };
      default:
        return { label: type || 'PARTY GAME', color: 'var(--gold-primary)', bg: 'rgba(214, 175, 92, 0.1)' };
    }
  };

  return (
    <div
      style={{
        padding: '3rem 1rem 5rem',
        background: 'radial-gradient(circle at 50% 20%, #33192F 0%, #1B0E1F 60%, #0B0610 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: 'var(--text-main)',
        position: 'relative'
      }}
    >
      {/* Kicker */}
      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          marginBottom: '0.5rem',
          fontWeight: '700'
        }}
      >
        ✦ HALL OF FAME ✦
      </p>

      {/* Headline */}
      <h1
        className="brand-headline"
        style={{
          fontSize: 'clamp(2rem, 5vw, 3.25rem)',
          marginBottom: '0.5rem',
          fontWeight: '900',
          color: 'var(--text-main)',
          textAlign: 'center'
        }}
      >
        LEADERBOARD
      </h1>

      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.95rem',
          marginBottom: '2rem',
          maxWidth: '560px',
          textAlign: 'center',
          lineHeight: 1.5
        }}
      >
        อันดับผู้ชนะที่มีแต้มสูงสุดจากแต่ละห้องปาร์ตี้ (บันทึกอัตโนมัติเมื่อทุกคนออกจากห้อง)
      </p>

      {/* Game Filter Pills */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: '2.5rem',
          maxWidth: '680px'
        }}
      >
        {[
          { id: 'ALL', label: 'ทั้งหมด' },
          { id: 'QUIZ', label: 'QUICK QUIZ' },
          { id: 'CAR_DODGE', label: 'CAR DODGE' },
          { id: 'MEMORY', label: 'MEMORY' },
          { id: 'SPIN', label: 'SPIN' },
          { id: 'CARD', label: 'CARD' }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterGame(f.id)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '20px',
              border: filterGame === f.id ? '1px solid var(--gold-bright)' : '1px solid rgba(255,255,255,0.12)',
              background: filterGame === f.id ? 'var(--burgundy)' : 'rgba(11, 6, 16, 0.6)',
              color: filterGame === f.id ? 'var(--gold-bright)' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: filterGame === f.id ? '0 0 12px rgba(214, 175, 92, 0.3)' : 'none'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* TOP 3 PODIUM */}
      {filtered.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            width: '100%',
            maxWidth: '820px',
            marginBottom: '3rem',
            alignItems: 'end'
          }}
        >
          {/* #2 Silver (Left) */}
          {top2 && (
            <div
              className="glass-card"
              style={{
                textAlign: 'center',
                padding: '1.5rem 1rem',
                border: '1px solid rgba(192, 192, 192, 0.5)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                order: 1
              }}
            >
              <span style={{ fontSize: '1.6rem', display: 'block', marginBottom: '0.5rem' }}>🥈</span>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  margin: '0 auto 0.75rem',
                  padding: '2px',
                  border: '2px solid #C0C0C0',
                  boxShadow: '0 0 15px rgba(192, 192, 192, 0.4)'
                }}
              >
                <img
                  src={`/images/avatar/${top2.avatar || '2'}.png`}
                  alt={top2.playerName}
                  onError={(e) => { e.target.src = '/images/avatar/2.png'; }}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              </div>
              <h4 style={{ color: 'var(--text-main)', fontSize: '1.05rem', margin: '0 0 0.25rem 0' }}>
                {top2.playerName}
              </h4>
              <p style={{ color: '#C0C0C0', fontSize: '1.25rem', fontWeight: '900', fontFamily: 'var(--font-serif)', margin: '0 0 0.5rem 0' }}>
                {top2.score} pts
              </p>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  color: getGameBadge(top2.gameType).color,
                  background: getGameBadge(top2.gameType).bg
                }}
              >
                {getGameBadge(top2.gameType).label}
              </span>
            </div>
          )}

          {/* #1 Gold (Center, Elevated) */}
          {top1 && (
            <div
              className="glass-card"
              style={{
                textAlign: 'center',
                padding: '2rem 1.25rem',
                border: '2px solid var(--gold-bright)',
                boxShadow: '0 15px 45px rgba(214, 175, 92, 0.35)',
                background: 'linear-gradient(145deg, rgba(80, 35, 60, 0.7), rgba(11, 6, 16, 0.95))',
                transform: 'scale(1.04)',
                order: 2
              }}
            >
              <span style={{ fontSize: '2.2rem', display: 'block', marginBottom: '0.5rem' }}>👑</span>
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  margin: '0 auto 0.75rem',
                  padding: '3px',
                  border: '3px solid var(--gold-bright)',
                  boxShadow: '0 0 25px rgba(239, 217, 160, 0.6)'
                }}
              >
                <img
                  src={`/images/avatar/${top1.avatar || '1'}.png`}
                  alt={top1.playerName}
                  onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              </div>
              <h3 style={{ color: 'var(--gold-bright)', fontSize: '1.25rem', margin: '0 0 0.25rem 0', fontFamily: 'var(--font-serif)' }}>
                {top1.playerName}
              </h3>
              <p style={{ color: 'var(--gold-bright)', fontSize: '1.75rem', fontWeight: '900', fontFamily: 'var(--font-serif)', margin: '0 0 0.5rem 0' }}>
                {top1.score} pts
              </p>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  color: getGameBadge(top1.gameType).color,
                  background: getGameBadge(top1.gameType).bg,
                  border: '1px solid rgba(214, 175, 92, 0.3)'
                }}
              >
                {getGameBadge(top1.gameType).label}
              </span>
            </div>
          )}

          {/* #3 Bronze (Right) */}
          {top3 && (
            <div
              className="glass-card"
              style={{
                textAlign: 'center',
                padding: '1.5rem 1rem',
                border: '1px solid rgba(205, 127, 50, 0.5)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                order: 3
              }}
            >
              <span style={{ fontSize: '1.6rem', display: 'block', marginBottom: '0.5rem' }}>🥉</span>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  margin: '0 auto 0.75rem',
                  padding: '2px',
                  border: '2px solid #CD7F32',
                  boxShadow: '0 0 15px rgba(205, 127, 50, 0.4)'
                }}
              >
                <img
                  src={`/images/avatar/${top3.avatar || '3'}.png`}
                  alt={top3.playerName}
                  onError={(e) => { e.target.src = '/images/avatar/3.png'; }}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              </div>
              <h4 style={{ color: 'var(--text-main)', fontSize: '1.05rem', margin: '0 0 0.25rem 0' }}>
                {top3.playerName}
              </h4>
              <p style={{ color: '#CD7F32', fontSize: '1.25rem', fontWeight: '900', fontFamily: 'var(--font-serif)', margin: '0 0 0.5rem 0' }}>
                {top3.score} pts
              </p>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  color: getGameBadge(top3.gameType).color,
                  background: getGameBadge(top3.gameType).bg
                }}
              >
                {getGameBadge(top3.gameType).label}
              </span>
            </div>
          )}
        </div>
      )}

      {/* RANKS 4+ TABLE / LIST */}
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '820px',
          padding: '1.5rem',
          boxSizing: 'border-box'
        }}
      >
        <h4 style={{ color: 'var(--gold-bright)', fontSize: '1.1rem', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)' }}>
          📋 อันดับผู้เล่นทั้งหมด
        </h4>

        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
            ยังไม่มีสถิติสำหรับเกมนี้
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map((item, index) => {
              const badge = getGameBadge(item.gameType);
              return (
                <div
                  key={item.id || index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: index === 0 ? 'rgba(214, 175, 92, 0.12)' : 'rgba(11, 6, 16, 0.5)',
                    border: index === 0 ? '1px solid var(--gold-bright)' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    gap: '0.75rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.1rem',
                        fontWeight: '900',
                        color: index === 0 ? 'var(--gold-bright)' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'var(--text-muted)',
                        width: '28px'
                      }}
                    >
                      #{index + 1}
                    </span>

                    <img
                      src={`/images/avatar/${item.avatar || '1'}.png`}
                      alt={item.playerName}
                      onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                      style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }}
                    />

                    <div>
                      <h5 style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                        {item.playerName}
                      </h5>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.roomName || 'Party Room'} ({item.roomCode || 'SPIN'})
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '8px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        color: badge.color,
                        background: badge.bg
                      }}
                    >
                      {badge.label}
                    </span>

                    <span
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.25rem',
                        fontWeight: '900',
                        color: 'var(--gold-bright)',
                        minWidth: '65px',
                        textAlign: 'right'
                      }}
                    >
                      {item.score} <small style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>pts</small>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Back / Action Link */}
      <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/" className="primary-button" style={{ padding: '0.85rem 2rem', textDecoration: 'none' }}>
          🎮 กลับหน้าหลัก / สร้างห้องเล่น
        </Link>
      </div>
    </div>
  );
};

export default Leaderboard;
