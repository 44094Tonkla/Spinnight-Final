import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState.jsx';
import '../styles/global.css';

const Profile = () => {
  const navigate = useNavigate();
  const { currentUser, gameState, leaveRoom } = useGameState();

  const [savedName, setSavedName] = useState(() => {
    return localStorage.getItem('spinnight_player_name') || 'Guest Player';
  });
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    return localStorage.getItem('spinnight_player_avatar') || '1';
  });
  const [isSaved, setIsSaved] = useState(false);

  const avatars = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('spinnight_player_name', savedName);
    localStorage.setItem('spinnight_player_avatar', selectedAvatar);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div style={{ 
      padding: '3rem 1rem 5rem', 
      background: 'radial-gradient(circle at 50% 20%, #33192F 0%, #1B0E1F 60%, #0B0610 100%)', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      color: 'var(--text-main)',
      position: 'relative'
    }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '700' }}>
        USER ACCOUNT
      </p>

      <h2 className="brand-headline" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '2.5rem', fontWeight: '900', color: 'var(--text-main)' }}>
        PLAYER PROFILE
      </h2>

      <div className="glass-card" style={{ 
        width: '100%', 
        maxWidth: '560px', 
        padding: '2.25rem',
        border: '1px solid var(--burgundy)',
        borderRadius: '18px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 30px rgba(122, 31, 61, 0.25)'
      }}>
        {/* User Identity Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1.5rem', 
          marginBottom: '2rem', 
          paddingBottom: '1.75rem', 
          borderBottom: '1px solid rgba(214, 175, 92, 0.2)' 
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            padding: '2px',
            border: '2px solid var(--gold-bright)',
            boxShadow: '0 0 20px rgba(239, 217, 160, 0.4)'
          }}>
            <img 
              src={`/images/avatar/${selectedAvatar}.png`} 
              alt="Profile Avatar" 
              onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
            />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--gold-bright)', marginBottom: '0.25rem', fontFamily: 'var(--font-serif)' }}>
              {savedName}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
              UID: {currentUser?.uid || 'GUEST-SESSION'}
            </p>
            <span style={{ 
              display: 'inline-block', 
              marginTop: '0.5rem', 
              padding: '3px 10px', 
              background: 'var(--burgundy)', 
              color: 'var(--text-main)', 
              fontSize: '0.72rem', 
              borderRadius: '6px',
              fontWeight: '700',
              letterSpacing: '0.05em'
            }}>
              {currentUser?.isAnonymous ? 'GUEST ACCOUNT (ANONYMOUS)' : 'LOCAL GUEST'}
            </span>
          </div>
        </div>

        {/* Current Active Room Card */}
        {gameState?.roomCode ? (
          <div style={{ 
            marginBottom: '2rem', 
            padding: '1.25rem', 
            background: 'rgba(214, 175, 92, 0.1)', 
            border: '1px solid var(--gold-primary)', 
            borderRadius: '12px' 
          }}>
            <p style={{ color: 'var(--gold-primary)', fontSize: '0.78rem', letterSpacing: '0.15em', marginBottom: '0.25rem', fontWeight: '700' }}>
              CURRENT ACTIVE ROOM
            </p>
            <h4 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: '0.75rem', fontFamily: 'var(--font-serif)' }}>
              CODE: {gameState.roomCode} ({gameState.players?.length || 0} Players)
            </h4>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => navigate(gameState.status === 'PLAYING' ? '/game' : '/lobby')} 
                className="primary-button"
                style={{ flex: 1, padding: '0.65rem', fontSize: '0.85rem' }}
              >
                GO TO {gameState.status === 'PLAYING' ? 'GAME' : 'LOBBY'} →
              </button>
              <button 
                onClick={leaveRoom} 
                className="secondary-button"
                style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', color: '#FF6B6B', borderColor: 'rgba(255,107,107,0.4)' }}
              >
                LEAVE
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '2rem', textAlign: 'center', padding: '1.25rem', background: 'rgba(11, 6, 16, 0.6)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>คุณยังไม่ได้อยู่ในห้องใดๆ</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => navigate('/create-room')} className="primary-button" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
                CREATE ROOM
              </button>
              <button onClick={() => navigate('/join-room')} className="secondary-button" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
                JOIN ROOM
              </button>
            </div>
          </div>
        )}

        {/* Profile Settings Form */}
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', fontSize: '0.78rem', letterSpacing: '0.12em', fontWeight: '700' }}>
              DEFAULT DISPLAY NAME
            </label>
            <input 
              type="text" 
              value={savedName} 
              onChange={(e) => setSavedName(e.target.value)}
              className="luxury-input"
            />
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem', fontSize: '0.78rem', letterSpacing: '0.12em', fontWeight: '700' }}>
              DEFAULT AVATAR
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
              {avatars.map(id => {
                const isSelected = selectedAvatar === id;
                return (
                  <div 
                    key={id}
                    onClick={() => setSelectedAvatar(id)}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      padding: '2px',
                      border: isSelected ? '2px solid var(--gold-bright)' : '2px solid var(--burgundy)',
                      boxShadow: isSelected ? '0 0 15px rgba(239, 217, 160, 0.5)' : 'none',
                      transition: 'all 0.25s ease',
                      background: isSelected ? 'rgba(214, 175, 92, 0.2)' : 'rgba(11, 6, 16, 0.5)',
                      transform: isSelected ? 'scale(1.08)' : 'scale(1)'
                    }}
                  >
                    <img 
                      src={`/images/avatar/${id}.png`} 
                      alt={`Avatar ${id}`}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <button type="submit" className="primary-button" style={{ width: '100%', padding: '0.95rem' }}>
            {isSaved ? '✓ SAVED PREFERENCES!' : 'SAVE PROFILE'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
