import React, { useState, useEffect, useRef } from 'react';
import '../styles/global.css';

const GAME_DURATION_SECONDS = 30;

const CarDodgeGame = ({ gameState, currentUser, updateGameState, isHost }) => {
  const players = gameState?.players || [];
  const scores = gameState?.scores || {};

  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isIntermission, setIsIntermission] = useState(false);
  const [endReason, setEndReason] = useState(''); // 'COLLISION' | 'TIME_UP'

  const [carLane, setCarLane] = useState(1); // 3 lanes: 0, 1, 2
  const [obstacles, setObstacles] = useState([]);
  const [coins, setCoins] = useState([]);
  const [currentScore, setCurrentScore] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);

  const runStartTime = useRef(null);
  const lastSpawnTime = useRef(0);
  const animFrameRef = useRef(null);
  const lastFrameTime = useRef(Date.now());
  const carLaneRef = useRef(1);
  carLaneRef.current = carLane;
  const currentScoreRef = useRef(0);
  currentScoreRef.current = currentScore;

  const currentPlayer = players[currentPlayerIdx] || players[0] || { id: 'p1', name: 'Player 1' };
  const isLastPlayer = currentPlayerIdx + 1 >= players.length;
  const nextPlayer = !isLastPlayer ? players[currentPlayerIdx + 1] : null;

  // Progressive speed multiplier based on seconds elapsed
  const calcMultiplier = (sec) => {
    const s = Math.max(0, sec);
    return Math.min(3.2, 1.0 + s * 0.055 + Math.pow(s / 30, 2) * 0.35);
  };

  // Start a run for the active player
  const startRun = () => {
    setCarLane(1);
    setObstacles([]);
    setCoins([]);
    setCurrentScore(0);
    setSpeedMultiplier(1.0);
    setTimeLeft(GAME_DURATION_SECONDS);
    runStartTime.current = Date.now();
    lastSpawnTime.current = Date.now();
    lastFrameTime.current = Date.now();
    setIsPlaying(true);
    setIsIntermission(false);
    setEndReason('');
  };

  // End run and record score
  const endRun = (reason) => {
    setIsPlaying(false);
    setEndReason(reason);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const finalScore = currentScoreRef.current;
    // Save score in local session
    updateGameState({
      [`scores.${currentPlayer.id}`]: finalScore
    });

    setIsIntermission(true);
  };

  // Timer countdown while playing
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      if (!runStartTime.current) return;
      const elapsed = Math.floor((Date.now() - runStartTime.current) / 1000);
      const remaining = Math.max(0, GAME_DURATION_SECONDS - elapsed);
      setTimeLeft(remaining);
      setSpeedMultiplier(calcMultiplier(elapsed));

      if (remaining <= 0) {
        clearInterval(timer);
        endRun('TIME_UP');
      }
    }, 200);

    return () => clearInterval(timer);
  }, [isPlaying]);

  // RequestAnimationFrame Game Loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    lastFrameTime.current = Date.now();

    const loop = () => {
      const currentTime = Date.now();
      const delta = Math.min((currentTime - lastFrameTime.current) / 1000, 0.1);
      lastFrameTime.current = currentTime;

      const currentElapsed = Math.max(0, (currentTime - runStartTime.current) / 1000);
      const instantMultiplier = calcMultiplier(currentElapsed);

      const pixelsPerSecond = 180 * instantMultiplier;
      const moveDistance = pixelsPerSecond * delta;

      // Spawn obstacles and coins
      const spawnInterval = Math.max(550, 1700 / Math.pow(instantMultiplier, 0.75));
      if (currentTime - lastSpawnTime.current > spawnInterval) {
        lastSpawnTime.current = currentTime;

        const safeLane = Math.floor(Math.random() * 3);
        const newObs = [];
        const newCoins = [];

        for (let lane = 0; lane < 3; lane++) {
          if (lane !== safeLane) {
            if (Math.random() < 0.75) {
              newObs.push({
                id: currentTime + Math.random(),
                lane,
                y: -50,
                collided: false
              });
            }
          } else {
            if (Math.random() < 0.6) {
              newCoins.push({
                id: currentTime + Math.random(),
                lane,
                y: -50,
                collected: false
              });
            }
          }
        }

        if (newObs.length > 0) setObstacles(prev => [...prev, ...newObs]);
        if (newCoins.length > 0) setCoins(prev => [...prev, ...newCoins]);
      }

      const currentLane = carLaneRef.current;
      let hitObstacle = false;

      // Move obstacles & detect collision
      setObstacles(prev => {
        return prev
          .map(obs => {
            const nextY = obs.y + moveDistance;
            // Collision with car (lane match & y between 340 and 420)
            if (!obs.collided && obs.lane === currentLane && nextY >= 340 && nextY <= 420) {
              hitObstacle = true;
              return { ...obs, y: nextY, collided: true };
            }
            return { ...obs, y: nextY };
          })
          .filter(obs => obs.y < 500);
      });

      // Move coins & detect collection
      setCoins(prev => {
        return prev
          .map(c => ({ ...c, y: c.y + moveDistance }))
          .filter(c => {
            if (!c.collected && c.lane === currentLane && c.y >= 340 && c.y <= 420) {
              setCurrentScore(s => s + 10);
              return false; // collected
            }
            return c.y < 500;
          });
      });

      if (hitObstacle) {
        endRun('COLLISION');
        return;
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isPlaying) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setCarLane(l => Math.max(0, l - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setCarLane(l => Math.min(2, l + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  const handleNextPlayerStart = () => {
    setCurrentPlayerIdx(prev => prev + 1);
    startRun();
  };

  const handleFinishAllDodge = () => {
    updateGameState({
      carDodgeStatus: 'ROUND_OVER',
      gameStatus: 'RESULTS'
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // INTERMISSION SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  if (isIntermission) {
    return (
      <div className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>
          {endReason === 'COLLISION' ? '💥' : '🏁'}
        </div>
        <h3 style={{ color: 'var(--gold-bright)', fontSize: '1.6rem', marginBottom: '0.25rem', fontFamily: 'var(--font-serif)' }}>
          {endReason === 'COLLISION' ? 'ชนสิ่งกีดขวาง!' : 'หมดเวลาการแข่งขัน!'}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          ตาของ {currentPlayer.name} จบลงแล้ว
        </p>

        {/* Score Box */}
        <div style={{
          background: 'rgba(214, 175, 92, 0.15)',
          border: '1px solid var(--gold-bright)',
          borderRadius: '16px',
          padding: '1.25rem',
          maxWidth: '280px',
          margin: '0 auto 2rem',
          textAlign: 'center'
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 0.25rem 0' }}>
            คะแนนสะสม
          </p>
          <h2 style={{ color: 'var(--gold-bright)', fontSize: '2.5rem', margin: 0, fontFamily: 'var(--font-serif)' }}>
            {currentScore} <small style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>pts</small>
          </h2>
        </div>

        {/* Next Player Pass-the-Device Banner */}
        {!isLastPlayer ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(122, 31, 61, 0.4), rgba(51, 25, 47, 0.6))',
            border: '2px solid var(--gold-primary)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <p style={{ color: 'var(--gold-bright)', fontWeight: '800', fontSize: '1.1rem', marginBottom: '0.75rem' }}>
              📱 ส่งต่อเครื่องให้ผู้เล่นคนถัดไป
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <img
                src={`/images/avatar/${nextPlayer.avatar || nextPlayer.avatarId || '1'}.png`}
                alt={nextPlayer.name}
                onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                style={{ width: '55px', height: '55px', borderRadius: '50%', border: '2px solid var(--gold-bright)', objectFit: 'cover' }}
              />
              <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-serif)' }}>
                {nextPlayer.name}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
              (หลบสิ่งกีดขวาง 🚧 และเก็บเหรียญทอง 🪙 ให้นานที่สุด)
            </p>
          </div>
        ) : (
          <div style={{
            background: 'rgba(0, 230, 118, 0.15)',
            border: '2px solid #00E676',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <p style={{ color: '#00E676', fontWeight: '800', fontSize: '1.2rem', margin: 0 }}>
              🏆 ผู้เล่นทุกคนซิ่งครบแล้ว!
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              พร้อมไปดูอันดับคะแนนและสุ่มบทลงโทษคนแพ้
            </p>
          </div>
        )}

        {/* Action Button */}
        {!isLastPlayer ? (
          <button
            onClick={handleNextPlayerStart}
            className="primary-button"
            style={{ width: '100%', maxWidth: '380px', padding: '1rem', fontSize: '1.1rem' }}
          >
            เริ่มซิ่งตาของ {nextPlayer?.name} 🏎️
          </button>
        ) : (
          <button
            onClick={handleFinishAllDodge}
            className="primary-button"
            style={{ width: '100%', maxWidth: '380px', padding: '1rem', fontSize: '1.1rem' }}
          >
            ดูผลสรุปคะแนนรวม & สุ่มบทลงโทษ →
          </button>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // READY SCREEN (Before player starts their run)
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isPlaying) {
    return (
      <div className="glass-card" style={{ width: '100%', maxWidth: '550px', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-bright)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          🚗 CAR DODGE
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          แข่งหลบสิ่งกีดขวางทีละคน (Individual Run)
        </p>

        <div style={{
          background: 'rgba(11, 6, 16, 0.7)',
          border: '1px solid var(--gold-primary)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: '700', letterSpacing: '0.1em' }}>
            รอบที่ {currentPlayerIdx + 1} จาก {players.length} คน
          </span>
          <img
            src={`/images/avatar/${currentPlayer.avatar || currentPlayer.avatarId || '1'}.png`}
            alt={currentPlayer.name}
            onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
            style={{ width: '70px', height: '70px', borderRadius: '50%', border: '3px solid var(--gold-bright)', objectFit: 'cover' }}
          />
          <h2 style={{ margin: 0, color: 'var(--gold-bright)', fontSize: '1.6rem', fontFamily: 'var(--font-serif)' }}>
            ตาของ: {currentPlayer.name}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            หลบสิ่งกีดขวาง 🚧 และเก็บเหรียญทอง 🪙 เพื่อทำคะแนนสูงสุด
          </p>
        </div>

        <button
          onClick={startRun}
          className="primary-button"
          style={{ width: '100%', maxWidth: '350px', padding: '1rem', fontSize: '1.15rem' }}
        >
          เริ่มซิ่งเลย! 🏎️
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GAMEPLAY SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '1.5rem', textAlign: 'center' }}>
      
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img
            src={`/images/avatar/${currentPlayer.avatar || currentPlayer.avatarId || '1'}.png`}
            alt={currentPlayer.name}
            onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
            style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid var(--gold-bright)', objectFit: 'cover' }}
          />
          <span style={{ color: 'var(--gold-bright)', fontWeight: '700', fontSize: '0.95rem' }}>
            {currentPlayer.name}
          </span>
        </div>
        <span className="counter" style={{ fontSize: '0.85rem' }}>
          เวลา: {timeLeft}s | ความเร็ว: {speedMultiplier.toFixed(2)}x | คะแนน: {currentScore}
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '6px', borderRadius: '10px', background: 'rgba(255,255,255,0.12)', overflow: 'hidden', marginBottom: '1.25rem' }}>
        <div style={{
          width: `${(timeLeft / GAME_DURATION_SECONDS) * 100}%`,
          height: '100%',
          background: timeLeft <= 5 ? '#FF6B6B' : 'var(--gold-primary)',
          transition: 'width 0.25s linear'
        }} />
      </div>

      {/* Road Canvas Box */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '360px',
        height: '440px',
        margin: '0 auto',
        background: 'linear-gradient(180deg, #1b0e1f 0%, #0b0610 100%)',
        border: '2px solid var(--gold-primary)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 0 25px rgba(214, 175, 92, 0.3)'
      }}>
        {/* Road Lanes Dividers */}
        <div style={{ position: 'absolute', left: '33%', top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.15)', borderStyle: 'dashed' }} />
        <div style={{ position: 'absolute', left: '66%', top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.15)', borderStyle: 'dashed' }} />

        {/* Obstacles */}
        {obstacles.map(obs => (
          <div key={obs.id} style={{
            position: 'absolute',
            left: `${obs.lane * 33 + 8}%`,
            top: `${obs.y}px`,
            width: '28%',
            height: '35px',
            background: 'var(--pressure-red)',
            borderRadius: '8px',
            border: '1px solid #ff6b6b',
            display: 'grid',
            placeItems: 'center',
            fontSize: '0.8rem',
            fontWeight: '900',
            color: '#fff',
            boxShadow: '0 0 10px rgba(230, 57, 70, 0.6)'
          }}>
            🚧
          </div>
        ))}

        {/* Coins */}
        {coins.map(c => (
          <div key={c.id} style={{
            position: 'absolute',
            left: `${c.lane * 33 + 12}%`,
            top: `${c.y}px`,
            width: '20%',
            height: '30px',
            background: 'var(--gold-primary)',
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            fontSize: '0.9rem',
            boxShadow: '0 0 12px var(--gold-bright)'
          }}>
            🪙
          </div>
        ))}

        {/* Player Car */}
        <div style={{
          position: 'absolute',
          left: `${carLane * 33 + 8}%`,
          bottom: '20px',
          width: '28%',
          height: '60px',
          background: 'linear-gradient(135deg, var(--gold-dark), var(--gold-primary))',
          borderRadius: '10px',
          border: '2px solid var(--gold-bright)',
          display: 'grid',
          placeItems: 'center',
          fontSize: '1.5rem',
          boxShadow: '0 0 15px rgba(239, 217, 160, 0.6)',
          transition: 'left 0.1s cubic-bezier(0.2, 0.8, 0.3, 1)'
        }}>
          🏎️
        </div>
      </div>

      {/* Touch Control Buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.25rem', maxWidth: '360px', margin: '1.25rem auto 0' }}>
        <button
          onClick={() => setCarLane(l => Math.max(0, l - 1))}
          className="secondary-button"
          style={{ flex: 1, padding: '1rem', fontSize: '1.2rem' }}
        >
          ◀ ซ้าย
        </button>
        <button
          onClick={() => setCarLane(l => Math.min(2, l + 1))}
          className="secondary-button"
          style={{ flex: 1, padding: '1rem', fontSize: '1.2rem' }}
        >
          ขวา ▶
        </button>
      </div>
    </div>
  );
};

export default CarDodgeGame;
