import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState.jsx';
import CardGame from '../components/CardGame';
import NeverHaveIEverGame from '../components/NeverHaveIEverGame';
import BombRouletteGame from '../components/BombRouletteGame';
import SpinWheelGame from '../components/SpinWheelGame';
import CarDodgeGame from '../components/CarDodgeGame';
import MemoryBattleGame from '../components/MemoryBattleGame';
import QuickQuizGame from '../components/QuickQuizGame';
import GameResultsModal from '../components/GameResultsModal';
import '../styles/global.css';

const GameContainer = () => {
  const navigate = useNavigate();
  const { 
    gameState, 
    currentUser, 
    updateGameState,
    drawCard, 
    resetDeck, 
    updateCardRules,
    pickAsker,
    submitQuestion,
    submitVote,
    revealResults,
    startBombGame,
    toggleBombTimerVisibility,
    passBomb,
    triggerExplosion,
    backToLobby, 
    leaveRoom 
  } = useGameState();

  const gameType = gameState?.gameType || 'SPIN';
  const gameStatus = gameState?.gameStatus || 'LOBBY';
  const [showGameIntro, setShowGameIntro] = useState(true);
  const [introSeconds, setIntroSeconds] = useState(5);

  // In pass-and-play, the device holder is always host
  const isHost = true;

  useEffect(() => {
    setShowGameIntro(true);
    setIntroSeconds(5);
  }, [gameType]);

  useEffect(() => {
    if (!showGameIntro) return;
    const interval = window.setInterval(() => {
      setIntroSeconds(prev => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setShowGameIntro(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [showGameIntro]);

  const gameIntro = {
    SPIN: {
      title: 'SPIN · สุ่มว่าใครโดน',
      description: 'วงล้อจะสุ่มเลือกผู้เล่น 1 คนในแต่ละรอบ จากนั้นผู้เล่นที่ถูกเลือกจะได้รับ Challenge และทำภารกิจเพื่อเก็บคะแนน',
      steps: ['Host กด SPIN เพื่อเริ่มสุ่ม', 'วงล้อเลือกผู้เล่นแบบสุ่ม', 'ผู้ถูกเลือกทำ Challenge แล้วรับคะแนน', 'เสร็จแล้วเข้าสู่รอบถัดไป'],
      image: '/images/home/wheel-home.png'
    },
    CARD: {
      title: 'CARD GAME · จั่วไพ่',
      description: 'ผลัดกันจั่วไพ่ทีละคน ไพ่แต่ละใบมีคำสั่งหรือกติกาของตัวเอง ทำตามคำสั่งแล้วส่งตาให้ผู้เล่นถัดไป',
      steps: ['รอถึงตาของตัวเอง', 'กด DRAW CARD เพื่อจั่ว', 'ทำตามคำสั่งบนไพ่', 'ตาจะส่งต่อให้ผู้เล่นคนถัดไป'],
      image: '/images/illustrations/card-mascot.svg'
    },
    NEVER: {
      title: 'NEVER HAVE I EVER · เคยหรือไม่เคย',
      description: 'ระบบจะเลือกคนตั้งคำถาม จากนั้นทุกคนตอบว่าเคยหรือไม่เคย แล้วเปิดผลโหวตพร้อมกัน',
      steps: ['ระบบเลือกคนตั้งคำถาม', 'ผู้ตั้งพิมพ์ประโยค “ฉันไม่เคย...”', 'ทุกคนเลือก EVER หรือ NEVER', 'เปิดผลลัพธ์แล้วเริ่มรอบต่อไป'],
      image: '/images/illustrations/never-mascot.svg'
    },
    BOMB: {
      title: 'BOMB ROULETTE · ส่งต่อระเบิด',
      description: 'ระเบิดจะถูกส่งต่อจากคนหนึ่งไปอีกคนหนึ่ง โดยเวลายังคงนับถอยหลังอยู่เรื่อย ๆ ใครถือระเบิดอยู่เมื่อเวลาหมด คนนั้นเป็นคนที่โดนและต้องดื่มหมดแก้ว',
      steps: ['เริ่มเกมและรับระเบิดจากผู้เล่นที่ถูกสุ่ม', 'ส่งต่อระเบิดให้คนถัดไปก่อนเวลาหมด', 'เวลาจะเดินต่อเนื่องแม้เปลี่ยนคนถือ', 'ถ้าเวลาหมดในมือใคร คนนั้นโดนระเบิด'],
      image: '/images/illustrations/bomb-mascot.svg'
    },
    CAR_DODGE: {
      title: 'CAR DODGE · ขับรถหลบสิ่งกีดขวาง',
      description: 'บังคับรถหลบสิ่งกีดขวางและเก็บเหรียญทองให้ได้มากที่สุดภายในเวลา 30 วินาทีเพื่อทำคะแนนสูงสุด',
      steps: ['ใช้ปุ่มลูกศรซ้าย/ขวา หรือปุ่มบนหน้าจอ', 'เก็บเหรียญเพื่อเพิ่มคะแนน', 'หลบสิ่งกีดขวางเพื่อไม่ให้เสียคะแนน', 'แข่งกันทำคะแนนสูงสุดในห้อง'],
      image: '/images/illustrations/card-mascot.svg'
    },
    MEMORY: {
      title: 'MEMORY BATTLE · จับคู่การ์ด',
      description: 'เปิดการ์ดทีละ 2 ใบเพื่อจับคู่ภาพที่เหมือนกัน แข่งกันจับคู่ให้ครบทุกคู่ด้วยความรวดเร็ว',
      steps: ['คลิกเปิดการ์ดทีละ 2 ใบ', 'หากการ์ดเหมือนกัน จะได้จับคู่และได้คะแนน', 'หากไม่เหมือนกัน การ์ดจะคว่ำลง', 'จับคู่ครบทั้งหมดเพื่อจบเกม'],
      image: '/images/illustrations/never-mascot.svg'
    },
    QUIZ: {
      title: 'QUICK QUIZ · ตอบคำถาม 10 ข้อ',
      description: 'ตอบคำถามความรู้ทั่วไปและปาร์ตี้ 10 ข้อแข่งกับเพื่อนในห้อง สะสมคะแนนให้ได้มากที่สุด',
      steps: ['อ่านคำถามและเลือกตัวเลือกที่ถูกต้อง', 'ตอบถูกรับ +10 คะแนน', 'ตอบครบ 10 ข้อเพื่อดูคะแนนรวม', 'ผู้ที่ได้คะแนนสูงสุดจะเป็นผู้ชนะ'],
      image: '/images/illustrations/bomb-mascot.svg'
    }
  };

  const intro = gameIntro[gameType] || gameIntro.SPIN;
  const players = gameState?.players || [];
  const currentUserId = currentUser?.uid || 'player-0';

  const handleBackToLobby = async () => {
    if (!isHost) {
      alert("เฉพาะ Host เท่านั้นที่มีสิทธิ์กลับหน้า Lobby / เปลี่ยนเกมได้");
      return;
    }
    try {
      await backToLobby();
      navigate('/lobby');
    } catch (err) {
      alert(err.message || "เฉพาะ Host เท่านั้นที่เปลี่ยนเกมได้");
    }
  };

  const handleLeaveRoom = async () => {
    await leaveRoom();
    navigate('/');
  };

  const getGameLabel = () => {
    if (gameType === 'CARD') return 'CARD GAME';
    if (gameType === 'NEVER') return 'NEVER HAVE I EVER';
    if (gameType === 'BOMB') return 'BOMB ROULETTE';
    if (gameType === 'CAR_DODGE') return 'CAR DODGE';
    if (gameType === 'MEMORY') return 'MEMORY BATTLE';
    if (gameType === 'QUIZ') return 'QUICK QUIZ';
    return 'WHEEL SPIN';
  };

  return (
    <div className="game-container-wrapper" style={{ padding: '1.5rem 1rem 4rem' }}>
      
      {/* 📐 GAME TOP NAVIGATION BAR */}
      <div className="game-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            ROOM: <strong style={{ color: 'var(--gold-bright)', fontFamily: 'var(--font-serif)', letterSpacing: '0.1em' }}>{gameState?.roomCode || 'SPIN99'}</strong>
          </span>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <span style={{ color: 'var(--gold-primary)', fontWeight: '700', fontSize: '0.85rem' }}>
            {getGameLabel()}
          </span>
        </div>

        {/* Action Buttons: Change Game (Lobby) vs Leave Room */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            onClick={handleBackToLobby}
            className="secondary-button"
            title={isHost ? "กลับไปยังหน้า Lobby เพื่อเปลี่ยนเลือกเกมใหม่" : "เฉพาะ Host เท่านั้นที่เปลี่ยนเกมได้"}
            style={{ 
              padding: '0.4rem 0.85rem', 
              fontSize: '0.78rem', 
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              opacity: isHost ? 1 : 0.6,
              cursor: isHost ? 'pointer' : 'not-allowed'
            }}
          >
            {isHost ? 'LOBBY / เปลี่ยนเกม' : '🔒 (เฉพาะ Host เปลี่ยนเกม)'}
          </button>

          <button 
            onClick={handleLeaveRoom}
            title="ออกจากห้องนี้แล้วกลับสู่หน้าหลัก"
            style={{ 
              padding: '0.4rem 0.85rem', 
              background: 'rgba(230, 57, 70, 0.15)', 
              border: '1px solid var(--pressure-red)', 
              color: '#FF6B6B', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            LEAVE ROOM
          </button>
        </div>
      </div>

      {/* 🎮 PASS-AND-PLAY TURN INDICATOR BANNER */}
      {['CARD', 'MEMORY', 'CAR_DODGE', 'QUIZ'].includes(gameType) && !showGameIntro && (() => {
        const turnPlayerId = gameState?.currentTurnPlayerId;
        const turnPlayer = players.find(p => p.id === turnPlayerId);
        if (!turnPlayer) return null;
        return (
          <div style={{
            width: '100%',
            maxWidth: '600px',
            margin: '0.75rem auto',
            padding: '0.65rem 1.25rem',
            background: 'linear-gradient(135deg, rgba(122, 31, 61, 0.5), rgba(51, 25, 47, 0.7))',
            border: '1px solid var(--gold-primary)',
            borderRadius: '10px',
            boxShadow: '0 0 20px rgba(214, 175, 92, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            justifyContent: 'center'
          }}>
            <img
              src={`/images/avatar/${turnPlayer.avatar || turnPlayer.avatarId || '1'}.png`}
              alt={turnPlayer.name}
              onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
              style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--gold-bright)' }}
            />
            <span style={{ color: 'var(--gold-bright)', fontWeight: '700', fontSize: '0.9rem' }}>
              🎮 ตาของ <strong>{turnPlayer.name}</strong> — ส่งมือถือให้เพื่อน!
            </span>
          </div>
        );
      })()}

      {showGameIntro && (
        <div className="game-intro-overlay" role="dialog" aria-label="Game instructions">
          <div className="game-intro-backdrop" />
          <div className="game-intro-card">
            <div className="game-intro-glow" />
            <img className="game-intro-illustration" src={intro.image} alt="" aria-hidden="true" />
            <p className="game-intro-kicker">TONIGHT'S RULES</p>
            <h1>{intro.title}</h1>
            <p className="game-intro-description">{intro.description}</p>
            <div className="game-intro-steps">
              {intro.steps.map((step, index) => (
                <div className="game-intro-step" key={step}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
            <div className="game-intro-countdown">
              <span>{introSeconds}</span>
              <small>กำลังเข้าสู่เกม</small>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Game Component Renderer */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, margin: '0.5rem 0' }}>
        {gameStatus === 'RESULTS' ? (
          <GameResultsModal
            gameState={gameState}
            currentUser={currentUser}
            updateGameState={updateGameState}
            isHost={isHost}
            onBackToLobby={handleBackToLobby}
          />
        ) : gameType === 'CARD' ? (
          <CardGame 
            gameState={gameState}
            currentUser={currentUser}
            onDrawCard={drawCard}
            onResetDeck={resetDeck}
            onUpdateRules={updateCardRules}
            isHost={isHost}
            onLeave={handleLeaveRoom}
          />
        ) : gameType === 'NEVER' ? (
          <NeverHaveIEverGame
            gameState={gameState}
            currentUser={currentUser}
            onPickAsker={pickAsker}
            onSubmitQuestion={submitQuestion}
            onSubmitVote={submitVote}
            onRevealResults={revealResults}
            isHost={isHost}
          />
        ) : gameType === 'BOMB' ? (
          <BombRouletteGame
            gameState={gameState}
            currentUser={currentUser}
            onStartBombGame={startBombGame}
            onToggleTimerVisibility={toggleBombTimerVisibility}
            onPassBomb={passBomb}
            onTriggerExplosion={triggerExplosion}
            isHost={isHost}
          />
        ) : gameType === 'CAR_DODGE' ? (
          <CarDodgeGame
            gameState={gameState}
            currentUser={currentUser}
            updateGameState={updateGameState}
            isHost={isHost}
          />
        ) : gameType === 'MEMORY' ? (
          <MemoryBattleGame
            gameState={gameState}
            currentUser={currentUser}
            updateGameState={updateGameState}
            isHost={isHost}
          />
        ) : gameType === 'QUIZ' ? (
          <QuickQuizGame
            gameState={gameState}
            currentUser={currentUser}
            updateGameState={updateGameState}
            isHost={isHost}
          />
        ) : (
          <SpinWheelGame
            gameState={gameState}
            currentUser={currentUser}
            updateGameState={updateGameState}
            isHost={isHost}
            onBackToLobby={handleBackToLobby}
            onLeaveRoom={handleLeaveRoom}
          />
        )}
      </div>

      {/* Active Players Bar Footer */}
      <div style={{ width: '100%', marginTop: 'auto', paddingTop: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {players.map(p => (
          <div 
            key={p.id} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.4rem 0.85rem', 
              background: 'rgba(51, 25, 47, 0.4)', 
              borderRadius: '20px', 
              border: '1px solid rgba(214, 175, 92, 0.2)' 
            }}
          >
            <img 
              src={`/images/avatar/${p.avatar || p.avatarId || '1'}.png`} 
              alt={p.name}
              onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
              style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} 
            />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: '600' }}>
              {p.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameContainer;
