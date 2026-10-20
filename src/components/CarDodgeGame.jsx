import React, { useState, useEffect, useRef } from 'react';
import '../styles/global.css';

const GAME_DURATION_SECONDS = 30;

const CarDodgeGame = ({ gameState, currentUser, updateGameState, isHost }) => {
  const currentUserId = currentUser?.uid || 'host-1';
  const carDodgeStartedAt = Number(gameState?.carDodgeStartedAt || 0);
  const carDodgeStatus = gameState?.carDodgeStatus || 'PLAYING';
  const isFinished = carDodgeStatus === 'ROUND_OVER' || gameState?.gameStatus === 'RESULTS';

  const [carLane, setCarLane] = useState(1); // 3 lanes: 0, 1, 2
  const [obstacles, setObstacles] = useState([]);
  const [coins, setCoins] = useState([]);
  const [myScore, setMyScore] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [now, setNow] = useState(Date.now());

  const initRef = useRef(false);
  const scoreSubmittedRef = useRef(false);
  const hostConcludedRef = useRef(false);
  const lastSpawnTime = useRef(0);
  const animFrameRef = useRef(null);
  const lastFrameTime = useRef(Date.now());
  const myScoreRef = useRef(0);
  myScoreRef.current = myScore;

  const carLaneRef = useRef(1);
  carLaneRef.current = carLane;

  // Reset refs if carDodgeStartedAt is reset (new game)
  useEffect(() => {
    if (!carDodgeStartedAt) {
      initRef.current = false;
      scoreSubmittedRef.current = false;
      hostConcludedRef.current = false;
      setMyScore(0);
      setObstacles([]);
      setCoins([]);
      setCarLane(1);
      setSpeedMultiplier(1.0);
    }
  }, [carDodgeStartedAt]);

  // Host: Starts the game centrally with a synchronized timestamp
  useEffect(() => {
    if (!isHost || carDodgeStartedAt || initRef.current) return;
    initRef.current = true;
    updateGameState({
      carDodgeStartedAt: Date.now(),
      carDodgeStatus: 'PLAYING',
      gameStatus: 'PLAYING',
      scores: {},
      punishment: null
    });
  }, [isHost, carDodgeStartedAt, updateGameState]);

  // Dino-style progressive acceleration formula (คล้าย Chrome Dinosaur Game)
  // เริ่มจากความเร็ว 1.0x แล้วค่อยๆ เร่งเร็วขึ้นเรื่อยๆ อย่างต่อเนื่องทุกวินาที
  const calcDinoMultiplier = (sec) => {
    const s = Math.max(0, sec);
    return Math.min(3.2, 1.0 + (s * 0.055) + Math.pow(s / 30, 2) * 0.35);
  };

  // Master clock tick for countdown & smooth speed display
  useEffect(() => {
    const timer = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);
      if (carDodgeStartedAt) {
        const sec = Math.max(0, (currentNow - carDodgeStartedAt) / 1000);
        setSpeedMultiplier(calcDinoMultiplier(sec));
      }
    }, 200);
    return () => clearInterval(timer);
  }, [carDodgeStartedAt]);

  const elapsedSeconds = carDodgeStartedAt ? Math.floor((now - carDodgeStartedAt) / 1000) : 0;
  const timeLeft = Math.max(0, GAME_DURATION_SECONDS - elapsedSeconds);
  const isPlaying = carDodgeStartedAt > 0 && timeLeft > 0 && !isFinished;

  // Submit player score once when time expires
  useEffect(() => {
    if (!isPlaying && carDodgeStartedAt > 0 && timeLeft <= 0 && !scoreSubmittedRef.current) {
      scoreSubmittedRef.current = true;
      updateGameState({
        [`scores.${currentUserId}`]: myScoreRef.current
      });
    }
  }, [isPlaying, carDodgeStartedAt, timeLeft, currentUserId, updateGameState]);

  // Host: Transition to RESULTS after time expires and scores are collected
  useEffect(() => {
    if (!isHost || isFinished || !carDodgeStartedAt) return;
    if (timeLeft <= 0) {
      if (hostConcludedRef.current) return;
      hostConcludedRef.current = true;
      const timeout = setTimeout(() => {
        updateGameState({
          carDodgeStatus: 'ROUND_OVER',
          gameStatus: 'RESULTS'
        });
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [isHost, isFinished, carDodgeStartedAt, timeLeft, updateGameState]);

  // Fluid requestAnimationFrame game loop with continuous acceleration
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

      const currentElapsed = Math.max(0, (currentTime - carDodgeStartedAt) / 1000);
      const instantMultiplier = calcDinoMultiplier(currentElapsed);

      const pixelsPerSecond = 180 * instantMultiplier;
      const moveDistance = pixelsPerSecond * delta;

      // Spawn obstacles and coins with progressive interval as speed increases
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
            // 60% chance coin in the safe lane
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

        if (newObs.length > 0) {
          setObstacles(prev => [...prev, ...newObs]);
        }
        if (newCoins.length > 0) {
          setCoins(prev => [...prev, ...newCoins]);
        }
      }

      const currentLane = carLaneRef.current;

      // Move obstacles and check collision
      setObstacles(prev => {
        return prev
          .map(obs => {
            const nextY = obs.y + moveDistance;
            let collided = obs.collided;

            // Collision with player car (lane match & y between 340 and 420)
            if (!collided && obs.lane === currentLane && nextY >= 340 && nextY <= 420) {
              collided = true;
              setMyScore(s => Math.max(0, s - 5));
            }

            return { ...obs, y: nextY, collided };
          })
          .filter(obs => obs.y < 500);
      });

      // Move coins and check collection
      setCoins(prev => {
        return prev
          .map(c => ({ ...c, y: c.y + moveDistance }))
          .filter(c => {
            if (!c.collected && c.lane === currentLane && c.y >= 340 && c.y <= 420) {
              setMyScore(s => s + 10);
              return false; // Collected
            }
            return c.y < 500;
          });
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, carDodgeStartedAt]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setCarLane(l => Math.max(0, l - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setCarLane(l => Math.min(2, l + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '1.75rem', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-bright)' }}>🚗 CAR DODGE</h3>
        <span className="counter">เวลา: {timeLeft}s | ความเร็ว: {speedMultiplier.toFixed(2)}x | คะแนน: {myScore}</span>
      </div>

      {/* Synchronized Countdown Bar */}
      <div style={{
        height: '6px',
        borderRadius: '10px',
        background: 'rgba(255,255,255,0.12)',
        overflow: 'hidden',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          width: `${(timeLeft / GAME_DURATION_SECONDS) * 100}%`,
          height: '100%',
          background: timeLeft <= 5 ? '#FF6B6B' : 'var(--gold-primary)',
          transition: 'width 0.25s linear'
        }} />
      </div>

      {isPlaying ? (
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

          {/* Render Obstacles */}
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
              boxShadow: '0 0 10px rgba(230, 57, 70, 0.6)',
              opacity: obs.collided ? 0.35 : 1,
              transform: obs.collided ? 'scale(0.9)' : 'scale(1)',
              transition: 'transform 0.1s ease'
            }}>
              🚧 
            </div>
          ))}

          {/* Render Coins */}
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

          {/* Render Player Car */}
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
      ) : (
        <div style={{ padding: '2rem 1rem' }}>
          <h4 style={{ color: 'var(--gold-bright)', fontSize: '1.5rem', marginBottom: '1rem' }}>🏁 จบรอบการแข่งขัน!</h4>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            คะแนนของคุณในรอบนี้: <strong style={{ color: 'var(--gold-bright)', fontSize: '1.5rem' }}>{myScore}</strong> คะแนน
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            กำลังรวบรวมคะแนนและนำไปยังหน้าสรุปผล...
          </p>
        </div>
      )}

      {/* Touch Control Buttons for Mobile */}
      {isPlaying && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.25rem' }}>
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
      )}
    </div>
  );
};

export default CarDodgeGame;
