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
  const currentUserId = currentUser?.uid;

  const currentHolderId = gameState?.currentHolderId || null;
  const currentHolder = players.find(p => p.id === currentHolderId);
  const isCurrentHolder = currentUserId === currentHolderId;

  const explodeAt = gameState?.explodeAt || null;
  const showTimerVisible = gameState?.showTimerVisible !== undefined ? gameState.showTimerVisible : true;
  const isExploded = gameState?.isExploded || false;
  const loserId = gameState?.loserId || null;
  const loser = players.find(p => p.id === loserId);

  const bombStatus = gameState?.bombStatus || 'READY'; // 'READY', 'ACTIVE', 'EXPLODED'

  // Synchronized Real-time Countdown Timer
  useEffect(() => {
    if (bombStatus !== 'ACTIVE' || !explodeAt || isExploded) return;

    const updateTimer = () => {
      const now = Date.now();
      const remMs = explodeAt - now;
      const remSec = Math.max(0, Math.ceil(remMs / 1000));
      setSecondsLeft(remSec);

      if (remMs <= 0) {
        if (isCurrentHolder || isHost) {
          onTriggerExplosion(currentHolderId);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [bombStatus, explodeAt, isExploded, isCurrentHolder, isHost, currentHolderId, onTriggerExplosion]);

  // Determine Timer Styles based on remaining seconds
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
      
      {/* TITLE HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h2 style={{ color: 'var(--danger-gold)', fontSize: '2rem', margin: 0, fontWeight: '800', lineHeight: 1.2 }}>
          BOMB ROULETTE
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem', lineHeight: 1.3 }}>
          ระเบิดเวลาเพียวๆ (ดองไว้ดักเพื่อน สลับส่งต่อ ตู้มเท่ากับดื่ม!)
        </p>
      </div>

      {/* Host Option to Toggle Timer Visibility */}
      {isHost && (
        <div style={{ marginBottom: '1rem' }}>
          <button
            onClick={() => onToggleTimerVisibility(!showTimerVisible)}
            className="secondary-button"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
          >
            โหมดเวลาระเบิด: {showTimerVisible ? 'แสดงตัวนับเวลา (Show Timer)' : 'ซ่อนเวลาลับ (Hide Timer)'}
          </button>
        </div>
      )}

      {/* PHASE 1: READY / NOT STARTED */}
      {bombStatus === 'READY' && (
        <div className="glass-card" style={{ padding: '2rem 1.5rem', textAlign: 'center', width: '100%', maxWidth: '480px' }}>
          <img className="game-illustration game-illustration-bomb" src="/images/illustrations/bomb-mascot.svg" alt="Cute bomb night illustration" />
          <h3 style={{ color: 'var(--text-main)', fontSize: '1.4rem', marginBottom: '0.75rem' }}>
            พร้อมจุดชนวนระเบิดเวลาหรือยัง?
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            โหมดปัจจุบัน: <strong style={{ color: 'var(--gold)' }}>{showTimerVisible ? 'แสดงตัวนับเวลาถอยหลัง' : 'ซ่อนเวลาลับ'}</strong>
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

      {/* PHASE 2: ACTIVE (Pure Gameplay Layout) */}
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
            gap: '1rem',
            border: secondsLeft <= 5 ? '2px solid #ff1744' : secondsLeft <= 10 ? '2px solid #ff9800' : '1px solid var(--glass-border)',
            boxShadow: secondsLeft <= 5 ? '0 0 38px rgba(255, 23, 68, 0.65), inset 0 0 35px rgba(255, 23, 68, 0.12)' : secondsLeft <= 10 ? '0 0 28px rgba(255, 152, 0, 0.45)' : '0 15px 40px rgba(0,0,0,0.5)',
            transition: 'all 0.3s ease'
          }}
        >
          {/* REAL-TIME COUNTDOWN TIMER & STATUS BADGE */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {showTimerVisible ? (
              <>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: secondsLeft <= 5 ? '5.5rem' : secondsLeft <= 10 ? '4.9rem' : '4.2rem',
                  fontWeight: '900',
                  color: timerStyle.color,
                  lineHeight: 1,
                  textShadow: `0 0 20px ${timerStyle.color}`,
                  letterSpacing: '2px',
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
                <div style={{ fontSize: '3.5rem', color: 'var(--gold)', fontWeight: 'bold', lineHeight: 1, marginBottom: '0.5rem' }}>
                  ??
                </div>
                <div className="status-badge" style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--gold)', border: '1px solid var(--gold)' }}>
                  โหมดเวลาลับ · ซ่อนตัวเลขเวลานับถอยหลัง
                </div>
              </>
            )}
          </div>

          {/* Animated Bomb Graphic with Scaled Max Bounds */}
          <div className="bomb-visual-wrap" style={{ margin: '0.25rem 0' }}>
            <div style={{ 
              fontSize: '4.5rem', 
              lineHeight: 1,
              display: 'inline-block',
              animation: `pulse ${timerStyle.pulseSpeed} infinite alternate`,
              filter: `drop-shadow(0 0 15px ${timerStyle.color})`
            }}>
              <img className="bomb-mascot-active" src="/images/illustrations/bomb-mascot.svg" alt="Bomb illustration" />
            </div>
          </div>

          {secondsLeft <= 5 && (
            <div className="bomb-tension-label" aria-live="polite">กำลังจะตู้ม...</div>
          )}

          {/* Holder Panel & Pass Button */}
          {isCurrentHolder ? (
            <div style={{ width: '100%', background: 'rgba(255, 77, 77, 0.15)', border: `2px solid ${timerStyle.borderColor}`, borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ padding: '3px 10px', background: timerStyle.borderColor, color: '#fff', fontWeight: 'bold', borderRadius: '10px', fontSize: '0.8rem' }}>
                คุณกำลังถือระเบิดอยู่ในมือ
              </span>

              <button 
                onClick={onPassBomb}
                className="primary-button" 
                style={{ 
                  fontSize: '1.5rem', 
                  padding: '1rem 1.5rem', 
                  width: '100%', 
                  background: secondsLeft <= 5 
                    ? 'linear-gradient(45deg, #ff1744, #d32f2f)' 
                    : 'linear-gradient(45deg, #d32f2f, #ff9800)',
                  boxShadow: `0 0 20px ${timerStyle.color}`,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ส่งต่อระเบิดให้เพื่อน →
              </button>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                แกล้งดองระเบิดไว้ในมือให้เฉียดเวลา แล้วค่อยส่งต่อ
              </p>
            </div>
          ) : (
            <div style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                ระเบิดอยู่ที่มือของ:
              </p>
              {currentHolder && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <img 
                    src={`/images/avatar/${currentHolder.avatar || currentHolder.avatarId || '1'}.png`}
                    alt={currentHolder.name}
                    onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                    style={{ width: '55px', height: '55px', borderRadius: '50%', border: '2px solid var(--gold)', objectFit: 'cover' }}
                  />
                  <span style={{ fontSize: '1.4rem', color: 'var(--gold)', fontWeight: 'bold' }}>
                    {currentHolder.name}
                  </span>
                </div>
              )}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                ลุ้นให้เวลาหมดลงในมือเพื่อน
              </p>
            </div>
          )}
        </div>
      )}

      {/* PHASE 3: BOOM / EXPLODED */}
      {isExploded && (
        <div className="glass-card" style={{ padding: '2rem 1.5rem', width: '100%', maxWidth: '550px', textAlign: 'center', border: '2px solid var(--pressure-red)', background: 'rgba(40, 0, 0, 0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="bomb-boom-scene" aria-hidden="true">
            <div className="bomb-smoke bomb-smoke-one" />
            <div className="bomb-smoke bomb-smoke-two" />
            <div className="bomb-smoke bomb-smoke-three" />
            <img className="bomb-boom-character" src="/images/illustrations/bomb-mascot.svg" alt="" />
            <span className="bomb-boom-word bomb-boom-word-left">ตู้ม!!</span>
            <span className="bomb-boom-word bomb-boom-word-right">ตู้ม!!</span>
            <div className="bomb-explosion-art" aria-hidden="true"><span /><span /><span /><span /><span /><span /></div>
          </div>

          <h1 className="bomb-boom-title">
            ตู้ม!!
          </h1>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            ระเบิดเวลาทำงานสมบูรณ์!
          </p>

          {loser && (
            <div style={{ width: '100%', background: 'rgba(255, 77, 77, 0.2)', border: '2px solid var(--gold)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img 
                src={`/images/avatar/${loser.avatar || loser.avatarId || '1'}.png`}
                alt={loser.name}
                onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                style={{ width: '75px', height: '75px', borderRadius: '50%', border: '3px solid var(--gold)', marginBottom: '0.75rem', objectFit: 'cover' }}
              />
              <h2 style={{ color: 'var(--gold)', fontSize: '1.6rem', margin: 0 }}>
                {loser.name} ถือระเบิดเป็นคนสุดท้าย!
              </h2>
              <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
                โดนทำโทษ ดื่มหมดแก้ว
              </p>
            </div>
          )}

          <button 
            onClick={onStartBombGame} 
            className="primary-button" 
            style={{ fontSize: '1.1rem', padding: '0.85rem 2rem', width: '100%' }}
          >
            จุดชนวนลูกระเบิดถัดไป
          </button>
        </div>
      )}
    </div>
  );
};

export default BombRouletteGame;
