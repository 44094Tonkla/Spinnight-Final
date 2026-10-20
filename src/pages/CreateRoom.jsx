import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState.jsx';
import '../styles/global.css';

const AVATARS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const ROUND_OPTIONS = [3, 5, 7, 10];

const AvatarGrid = ({ selectedId, onSelect, usedAvatarIds = [], selfId = null }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
    gap: 'clamp(4px, 2vw, 10px)',
    width: '100%',
    boxSizing: 'border-box'
  }}>
    {AVATARS.map(id => {
      const isSelected = selectedId === id;
      const isUsedByOther = usedAvatarIds.includes(id) && id !== selfId;
      return (
        <div
          key={id}
          onClick={() => !isUsedByOther && onSelect(id)}
          style={{
            position: 'relative',
            aspectRatio: '1',
            minWidth: 0,
            boxSizing: 'border-box',
            borderRadius: '50%',
            cursor: isUsedByOther ? 'not-allowed' : 'pointer',
            padding: '2px',
            border: isSelected
              ? '2px solid var(--gold-bright)'
              : '2px solid var(--burgundy)',
            boxShadow: isSelected ? '0 0 10px rgba(239, 217, 160, 0.4)' : 'none',
            transition: 'all 0.25s ease',
            background: isSelected
              ? 'rgba(214, 175, 92, 0.2)'
              : 'rgba(11, 6, 16, 0.5)',
            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
            opacity: isUsedByOther ? 0.3 : 1
          }}
        >
          <img
            src={`/images/avatar/${id}.png`}
            alt={`Avatar ${id}`}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
        </div>
      );
    })}
  </div>
);

const CreateRoom = () => {
  const navigate = useNavigate();
  const { createRoom } = useGameState();

  const [roomName, setRoomName] = useState('Friday Night Party');
  const [mode, setMode] = useState('CLASSIC');
  const [rounds, setRounds] = useState(5);
  const [players, setPlayers] = useState([]);

  // Add/edit player form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formAvatarId, setFormAvatarId] = useState('1');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const usedAvatarIds = players.map(p => p.avatarId);

  const getNextFreeAvatar = () => {
    for (const id of AVATARS) {
      if (!usedAvatarIds.includes(id)) return id;
    }
    return '1';
  };

  const openAddForm = () => {
    setEditingPlayerId(null);
    setFormName('');
    setFormAvatarId(getNextFreeAvatar());
    setShowAddForm(true);
  };

  const openEditForm = (player) => {
    setEditingPlayerId(player.id);
    setFormName(player.name);
    setFormAvatarId(player.avatarId);
    setShowAddForm(true);
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditingPlayerId(null);
    setFormName('');
    setFormAvatarId('1');
  };

  const confirmPlayer = () => {
    if (!formName.trim()) {
      setErrorMsg('กรุณากรอกชื่อผู้เล่น');
      return;
    }
    setErrorMsg('');

    if (editingPlayerId !== null) {
      // Edit existing
      setPlayers(prev =>
        prev.map(p =>
          p.id === editingPlayerId
            ? { ...p, name: formName.trim(), avatarId: formAvatarId }
            : p
        )
      );
    } else {
      // Add new
      if (players.length >= 12) {
        setErrorMsg('ผู้เล่นสูงสุด 12 คน');
        return;
      }
      const newId = `player-${Date.now()}`;
      setPlayers(prev => [
        ...prev,
        {
          id: newId,
          name: formName.trim(),
          avatarId: formAvatarId,
          isHost: prev.length === 0
        }
      ]);
    }
    closeForm();
  };

  const removePlayer = (playerId) => {
    setPlayers(prev => {
      const filtered = prev.filter(p => p.id !== playerId);
      // Ensure first player stays host
      return filtered.map((p, i) => ({ ...p, isHost: i === 0 }));
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (players.length < 2) {
      setErrorMsg('ต้องมีผู้เล่นอย่างน้อย 2 คน');
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      createRoom({
        roomName: roomName.trim() || 'Friday Night Party',
        mode,
        rounds,
        players: players.map(p => ({ name: p.name, avatarId: p.avatarId }))
      });
      navigate('/room-created');
    } catch (err) {
      console.error('Failed to create room:', err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการสร้างห้อง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelStyle = {
    color: 'var(--text-muted)',
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.78rem',
    letterSpacing: '0.12em',
    fontWeight: '700'
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
      position: 'relative',
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '700' }}>
        STEP 01
      </p>

      <h2 className="brand-headline" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', marginBottom: '0.5rem', fontWeight: '900', color: 'var(--text-main)', textAlign: 'center' }}>
        PASS &amp; PLAY SETUP
      </h2>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1rem', textAlign: 'center' }}>
        เพิ่มผู้เล่นทุกคน แล้วเล่นได้เลยในเครื่องเดียว
      </p>

      <form onSubmit={handleSubmit} className="glass-card" style={{
        width: '100%',
        maxWidth: '560px',
        minWidth: 0,
        boxSizing: 'border-box',
        padding: 'clamp(1rem, 5vw, 2.25rem)',
        border: '1px solid var(--burgundy)',
        borderRadius: '18px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 30px rgba(122, 31, 61, 0.25)'
      }}>
        {errorMsg && (
          <div style={{
            padding: '0.85rem 1rem',
            marginBottom: '1.5rem',
            background: 'rgba(230, 57, 70, 0.15)',
            border: '1px solid var(--pressure-red)',
            color: '#FF6B6B',
            borderRadius: '8px',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Room Name */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>ROOM NAME</label>
          <input
            type="text"
            placeholder="Friday Night Party"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="luxury-input"
          />
        </div>

        {/* Game Mode */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>GAME MODE</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {['CLASSIC', 'CHAOS'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                style={{
                  padding: '0.85rem',
                  borderRadius: '8px',
                  border: mode === m ? '1px solid var(--gold-primary)' : '1px solid rgba(255,255,255,0.1)',
                  background: mode === m ? 'var(--burgundy)' : 'var(--bg-dark)',
                  color: mode === m ? 'var(--text-main)' : 'var(--text-muted)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  letterSpacing: '0.08em',
                  transition: 'all 0.25s ease'
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Number of Rounds */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={labelStyle}>NUMBER OF ROUNDS</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.5rem' }}>
            {ROUND_OPTIONS.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRounds(r)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: rounds === r ? '1px solid var(--gold-bright)' : '1px solid rgba(255,255,255,0.1)',
                  background: rounds === r ? 'var(--burgundy)' : 'var(--bg-dark)',
                  color: rounds === r ? 'var(--gold-bright)' : 'var(--text-muted)',
                  fontWeight: '700',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* ── PLAYERS SECTION ── */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>
              PLAYERS ({players.length}/12)
            </label>
            {players.length < 12 && (
              <button
                type="button"
                onClick={openAddForm}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '8px',
                  border: '1px solid var(--gold-primary)',
                  background: 'rgba(214, 175, 92, 0.1)',
                  color: 'var(--gold-primary)',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  letterSpacing: '0.08em'
                }}
              >
                ＋ ADD PLAYER
              </button>
            )}
          </div>

          {players.length === 0 && !showAddForm && (
            <div style={{
              padding: '1.5rem',
              border: '1px dashed rgba(214, 175, 92, 0.3)',
              borderRadius: '12px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.9rem'
            }}>
              ยังไม่มีผู้เล่น — กด <strong style={{ color: 'var(--gold-primary)' }}>＋ ADD PLAYER</strong> เพื่อเพิ่ม
            </div>
          )}

          {/* Player list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: players.length > 0 ? '1rem' : 0 }}>
            {players.map((player, index) => (
              <div
                key={player.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.7rem 1rem',
                  background: 'rgba(11, 6, 16, 0.6)',
                  borderRadius: '10px',
                  border: index === 0
                    ? '1px solid var(--gold-primary)'
                    : '1px solid rgba(255,255,255,0.08)',
                  position: 'relative'
                }}
              >
                {/* Host badge */}
                {index === 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '10px',
                    padding: '1px 8px',
                    background: 'linear-gradient(135deg, var(--gold-dark), var(--gold-primary))',
                    color: '#0B0610',
                    fontWeight: '900',
                    borderRadius: '10px',
                    fontSize: '0.6rem',
                    letterSpacing: '0.1em'
                  }}>
                    HOST
                  </span>
                )}

                {/* Avatar */}
                <img
                  src={`/images/avatar/${player.avatarId}.png`}
                  alt={player.name}
                  onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--burgundy)' }}
                />

                {/* Name */}
                <span style={{ flex: 1, fontWeight: '700', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {player.name}
                </span>

                {/* Edit button */}
                <button
                  type="button"
                  onClick={() => openEditForm(player)}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--text-muted)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    padding: '0.3rem 0.55rem',
                    fontSize: '0.8rem'
                  }}
                >
                  ✏️
                </button>

                {/* Delete button (not for host) */}
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => removePlayer(player.id)}
                    style={{
                      background: 'rgba(230, 57, 70, 0.15)',
                      border: '1px solid var(--pressure-red)',
                      color: '#FF6B6B',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      padding: '0.3rem 0.55rem',
                      fontSize: '0.8rem'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Inline Add/Edit Form */}
          {showAddForm && (
            <div style={{
              padding: '1.25rem',
              background: 'rgba(51, 25, 47, 0.4)',
              borderRadius: '12px',
              border: '1px solid var(--gold-primary)',
              boxShadow: '0 0 20px rgba(214, 175, 92, 0.15)'
            }}>
              <p style={{ color: 'var(--gold-primary)', fontWeight: '700', fontSize: '0.85rem', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                {editingPlayerId !== null ? '✏️ EDIT PLAYER' : '＋ NEW PLAYER'}
              </p>

              {/* Name input */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>PLAYER NAME</label>
                <input
                  type="text"
                  placeholder="ชื่อผู้เล่น"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="luxury-input"
                  autoFocus
                />
              </div>

              {/* Avatar grid */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>CHOOSE AVATAR</label>
                <AvatarGrid
                  selectedId={formAvatarId}
                  onSelect={setFormAvatarId}
                  usedAvatarIds={usedAvatarIds}
                  selfId={editingPlayerId !== null ? players.find(p => p.id === editingPlayerId)?.avatarId : null}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={confirmPlayer}
                  className="primary-button"
                  style={{ flex: 1, padding: '0.75rem', fontSize: '0.9rem' }}
                >
                  {editingPlayerId !== null ? 'SAVE CHANGES' : 'ADD'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--text-muted)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="primary-button"
          disabled={isSubmitting || players.length < 2}
          title={players.length < 2 ? 'ต้องมีผู้เล่นอย่างน้อย 2 คน' : ''}
          style={{
            width: '100%',
            fontSize: '1rem',
            padding: '1rem',
            opacity: players.length < 2 ? 0.55 : 1,
            cursor: players.length < 2 ? 'not-allowed' : 'pointer'
          }}
        >
          {isSubmitting ? 'SETTING UP...' : `START LOBBY → (${players.length} ผู้เล่น)`}
        </button>

        {players.length < 2 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.65rem' }}>
            เพิ่มผู้เล่นอย่างน้อย 2 คนก่อนเริ่ม
          </p>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <Link
            to="/"
            style={{ color: 'var(--text-very-muted)', fontSize: '0.85rem', textDecoration: 'none', transition: 'color 0.2s ease' }}
            onMouseEnter={(e) => e.target.style.color = 'var(--text-secondary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-very-muted)'}
          >
            ← Back to Home
          </Link>
        </div>
      </form>
    </div>
  );
};

export default CreateRoom;
