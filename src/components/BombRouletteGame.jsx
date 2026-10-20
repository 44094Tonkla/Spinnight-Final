import React, { useEffect, useState } from 'react';
import '../styles/global.css';

const BombRouletteGame = ({
  gameState,
  currentUser,
  onStartBombGame,
  onToggleTimerVisibility,
  onPassBomb,
  onTriggerExplosion,
  isHost
}) => {
  const [secondsLeft, setSecondsLeft] = useState(0);

  const players = gameState?.players || [];
  const currentHolderId = gameState?.currentHolderId || (players[0]?.id ?? null);
  const currentHolder = players.find(p => p.id === currentHolderId) || players[0];

  const explodeAt = gameState?.explodeAt || null;
  const showTimerVisible = gameState?.showTimerVisible !== undefined ? gameState.showTimerVisible : true;
  const isExploded = gameState?.isExploded || false;
  const loserId = gameState?.loserId || currentHolderId;
  const loser = players.find(p => p.id === loserId) || currentHolder;

  const bombStatus = gameState?.bombStatus || 'READY'; // 'READY', 'ACTIVE', 'EXPLODED'

  // Countdown Timer
  useEffect(() => {
    if (bombStatus !== 'ACTIVE' || !explodeAt || isExploded) return;

    const updateTimer = () => {
      const now = Date.now();
      const remMs = explodeAt - now;
      const remSec = Math.max(0, Math.ceil(remMs / 1000));
      setSecondsLeft(remSec);

      if (remMs <= 0) {
        onTriggerExplosion(currentHolderId);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [bombStatus, explodeAt, isExploded, currentHolderId, onTriggerExplosion]);

  const getTimerStyles = () => {
    if (secondsLeft > 10) {
      return {
        color: '#00e676',
        badgeBg: 'rgba(0, 230, 118, 0.15)',
        borderColor: '#00e676',
        badgeText: 'เวลาค่อนข้างปลอดภัย (> 10 วินาที)',
        pulseSpeed: '1.2s'
      };
    } else if (secondsLeft > 5) {
      return {
        color: '#ff9800',
        badgeBg: 'rgba(255, 152, 0, 0.15)',
        borderColor: '#ff9800',
        badgeText: 'เวลาเริ่มกดดัน (5 - 10 วินาที)',
        pulseSpeed: '0.6s'
      };
    } else {
      return {
        color: '#ff1744',
        badgeBg: 'rgba(255, 23, 68, 0.25)',
        borderColor: '#ff1744',
        badgeText: 'โซนวิกฤต (< 5 วินาที)',
        pulseSpeed: '0.2s'
      };
    }
  };

  const timerStyle = getTimerStyles();

  return (
    <div style={{ width: '100%', maxWidth: '650px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h2 style={{ color: 'var(--danger-gold)', fontSize: '2.2rem', margin: 0, fontWeight: '800', fontFamily: 'var(--font-serif)' }}>
          💣 BOMB ROULETTE
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          ระเบิดเวลาลุ้นระทึก (ส่งต่อให้เพื่อน ตู้มในมือใครคนนั้นดื่ม!)
        </p>
      </div>

      {/* Mode Toggle */}
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => onToggleTimerVisibility(!showTimerVisible)}
          className="secondary-button"
          style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
        >
          โหมดเวลา: {showTimerVisible ? 'แสดงตัวนับเวลา (Show Timer)' : 'ซ่อนเวลาลับ (Hide Timer)'}
        </button>
      </div>

      {/* PHASE 1: READY */}
      {bombStatus === 'READY' && (
        <div className="glass-card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', width: '100%', maxWidth: '480px' }}>
          <img className="game-illustration game-illustration-bomb" src="/images/illustrations/bomb-mascot.svg" alt="Bomb mascot" />
          <h3 style={{ color: 'var(--text-main)', fontSize: '1.4rem', marginBottom: '0.75rem', fontFamily: 'var(--font-serif)' }}>
            พร้อมจุดชนวนระเบิดเวลาหรือยัง?
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            โหมดปัจจุบัน: <strong style={{ color: 'var(--gold-bright)' }}>{showTimerVisible ? 'แสดงตัวนับเวลาถอยหลัง' : 'ซ่อนเวลาลับ'}</strong>
          </p>
          <button 
            onClick={onStartBombGame} 
            className="primary-button" 
            style={{ fontSize: '1.2rem', padding: '0.85rem 2rem', width: '100%' }}
          >
            จุดชนวนระเบิด · START BOMB
          </button>
        </div>
      )}

      {/* PHASE 2: ACTIVE (Pass the Bomb Gameplay) */}
      {bombStatus === 'ACTIVE' && !isExploded && (
        <div 
          className={`glass-card bomb-active-shell ${secondsLeft <= 10 ? 'bomb-danger-zone' : ''} ${secondsLeft <= 5 ? 'bomb-critical-zone' : ''}`}
          style={{ 
            padding: '1.75rem 1.5rem', 
            width: '100%', 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
            border: secondsLeft <= 5 ? '2px solid #ff1744' : secondsLeft <= 10 ? '2px solid #ff9800' : '1px solid var(--gold-primary)',
            boxShadow: secondsLeft <= 5 ? '0 0 38px rgba(255, 23, 68, 0.65)' : '0 15px 40px rgba(0,0,0,0.5)',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Countdown Display */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {showTimerVisible ? (
              <>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: secondsLeft <= 5 ? '5.5rem' : secondsLeft <= 10 ? '4.8rem' : '4.2rem',
                  fontWeight: '900',
                  color: timerStyle.color,
                  lineHeight: 1,
                  textShadow: `0 0 20px ${timerStyle.color}`,
                  marginBottom: '0.5rem',
                  animation: `pulse ${timerStyle.pulseSpeed} infinite alternate`
                }}>
                  {secondsLeft}s
                </div>
                <div className="status-badge" style={{ background: timerStyle.badgeBg, color: timerStyle.color, border: `1px solid ${timerStyle.borderColor}` }}>
                  {timerStyle.badgeText}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '3.5rem', color: 'var(--gold-bright)', fontWeight: 'bold', lineHeight: 1, marginBottom: '0.5rem' }}>
                  ???
                </div>
                <div className="status-badge" style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--gold-bright)', border: '1px solid var(--gold-bright)' }}>
                  โหมดเวลาลับ · ซ่อนตัวเลขเวลานับถอยหลัง
                </div>
              </>
            )}
          </div>

          {/* Bomb Visual */}
          <div className="bomb-visual-wrap" style={{ margin: '0.25rem 0' }}>
            <div style={{ 
              fontSize: '4.5rem', 
              lineHeight: 1,
              display: 'inline-block',
              animation: `pulse ${timerStyle.pulseSpeed} infinite alternate`,
              filter: `drop-shadow(0 0 15px ${timerStyle.color})`
            }}>
              <img className="bomb-mascot-active" src="/images/illustrations/bomb-mascot.svg" alt="Bomb mascot" />
            </div>
          </div>

          {secondsLeft <= 5 && (
            <div className="bomb-tension-label" style={{ color: '#ff1744', fontWeight: '800', fontSize: '1.1rem' }}>
              ⚠️ กำลังจะตู้ม... รีบส่งต่อ!!
            </div>
          )}

          {/* Current Holder Display & PASS BOMB Button (Always enabled in Pass-and-Play) */}
          <div style={{
            width: '100%',
            background: 'linear-gradient(135deg, rgba(122, 31, 61, 0.45), rgba(51, 25, 47, 0.7))',
            border: `2px solid ${timerStyle.borderColor}`,
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.85rem'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              ระเบิดอยู่ในมือของ:
            </span>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <img 
                src={`/images/avatar/${currentHolder?.avatar || currentHolder?.avatarId || '1'}.png`}
                alt={currentHolder?.name}
                onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                style={{ width: '60px', height: '60px', borderRadius: '50%', border: `3px solid ${timerStyle.borderColor}`, objectFit: 'cover' }}
              />
              <span style={{ fontSize: '1.7rem', color: '#fff', fontWeight: '900', fontFamily: 'var(--font-serif)' }}>
                {currentHolder?.name}
              </span>
            </div>

            <button 
              onClick={onPassBomb}
              className="primary-button" 
              style={{ 
                fontSize: '1.4rem', 
                padding: '1.1rem 1.5rem', 
                width: '100%', 
                background: secondsLeft <= 5 
                  ? 'linear-gradient(45deg, #ff1744, #d32f2f)' 
                  : 'linear-gradient(45deg, #d32f2f, #ff9800)',
                boxShadow: `0 0 20px ${timerStyle.color}`,
                border: 'none',
                cursor: 'pointer',
                borderRadius: '12px'
              }}
            >
              ส่งต่อระเบิดให้เพื่อน 💣 (PASS BOMB)
            </button>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>
              กดปุ่มนี้เพื่อส่งต่อระเบิดให้คนถัดไปทันที
            </p>
          </div>
        </div>
      )}

      {/* PHASE 3: EXPLODED */}
      {isExploded && (
        <div className="glass-card" style={{ padding: '2rem 1.5rem', width: '100%', maxWidth: '550px', textAlign: 'center', border: '2px solid var(--pressure-red)', background: 'rgba(40, 0, 0, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          
          <div style={{ fontSize: '4.5rem', lineHeight: 1 }}>💥</div>
          <h1 style={{ color: '#FF5252', fontSize: '2.5rem', margin: 0, fontFamily: 'var(--font-serif)', textShadow: '0 0 20px rgba(255, 82, 82, 0.8)' }}>
            ตู้ม!! ระเบิดทำงาน!
          </h1>

          {loser && (
            <div style={{ width: '100%', background: 'rgba(255, 77, 77, 0.2)', border: '2px solid var(--gold-bright)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img 
                src={`/images/avatar/${loser.avatar || loser.avatarId || '1'}.png`}
                alt={loser.name}
                onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid var(--gold-bright)', marginBottom: '0.75rem', objectFit: 'cover' }}
              />
              <h2 style={{ color: 'var(--gold-bright)', fontSize: '1.8rem', margin: 0, fontFamily: 'var(--font-serif)' }}>
                {loser.name} ถือระเบิดเป็นคนสุดท้าย!
              </h2>
              <p style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', marginTop: '0.5rem', marginBottom: 0 }}>
                🍺 โดนทำโทษ ดื่มหมดแก้ว!
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', width: '100%', flexDirection: 'column', marginTop: '0.5rem' }}>
            <button 
              onClick={onStartBombGame} 
              className="primary-button" 
              style={{ fontSize: '1.1rem', padding: '0.9rem', width: '100%' }}
            >
              💣 จุดชนวนระเบิดลูกถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BombRouletteGame;
