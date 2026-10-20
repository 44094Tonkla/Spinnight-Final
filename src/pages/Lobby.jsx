import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState.jsx';
import CardRuleEditor from '../components/CardRuleEditor';
import '../styles/global.css';

const GAME_BUTTONS = [
  { type: 'SPIN',     label: 'WHEEL / SPIN' },
  { type: 'CARD',     label: 'CARD GAME' },
  { type: 'NEVER',    label: 'NEVER HAVE I' },
  { type: 'BOMB',     label: 'BOMB ROULETTE' },
  { type: 'CAR_DODGE', label: 'CAR DODGE 🚗' },
  { type: 'MEMORY',   label: 'MEMORY BATTLE 🧠' },
  { type: 'QUIZ',     label: 'QUICK QUIZ ⚡' }
];

const Lobby = () => {
  const navigate = useNavigate();
  const {
    gameState,
    setGameType,
    updateCardRules,
    startGame,
    leaveRoom
  } = useGameState();

  const [showRuleEditor, setShowRuleEditor] = useState(false);

  const players = gameState?.players || [];
  const currentGameType = gameState?.gameType || 'SPIN';

  // In pass-and-play, always host
  const isHost = true;

  // Watch for game start and auto-navigate to /game
  useEffect(() => {
    if (gameState?.rawStatus === 'playing' || gameState?.status === 'PLAYING') {
      navigate('/game');
    }
  }, [gameState?.rawStatus, gameState?.status, navigate]);

  const handleSetGameType = (type) => {
    setGameType(type);
    setShowRuleEditor(false);
  };

  const handleStartGame = async () => {
    try {
      await startGame();
      navigate('/game');
    } catch (err) {
      console.error('Failed to start game:', err);
      alert(err.message || 'Failed to start game');
    }
  };

  const handleLeave = async () => {
    await leaveRoom();
    navigate('/');
  };

  const getGameLabel = () => {
    const found = GAME_BUTTONS.find(g => g.type === currentGameType);
    return found ? found.label : 'WHEEL / SPIN';
  };

  return (
    <div style={{
      padding: '2.5rem 1rem 5rem',
      background: 'radial-gradient(circle at 50% 20%, #33192F 0%, #1B0E1F 60%, #0B0610 100%)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: 'var(--text-main)',
      position: 'relative'
    }}>

      {/* Header */}
      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: '700' }}>
        PASS &amp; PLAY
      </p>

      <h2 className="brand-headline" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', marginBottom: '0.5rem', fontWeight: '900', color: 'var(--text-main)' }}>
        {gameState?.roomName || 'FRIDAY NIGHT PARTY'}
      </h2>

      {/* LOCAL badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.35rem 1rem',
        borderRadius: '8px',
        background: 'rgba(11, 6, 16, 0.8)',
        border: '1px solid var(--gold-primary)',
        boxShadow: '0 0 15px rgba(214, 175, 92, 0.2)',
        marginBottom: '0.65rem'
      }}>
        <span style={{ fontSize: '1rem', color: 'var(--gold-bright)', fontWeight: '900', letterSpacing: '0.15em', fontFamily: 'var(--font-serif)' }}>
          📱 LOCAL GAME
        </span>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', letterSpacing: '0.05em' }}>
        {gameState?.mode || 'CLASSIC'} · {gameState?.rounds || 5} Rounds · {players.length} Players
      </p>

      {/* Players Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: '1rem',
        width: '100%',
        maxWidth: '850px',
        marginBottom: '2.5rem'
      }}>
        {players.map((player, index) => {
          const avatarSrc = player.avatar || player.avatarId || '1';
          return (
            <div
              key={player.id}
              className="glass-card"
              style={{
                padding: '1rem 0.75rem',
                textAlign: 'center',
                border: index === 0 ? '2px solid var(--gold-bright)' : '1px solid var(--glass-border-subtle)',
                boxShadow: index === 0 ? '0 0 20px rgba(239, 217, 160, 0.3)' : '0 10px 30px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.45rem',
                position: 'relative'
              }}
            >
              {player.isHost && (
                <span style={{
                  position: 'absolute',
                  top: '-10px',
                  padding: '2px 10px',
                  background: 'linear-gradient(135deg, var(--gold-dark), var(--gold-primary))',
                  color: '#0B0610',
                  fontWeight: '900',
                  borderRadius: '12px',
                  fontSize: '0.6rem',
                  letterSpacing: '0.1em',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                }}>
                  HOST
                </span>
              )}

              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                padding: '2px',
                border: '2px solid #00E676',
                boxShadow: '0 0 12px rgba(0, 230, 118, 0.4)'
              }}>
                <img
                  src={`/images/avatar/${avatarSrc}.png`}
                  alt={player.name}
                  onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              </div>

              <p style={{ fontWeight: '700', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', margin: 0 }}>
                {player.name}
              </p>

              <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#00E676', letterSpacing: '0.08em' }}>
                READY ✓
              </span>
            </div>
          );
        })}
      </div>

      {/* Game Settings Section */}
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '850px',
        padding: '1.75rem',
        marginBottom: '2.5rem',
        border: '1px solid var(--glass-border)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: '700' }}>
            GAME SELECTION
          </p>
          <span style={{ color: 'var(--gold-primary)', fontSize: '0.85rem', fontWeight: '600' }}>
            {gameState?.mode || 'CLASSIC'} MODE · {gameState?.rounds || 5} ROUNDS
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
          {GAME_BUTTONS.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => handleSetGameType(type)}
              style={{
                padding: '0.85rem 0.5rem',
                borderRadius: '10px',
                border: currentGameType === type ? '2px solid var(--gold-bright)' : '1px solid rgba(255,255,255,0.08)',
                background: currentGameType === type ? 'var(--burgundy)' : 'rgba(11, 6, 16, 0.6)',
                color: currentGameType === type ? 'var(--gold-bright)' : 'var(--text-muted)',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '0.85rem',
                boxShadow: currentGameType === type ? '0 0 15px rgba(239, 217, 160, 0.3)' : 'none',
                transition: 'all 0.25s ease'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Card Rule Editor Toggle */}
        {currentGameType === 'CARD' && (
          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <button
              onClick={() => setShowRuleEditor(!showRuleEditor)}
              className="secondary-button"
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
            >
              {showRuleEditor ? 'ซ่อนการตั้งค่ากฎไพ่' : 'ตั้งค่า/ดูกฎไพ่ & PRESETS'}
            </button>
          </div>
        )}
      </div>

      {/* Card Rule Editor Modal */}
      {showRuleEditor && currentGameType === 'CARD' && (
        <CardRuleEditor
          currentRules={gameState.cardRules}
          onSaveRules={(newRules) => {
            updateCardRules(newRules);
            setShowRuleEditor(false);
          }}
          isHost={isHost}
          onClose={() => setShowRuleEditor(false)}
        />
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '420px' }}>
        <button
          onClick={handleStartGame}
          className="primary-button"
          style={{ width: '100%', fontSize: '1.05rem', padding: '1rem' }}
        >
          🎮 START GAME ({getGameLabel()})
        </button>

        {/* Edit Players */}
        <button
          onClick={() => navigate('/create-room')}
          className="secondary-button"
          style={{ width: '100%', fontSize: '0.9rem', padding: '0.75rem' }}
        >
          ✏️ แก้ไขรายชื่อผู้เล่น
        </button>

        <button
          onClick={handleLeave}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'var(--text-muted)',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '0.5rem',
            fontSize: '0.85rem'
          }}
        >
          ออกจากเกม
        </button>
      </div>
    </div>
  );
};

export default Lobby;
