import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState.jsx';
import '../styles/global.css';

const RoomCreated = () => {
  const { gameState } = useGameState();
  const navigate = useNavigate();

  const players = gameState?.players || [];

  return (
    <div style={{
      padding: '3rem 1rem 5rem',
      background: 'radial-gradient(circle at 50% 25%, #33192F 0%, #1B0E1F 60%, #0B0610 100%)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: 'var(--text-main)',
      position: 'relative'
    }}>
      {/* Top Success Badge */}
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--gold-dark), var(--gold-primary))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#0B0610',
        fontSize: '2rem',
        fontWeight: '900',
        marginBottom: '1.25rem',
        boxShadow: '0 0 35px rgba(239, 217, 160, 0.5), 0 0 15px rgba(214, 175, 92, 0.4)',
        animation: 'pulseGlow 2.5s infinite alternate'
      }}>
        ✓
      </div>

      <h2 className="brand-headline" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '0.5rem', fontWeight: '900', color: 'var(--text-main)' }}>
        PLAYERS ADDED!
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1.05rem', textAlign: 'center' }}>
        {gameState?.roomName || 'Friday Night Party'} · {gameState?.mode || 'CLASSIC'} · {gameState?.rounds || 5} Rounds
      </p>

      {/* Player Summary Card */}
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '2rem',
        textAlign: 'center',
        border: '1px solid var(--burgundy)',
        borderRadius: '18px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 30px rgba(122, 31, 61, 0.25)',
        marginBottom: '2rem'
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1.25rem', fontWeight: '700' }}>
          {players.length} PLAYERS READY
        </p>

        {/* Player grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
          gap: '0.85rem',
          marginBottom: '2rem'
        }}>
          {players.map((player, index) => (
            <div key={player.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{
                position: 'relative',
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                border: index === 0 ? '2px solid var(--gold-bright)' : '2px solid var(--burgundy)',
                boxShadow: index === 0 ? '0 0 12px rgba(239, 217, 160, 0.5)' : 'none',
                padding: '2px'
              }}>
                <img
                  src={`/images/avatar/${player.avatarId || player.avatar || '1'}.png`}
                  alt={player.name}
                  onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
                {index === 0 && (
                  <span style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '1px 5px',
                    background: 'linear-gradient(135deg, var(--gold-dark), var(--gold-primary))',
                    color: '#0B0610',
                    fontWeight: '900',
                    borderRadius: '6px',
                    fontSize: '0.5rem',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap'
                  }}>
                    HOST
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '72px', textAlign: 'center' }}>
                {player.name}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/lobby')}
          className="primary-button"
          style={{ width: '100%', padding: '0.95rem', fontSize: '1rem' }}
        >
          ENTER LOBBY →
        </button>
      </div>
    </div>
  );
};

export default RoomCreated;
