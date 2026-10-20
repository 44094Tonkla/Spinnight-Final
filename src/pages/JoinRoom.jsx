
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState.jsx';
import '../styles/global.css';

const JoinRoom = () => {
  const navigate = useNavigate();
  const { joinRoom } = useGameState();

  const [formData, setFormData] = useState({
    roomCode: '',
    playerName: '',
    avatarId: '1'
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const avatars = Array.from({ length: 12 }, (_, i) => String(i + 1));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.roomCode.trim() || !formData.playerName.trim()) {
      setError('กรุณากรอกรหัสห้องและชื่อของคุณ');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      await joinRoom(
        formData.roomCode.trim().toUpperCase(),
        formData.playerName.trim(),
        formData.avatarId
      );

      navigate('/lobby');
    } catch (err) {
      console.error('Error joining room:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการเข้าร่วมห้อง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="join-room-page">
      <h2 className="brand-headline join-room-title">
        JOIN ROOM
      </h2>

      <p className="join-room-description">
        ใส่รหัสห้องเพื่อเข้าร่วมปาร์ตี้กับเพื่อน
      </p>

      <form
        onSubmit={handleSubmit}
        className="glass-card join-room-form"
      >
        {error && (
          <div className="join-room-error" role="alert">
            {error}
          </div>
        )}

        <div className="join-room-field">
          <label htmlFor="roomCode" className="join-room-label">
            ROOM CODE
          </label>

          <input
            id="roomCode"
            type="text"
            placeholder="ENTER CODE"
            value={formData.roomCode}
            required
            autoComplete="off"
            maxLength={20}
            onChange={(e) =>
              setFormData({
                ...formData,
                roomCode: e.target.value.toUpperCase()
              })
            }
            className="luxury-input join-room-input join-room-code"
          />
        </div>

        <div className="join-room-field">
          <label htmlFor="playerName" className="join-room-label">
            YOUR NAME
          </label>

          <input
            id="playerName"
            type="text"
            placeholder="Enter your name"
            value={formData.playerName}
            required
            maxLength={30}
            autoComplete="nickname"
            onChange={(e) =>
              setFormData({
                ...formData,
                playerName: e.target.value
              })
            }
            className="luxury-input join-room-input"
          />
        </div>

        <div className="join-room-avatar-section">
          <label className="join-room-label">
            CHOOSE AVATAR
          </label>

          <div className="avatar-grid join-room-avatar-grid">
            {avatars.map((id) => {
              const isSelected = formData.avatarId === id;

              return (
                <button
                  key={id}
                  type="button"
                  className={`avatar-choice join-room-avatar ${
                    isSelected ? 'selected' : ''
                  }`}
                  aria-label={`เลือก Avatar ${id}`}
                  aria-pressed={isSelected}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      avatarId: id
                    })
                  }
                >
                  <img
                    src={`/images/avatar/${id}.png`}
                    alt={`Avatar ${id}`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="primary-button join-room-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'JOINING ROOM...' : 'JOIN ROOM'}
        </button>

        <p className="join-room-help">
          Room not found? Check the code and try again.
        </p>

        <div className="join-room-back">
          <Link to="/">
            ← Back to Home
          </Link>
        </div>
      </form>
    </main>
  );
};

export default JoinRoom;
