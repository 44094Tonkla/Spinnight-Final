import React, { useState, useEffect, useRef } from 'react';
import { shuffleArray } from '../utils/random';
import '../styles/global.css';

const DEFAULT_CHALLENGES = [
  { id: 1, title: 'SING A SONG', desc: 'ร้องเพลงที่เพื่อนเลือกให้ 1 ท่อน', points: 10 },
  { id: 2, title: 'BOTTOMS UP', desc: 'ดื่มหมดแก้วในช็อตเดียว!', points: 10 },
  { id: 3, title: 'SECRET TRUTH', desc: 'สารภาพความลับ 1 เรื่องที่ไม่มีใครในห้องนี้รู้', points: 10 },
  { id: 4, title: 'DANCE OFF', desc: 'เต้นท่าสุดฮาเป็นเวลา 15 วินาที', points: 10 },
  { id: 5, title: 'CALL AN EX', desc: 'โทรหาแฟนเก่า หรือยอมดื่ม 2 ช็อต!', points: 15 },
  { id: 6, title: 'FUNNY IMPRESSION', desc: 'เลียนแบบท่าทางเพื่อนในห้อง 1 คนให้ทาย', points: 10 },
  { id: 7, title: 'STARE CHALLENGE', desc: 'จ้องตาเพื่อนฝั่งตรงข้าม 20 วินาที ห้ามยิ้มห้ามหัวเราะ', points: 10 },
  { id: 8, title: 'MASSAGE TIME', desc: 'นวดไหล่ให้คนที่นั่งทางซ้ายมือ 30 วินาที', points: 10 }
];

const SpinWheelGame = ({ gameState, currentUser, updateGameState, isHost, onBackToLobby, onLeaveRoom }) => {
  const players = gameState?.players || [];
  const currentUserId = currentUser?.uid || 'host-1';
  const currentRound = gameState?.currentRound || 1;
  const maxRounds = gameState?.rounds || 5;
  const scores = gameState?.scores || {};
  const selectedPlayer = gameState?.selectedPlayer || null;
  const currentChallenge = gameState?.currentChallenge || null;
  const spinPhase = gameState?.gameStatus || 'LOBBY';
  const spinRotation = gameState?.spinRotation ?? 0;
  const spinStartedAt = gameState?.spinStartedAt;
  const challengeStartedAt = gameState?.challengeStartedAt;
  // Track which challenge IDs have been used to avoid repeats within a session
  const usedChallengeIds = gameState?.usedChallengeIds || [];

  const [rotation, setRotation] = useState(spinRotation);
  const [isSpinningLocal, setIsSpinningLocal] = useState(false);
  const [now, setNow] = useState(Date.now());

  const canvasRef = useRef(null);
  const pickedTransitionRef = useRef(null);

  // Sync clock for challenge timer and animation
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 250);
    return () => clearInterval(timer);
  }, []);

  // Render Canvas Wheel Continuously
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 15;

    ctx.clearRect(0, 0, width, height);

    const sliceCount = Math.max(players.length, 2);
    const sliceAngle = (2 * Math.PI) / sliceCount;

    // Outer Gold Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#C99A3F';
    ctx.shadowColor = 'rgba(239, 217, 160, 0.6)';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.restore();

    // Slices
    const sliceColors = ['#7A1F3D', '#33192F', '#5C1025', '#1B0E1F', '#9C2B4A', '#24132F'];

    for (let i = 0; i < sliceCount; i++) {
      const angle = i * sliceAngle;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = sliceColors[i % sliceColors.length];
      ctx.fill();

      // Gold Divider
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#D6AF5C';
      ctx.stroke();

      // Player Name
      const player = players[i];
      if (player) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#F7EEDD';
        ctx.font = 'bold 13px "Prompt", sans-serif';
        ctx.fillText(player.name.substring(0, 8), radius - 30, 5);
        ctx.restore();
      }
    }

    // Border Rim
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#D6AF5C';
    ctx.stroke();

    // Center Gold Cap
    ctx.beginPath();
    ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#C99A3F';
    ctx.shadowColor = 'rgba(239, 217, 160, 0.8)';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#EFD9A0';
    ctx.stroke();

  }, [players, rotation]);

  // Restore wheel cleanly on LOBBY
  useEffect(() => {
    if (spinPhase === 'LOBBY') {
      setIsSpinningLocal(false);
      pickedTransitionRef.current = null;
    }
  }, [spinPhase, currentRound]);

  // Synchronize wheel rotation across all devices
  useEffect(() => {
    if (spinPhase === 'SPINNING') {
      setIsSpinningLocal(true);
      setRotation(spinRotation);

      const timeout = setTimeout(() => {
        setIsSpinningLocal(false);
        // Only host updates the shared gameStatus to PICKED once animation finishes
        if (isHost && pickedTransitionRef.current !== spinStartedAt) {
          pickedTransitionRef.current = spinStartedAt;
          updateGameState({ gameStatus: 'PICKED' });
        }
      }, 4500);

      return () => clearTimeout(timeout);
    } else {
      setRotation(spinRotation);
      setIsSpinningLocal(false);
    }
  }, [spinPhase, spinRotation, spinStartedAt, isHost, updateGameState]);

  // Challenge Timer calculation from central timestamp
  const challengeElapsed = challengeStartedAt ? Math.floor((now - challengeStartedAt) / 1000) : 0;
  const timerSeconds = Math.max(0, 60 - challengeElapsed);

  // Authorization checks
  const isSelectedPlayer = selectedPlayer?.id === currentUserId;
  const canRevealChallenge = isHost || isSelectedPlayer;
  const canCompleteChallenge = isHost || isSelectedPlayer;

  const handleSpinClick = async () => {
    if (players.length < 2 || isSpinningLocal || !isHost) return;

    setIsSpinningLocal(true);

    // Turn rotation based on round number
    const targetPlayerIndex = (currentRound - 1) % players.length;
    const chosenPlayer = players[targetPlayerIndex] || players[0];

    // Pick challenge without repeat using usedChallengeIds (Fisher-Yates shuffle)
    let available = DEFAULT_CHALLENGES.filter(c => !usedChallengeIds.includes(c.id));
    if (available.length === 0) {
      // All challenges used — reset pool
      available = DEFAULT_CHALLENGES;
    }
    const shuffled = shuffleArray(available);
    const chosenChallenge = shuffled[0];
    const nextUsedChallengeIds = [
      ...(available.length === DEFAULT_CHALLENGES.length ? [] : usedChallengeIds),
      chosenChallenge.id
    ];

    const sliceDeg = 360 / players.length;
    const targetDeg = 3600 + (players.length - targetPlayerIndex) * sliceDeg - sliceDeg / 2;
    const nextRotation = (rotation || 0) + targetDeg;

    setRotation(nextRotation);

    await updateGameState({
      gameStatus: 'SPINNING',
      spinRotation: nextRotation,
      spinStartedAt: Date.now(),
      selectedPlayer: chosenPlayer,
      selectedPlayerId: chosenPlayer.id,
      currentChallenge: chosenChallenge,
      challengeRevealed: false,
      challengeStartedAt: null,
      usedChallengeIds: nextUsedChallengeIds
    });
  };

  const handleContinueToChallenge = async () => {
    if (!canRevealChallenge) return;
    await updateGameState({ 
      gameStatus: 'CHALLENGE',
      challengeRevealed: true,
      challengeStartedAt: Date.now()
    });
  };

  const handleCompleteChallenge = async (awarded = true) => {
    if (!canCompleteChallenge) return;
    const points = awarded && currentChallenge ? (currentChallenge.points || 10) : 0;
    const currentScore = Number(scores[selectedPlayer?.id] || 0);
    const newScore = currentScore + points;

    await updateGameState({
      [`scores.${selectedPlayer?.id}`]: newScore,
      gameStatus: currentRound >= maxRounds ? 'RESULTS' : 'COMPLETE'
    });
  };

  const handleNextRound = async () => {
    if (!isHost) return;
    await updateGameState({
      currentRound: currentRound + 1,
      gameStatus: 'LOBBY',
      selectedPlayer: null,
      selectedPlayerId: null,
      currentChallenge: null,
      challengeRevealed: false,
      challengeStartedAt: null
    });
  };

  const handlePlayAgain = async () => {
    if (!isHost) return;
    await updateGameState({
      currentRound: 1,
      gameStatus: 'LOBBY',
      selectedPlayer: null,
      selectedPlayerId: null,
      currentChallenge: null,
      challengeRevealed: false,
      challengeStartedAt: null,
      scores: {},
      punishment: null,
      usedChallengeIds: []
    });
  };

  const sortedLeaderboard = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

  return (
    <div style={{ width: '100%', maxWidth: '1100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* 1. Header Bar: ROUND & ROOM */}
      <div style={{ 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0.85rem 1.5rem', 
        background: 'rgba(51, 25, 47, 0.45)', 
        border: '1px solid var(--glass-border)', 
        backdropFilter: 'blur(16px)', 
        borderRadius: '14px', 
        marginBottom: '2rem' 
      }}>
        <div style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-primary)', fontWeight: '900', fontSize: '1.2rem', letterSpacing: '0.1em' }}>
          SPINNIGHT
        </div>

        <div style={{ textAlign: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block' }}>ROUND</span>
          <span style={{ color: 'var(--gold-bright)', fontSize: '1.2rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>
            0{currentRound} / 0{maxRounds}
          </span>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block' }}>ROOM</span>
          <span style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', fontWeight: '800', fontFamily: 'var(--font-serif)', letterSpacing: '0.1em' }}>
            {gameState?.roomCode || 'SPIN99'}
          </span>
        </div>
      </div>

      <div className="spin-ambient-scene" aria-hidden="true">
        <span className="spin-orb spin-orb-one" />
        <span className="spin-orb spin-orb-two" />
        <span className="spin-star spin-star-one" />
        <span className="spin-star spin-star-two" />
        <span className="spin-star spin-star-three" />
      </div>

      {/* 2. Main Layout (Scoreboard Left + Main Wheel Center ALWAYS VISIBLE) */}
      {spinPhase !== 'FINISHED' ? (
        <div className="spin-game-grid">
          
          {/* Left Column: SCOREBOARD */}
          <div className="glass-card" style={{ padding: '1.5rem 1.25rem', border: '1px solid var(--glass-border)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: '700' }}>
              SCOREBOARD
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sortedLeaderboard.map((p, idx) => {
                const isRank1 = idx === 0 && (scores[p.id] || 0) > 0;
                return (
                  <div 
                    key={p.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '0.65rem 0.85rem', 
                      borderRadius: '10px', 
                      background: isRank1 ? 'rgba(214, 175, 92, 0.18)' : 'rgba(11, 6, 16, 0.6)', 
                      border: isRank1 ? '1px solid var(--gold-bright)' : '1px solid rgba(255,255,255,0.06)' 
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontWeight: '800', color: isRank1 ? 'var(--gold-bright)' : 'var(--text-muted)', fontSize: '0.9rem', width: '16px' }}>
                        {idx + 1}
                      </span>
                      <img 
                        src={`/images/avatar/${p.avatar || p.avatarId || '1'}.png`} 
                        alt={p.name} 
                        onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', border: isRank1 ? '2px solid var(--gold-bright)' : '1px solid var(--burgundy)', objectFit: 'cover' }} 
                      />
                      <span style={{ fontWeight: '700', fontSize: '0.88rem', color: isRank1 ? 'var(--gold-bright)' : 'var(--text-main)' }}>
                        {p.name}
                      </span>
                    </div>

                    <span style={{ fontFamily: 'var(--font-serif)', fontWeight: '800', color: 'var(--gold-primary)', fontSize: '1rem' }}>
                      {scores[p.id] || 0} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: WHEEL ALWAYS RENDERED + Overlay Modals for Picked / Challenge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', position: 'relative' }}>
            
            {/* Status Headline */}
            <h2 className="brand-headline" style={{ fontSize: '2.25rem', marginBottom: '0.5rem', fontWeight: '900' }}>
              {spinPhase === 'SPINNING' ? "SPINNING..." : spinPhase === 'PICKED' ? `${selectedPlayer?.name || 'PLAYER'} GOT PICKED!` : "WHO'S NEXT?"}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
              {spinPhase === 'SPINNING' ? "โชคชะตากำลังเลือกคุณ..." : spinPhase === 'PICKED' ? "คืนนี้โชคเลือกคุณแล้ว!" : "เตรียมตัวลุ้นว่าใครจะได้เล่นภารกิจรอบนี้"}
            </p>

            {/* Main Wheel View */}
            <div className={`spin-wheel-scene ${spinPhase === 'SPINNING' ? 'is-spinning' : ''} ${spinPhase === 'PICKED' ? 'is-picked' : ''}`} style={{ position: 'relative', width: '340px', height: '340px', marginBottom: '2rem' }}>
              
              {/* Pointer Needle Top Center */}
              <div style={{
                position: 'absolute',
                top: '-16px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                width: '0',
                height: '0',
                borderLeft: '14px solid transparent',
                borderRight: '14px solid transparent',
                borderTop: '28px solid var(--gold-bright)',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.8))'
              }} />

              {/* Rotating Wheel Canvas */}
              <div style={{ 
                width: '100%', 
                height: '100%', 
                transform: `rotate(${rotation}deg)`, 
                transition: isSpinningLocal ? 'transform 4.5s cubic-bezier(0.15, 0.9, 0.25, 1)' : 'none' 
              }}>
                <canvas ref={canvasRef} width={340} height={340} style={{ width: '100%', height: '100%' }} />
              </div>

              {/* Player Avatars around Wheel Perimeter */}
              {players.map((p, idx) => {
                const angle = (idx * (360 / players.length) - 90) * (Math.PI / 180);
                const radiusOffset = 180;
                const x = 170 + radiusOffset * Math.cos(angle) - 22;
                const y = 170 + radiusOffset * Math.sin(angle) - 22;

                return (
                  <div key={p.id} style={{
                    position: 'absolute',
                    left: `${x}px`,
                    top: `${y}px`,
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    border: '2px solid var(--gold-bright)',
                    boxShadow: '0 0 12px rgba(239, 217, 160, 0.4)',
                    background: '#0B0610',
                    overflow: 'hidden',
                    zIndex: 5
                  }}>
                    <img 
                      src={`/images/avatar/${p.avatar || p.avatarId || '1'}.png`} 
                      alt={p.name} 
                      onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Spin Button / Phase Controls */}
            {spinPhase === 'LOBBY' && (
              <>
                <div className="round-ready-note">ROUND {String(currentRound).padStart(2, '0')} · READY TO SPIN</div>
                {isHost ? (
                  <button 
                    onClick={handleSpinClick} 
                    disabled={isSpinningLocal || players.length < 2}
                    className="primary-button" 
                    style={{ fontSize: '1.2rem', padding: '1rem 3.5rem' }}
                  >
                    {isSpinningLocal ? 'SPINNING...' : 'SPIN THE WHEEL'}
                  </button>
                ) : (
                  <div className="glass-card" style={{ padding: '0.85rem 2rem', border: '1px solid var(--gold-primary)' }}>
                    <p style={{ color: 'var(--gold-bright)', margin: 0, fontWeight: '600' }}>
                      Waiting for host to spin...
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Modal Overlay for PICKED Phase */}
            {spinPhase === 'PICKED' && (
              <div className="glass-card animate-fade-in" style={{ 
                padding: '2rem 1.75rem', 
                width: '100%', 
                maxWidth: '440px', 
                textAlign: 'center', 
                border: '2px solid var(--gold-bright)',
                boxShadow: '0 0 40px rgba(239, 217, 160, 0.35)',
                marginTop: '1rem'
              }}>
                {selectedPlayer && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <img 
                      src={`/images/avatar/${selectedPlayer.avatar || selectedPlayer.avatarId || '1'}.png`} 
                      alt={selectedPlayer.name}
                      onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                      style={{ width: '85px', height: '85px', borderRadius: '50%', border: '3px solid var(--gold-bright)', marginBottom: '0.75rem', objectFit: 'cover' }}
                    />
                    <h3 className="brand-headline" style={{ fontSize: '1.8rem', margin: 0, color: 'var(--gold-bright)' }}>
                      {selectedPlayer.name}
                    </h3>
                    <p style={{ color: 'var(--text-main)', fontSize: '1.05rem', marginTop: '0.35rem', fontWeight: '700' }}>
                      คืนนี้โชคเลือกคุณ !!!
                    </p>
                  </div>
                )}

                {canRevealChallenge ? (
                  <button onClick={handleContinueToChallenge} className="primary-button" style={{ width: '100%', fontSize: '1rem', padding: '0.85rem' }}>
                    SEE CHALLENGE →
                  </button>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    รอคุณ {selectedPlayer?.name || 'เพื่อน'} กดเปิดเผยภารกิจ...
                  </p>
                )}
              </div>
            )}

            {/* Modal Overlay for CHALLENGE Phase */}
            {spinPhase === 'CHALLENGE' && (
              <div className="glass-card animate-fade-in" style={{ 
                padding: '2rem 1.75rem', 
                width: '100%', 
                maxWidth: '480px', 
                textAlign: 'center',
                border: '1px solid var(--burgundy)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                marginTop: '1rem'
              }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '700' }}>
                  {selectedPlayer?.name}'S CHALLENGE
                </p>

                <h3 className="brand-headline" style={{ fontSize: '1.8rem', color: 'var(--gold-bright)', marginBottom: '0.75rem' }}>
                  {currentChallenge?.title || 'SING A SONG'}
                </h3>

                <p style={{ color: 'var(--text-main)', fontSize: '1.05rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  "{currentChallenge?.desc || 'ร้องเพลงที่เพื่อนเลือกให้ 1 ท่อน'}"
                </p>

                {/* Synchronized Timer Bar */}
                <div style={{ marginBottom: '1.75rem', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>TIMER</span>
                    <span style={{ color: timerSeconds <= 10 ? '#FF6B6B' : 'var(--gold-bright)', fontWeight: 'bold' }}>
                      0:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(11, 6, 16, 0.8)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${(timerSeconds / 60) * 100}%`, 
                      height: '100%', 
                      background: timerSeconds <= 10 ? '#FF6B6B' : 'linear-gradient(90deg, var(--gold-dark), var(--gold-bright))',
                      transition: 'width 0.25s linear'
                    }} />
                  </div>
                </div>

                {/* Action Buttons for Authorized Player */}
                {canCompleteChallenge ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button onClick={() => handleCompleteChallenge(true)} className="primary-button" style={{ padding: '0.85rem' }}>
                      DONE (+{currentChallenge?.points || 10})
                    </button>
                    <button onClick={() => handleCompleteChallenge(false)} className="secondary-button" style={{ padding: '0.85rem' }}>
                      SKIP (0 PTS)
                    </button>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    รอคุณ {selectedPlayer?.name || 'เพื่อน'} ทำภารกิจ...
                  </p>
                )}
              </div>
            )}

            {/* Modal Overlay for COMPLETE Phase */}
            {spinPhase === 'COMPLETE' && (
              <div className="glass-card animate-fade-in" style={{ 
                padding: '2rem 1.75rem', 
                width: '100%', 
                maxWidth: '440px', 
                textAlign: 'center',
                border: '1px solid var(--gold-primary)',
                marginTop: '1rem'
              }}>
                <h3 className="brand-headline" style={{ fontSize: '1.8rem', color: 'var(--gold-bright)', marginBottom: '0.75rem' }}>
                  CHALLENGE COMPLETE!
                </h3>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                  สะสมคะแนนเพิ่มเรียบร้อย! เตรียมตัวสำหรับรอบถัดไป
                </p>

                {isHost ? (
                  <button onClick={handleNextRound} className="primary-button" style={{ width: '100%', fontSize: '1rem', padding: '0.85rem' }}>
                    SPIN NEXT ROUND (ROUND 0{currentRound + 1}) →
                  </button>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    รอหัวหน้าห้องเริ่มหมุนรอบถัดไป...
                  </p>
                )}
              </div>
            )}

          </div>
        </div>
      ) : (
        /* FINISHED: Final Game Podium */
        <div className="glass-card animate-fade-in" style={{ 
          padding: '3rem 2rem', 
          width: '100%', 
          maxWidth: '680px', 
          textAlign: 'center', 
          border: '2px solid var(--gold-bright)',
          boxShadow: '0 0 60px rgba(239, 217, 160, 0.35)'
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '700' }}>
            GAME OVER
          </p>

          <h1 className="brand-headline" style={{ fontSize: '3rem', color: 'var(--gold-bright)', marginBottom: '0.5rem' }}>
            TONIGHT'S CHAOS
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1.05rem' }}>
            จบเกมแล้ว! มาดูกันว่าคืนนี้ใครทำได้ดีที่สุด
          </p>

          {/* Winner Crown Podium */}
          {sortedLeaderboard[0] && (
            <div style={{ 
              background: 'rgba(214, 175, 92, 0.15)', 
              border: '2px solid var(--gold-bright)', 
              borderRadius: '16px', 
              padding: '1.75rem', 
              marginBottom: '2.5rem',
              boxShadow: '0 0 30px rgba(239, 217, 160, 0.3)'
            }}>
              <img 
                src={`/images/avatar/${sortedLeaderboard[0].avatar || sortedLeaderboard[0].avatarId || '1'}.png`} 
                alt="Winner" 
                onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                style={{ width: '85px', height: '85px', borderRadius: '50%', border: '3px solid var(--gold-bright)', marginBottom: '0.75rem', objectFit: 'cover' }} 
              />
              <h2 style={{ color: 'var(--gold-bright)', fontSize: '2rem', margin: 0, fontFamily: 'var(--font-serif)' }}>
                {sortedLeaderboard[0].name}
              </h2>
              <p style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '800', marginTop: '0.25rem' }}>
                WINNER — {scores[sortedLeaderboard[0].id] || 0} POINTS
              </p>
            </div>
          )}

          {/* Action Footer Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {isHost && (
              <button onClick={handlePlayAgain} className="primary-button" style={{ padding: '0.9rem' }}>
                PLAY AGAIN
              </button>
            )}
            <button onClick={onBackToLobby} className="secondary-button" style={{ padding: '0.9rem' }}>
              NEW ROOM / LOBBY
            </button>
            <button onClick={onLeaveRoom} className="secondary-button" style={{ padding: '0.9rem', color: '#FF6B6B', borderColor: 'rgba(255, 107, 107, 0.4)' }}>
              BACK TO HOME
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SpinWheelGame;
