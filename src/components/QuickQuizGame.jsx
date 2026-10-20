import React, { useEffect, useMemo, useRef, useState } from 'react';
import { QUIZ_QUESTIONS } from '../utils/quizQuestions';
import { shuffleArray } from '../utils/random';
import '../styles/global.css';

const QUESTIONS_PER_GAME = 10;
const PER_PLAYER_TIME_SECONDS = 90; // 90 วินาทีต่อผู้เล่น 1 คน (10 ข้อ)

const QuickQuizGame = ({
  gameState,
  currentUser,
  updateGameState,
  isHost
}) => {
  const players = gameState?.players || [];
  const questionIds = gameState?.quizQuestionIds || [];
  const scores = gameState?.scores || {};

  // Track which player's turn it is to take the quiz
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [localIndex, setLocalIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isIntermission, setIsIntermission] = useState(false);
  const [playerTimeLeft, setPlayerTimeLeft] = useState(PER_PLAYER_TIME_SECONDS);
  const [playerAnswers, setPlayerAnswers] = useState({});

  const timerRef = useRef(null);
  const initRef = useRef(false);

  // Load questions based on shared question IDs
  const questions = useMemo(() => {
    return questionIds
      .map((id) => QUIZ_QUESTIONS.find((q) => q.id === id))
      .filter(Boolean);
  }, [questionIds]);

  const total = questions.length;
  const currentQ = questions[localIndex] || null;

  const currentPlayer = players[currentPlayerIdx] || players[0] || { id: 'p1', name: 'Player 1' };
  const currentAnswers = playerAnswers[currentPlayer.id] || {};
  const currentAnswer = currentAnswers[localIndex];
  const isAnswered = Boolean(currentAnswer);
  const answeredCount = Object.keys(currentAnswers).length;

  const currentScore = Object.values(currentAnswers).reduce(
    (sum, ans) => sum + (ans?.isCorrect ? 10 : 0),
    0
  );

  // Initialize questions once if not yet generated
  useEffect(() => {
    if (questionIds.length > 0) return;
    if (initRef.current) return;
    initRef.current = true;

    const pickedIds = shuffleArray(QUIZ_QUESTIONS)
      .slice(0, QUESTIONS_PER_GAME)
      .map((q) => q.id);

    updateGameState({
      quizQuestionIds: pickedIds,
      quizAnswers: {},
      quizStatus: 'PLAYING',
      gameStatus: 'PLAYING',
      scores: {},
      punishment: null
    });
  }, [questionIds.length, updateGameState]);

  // Per-player Countdown Timer
  useEffect(() => {
    if (isIntermission || total === 0 || !currentQ) return;

    timerRef.current = setInterval(() => {
      setPlayerTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isIntermission, total, currentQ, currentPlayerIdx]);

  const handleTimeExpired = () => {
    // Save current score
    updateGameState({
      [`scores.${currentPlayer.id}`]: currentScore
    });
    setIsIntermission(true);
  };

  // Reset selected choice when question index changes
  useEffect(() => {
    setSelectedChoice(null);
    setSubmitting(false);
  }, [localIndex]);

  const handleSelectChoice = (choiceIdx) => {
    if (!currentQ || isAnswered || submitting || playerTimeLeft <= 0 || isIntermission) return;

    setSubmitting(true);
    setSelectedChoice(choiceIdx);
    const isCorrect = choiceIdx === currentQ.correctIndex;

    const updatedAnswers = {
      ...currentAnswers,
      [localIndex]: { choiceIdx, isCorrect }
    };

    const newScore = Object.values(updatedAnswers).reduce(
      (sum, ans) => sum + (ans?.isCorrect ? 10 : 0),
      0
    );

    setPlayerAnswers((prev) => ({
      ...prev,
      [currentPlayer.id]: updatedAnswers
    }));

    // Update global/session score
    updateGameState({
      [`scores.${currentPlayer.id}`]: newScore,
      [`quizAnswers.${currentPlayer.id}.${localIndex}`]: { choiceIdx, isCorrect }
    });

    // Auto-advance
    setTimeout(() => {
      const nextAnsweredCount = Object.keys(updatedAnswers).length;
      if (nextAnsweredCount >= total) {
        // All 10 answered for this player!
        setIsIntermission(true);
      } else {
        // Move to next question
        setLocalIndex((prevIdx) => (prevIdx + 1 < total ? prevIdx + 1 : prevIdx));
      }
      setSubmitting(false);
    }, 850);
  };

  const handleStartNextPlayer = () => {
    const nextIdx = currentPlayerIdx + 1;
    if (nextIdx < players.length) {
      setCurrentPlayerIdx(nextIdx);
      setLocalIndex(0);
      setSelectedChoice(null);
      setPlayerTimeLeft(PER_PLAYER_TIME_SECONDS);
      setIsIntermission(false);
    }
  };

  const handleFinishAllQuiz = () => {
    updateGameState({
      quizStatus: 'ROUND_OVER',
      gameStatus: 'RESULTS'
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  if (questions.length === 0 || !currentQ) {
    return (
      <div className="glass-card" style={{ width: '100%', maxWidth: '680px', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-bright)', marginBottom: '1rem' }}>
          ⚡ QUICK QUIZ (10 ข้อต่อคน)
        </h3>
        <p style={{ color: 'var(--text-secondary)' }}>กำลังเตรียมชุดคำถามสำหรับทุกคน...</p>
      </div>
    );
  }

  const isLastPlayer = currentPlayerIdx + 1 >= players.length;
  const nextPlayer = !isLastPlayer ? players[currentPlayerIdx + 1] : null;

  // ─────────────────────────────────────────────────────────────────────────────
  // INTERMISSION SCREEN: Pass the device to the next player
  // ─────────────────────────────────────────────────────────────────────────────
  if (isIntermission) {
    return (
      <div className="glass-card" style={{ width: '100%', maxWidth: '650px', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🎉</div>
        <h3 style={{ color: 'var(--gold-bright)', fontSize: '1.6rem', marginBottom: '0.25rem', fontFamily: 'var(--font-serif)' }}>
          {currentPlayer.name} ทำควิซเสร็จสิ้น!
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          ตอบถูก {Object.values(currentAnswers).filter(a => a?.isCorrect).length} จาก {total} ข้อ
        </p>

        {/* Score Box */}
        <div style={{
          background: 'rgba(214, 175, 92, 0.15)',
          border: '1px solid var(--gold-bright)',
          borderRadius: '16px',
          padding: '1.25rem',
          maxWidth: '300px',
          margin: '0 auto 2rem',
          textAlign: 'center'
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 0.25rem 0' }}>
            คะแนนของคุณในรอบนี้
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              (มีเวลาทำควิซ 10 ข้อ ภายใน {PER_PLAYER_TIME_SECONDS} วินาที)
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
              🏆 ผู้เล่นทุกคนในห้องทำควิซครบทั้งหมดแล้ว!
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              พร้อมดูว่าใครทำคะแนนสูงสุด และใครจะได้ดื่มบทลงโทษ
            </p>
          </div>
        )}

        {/* Action Button */}
        {!isLastPlayer ? (
          <button
            onClick={handleStartNextPlayer}
            className="primary-button"
            style={{ width: '100%', maxWidth: '380px', padding: '1rem', fontSize: '1.1rem' }}
          >
            เริ่มตาของ {nextPlayer?.name} →
          </button>
        ) : (
          <button
            onClick={handleFinishAllQuiz}
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
  // QUIZ GAMEPLAY SCREEN (Active Player Run)
  // ─────────────────────────────────────────────────────────────────────────────
  const isCriticalTime = playerTimeLeft <= 10;
  const isWarningTime = playerTimeLeft <= 25 && playerTimeLeft > 10;
  const timerColor = isCriticalTime ? '#FF5252' : isWarningTime ? '#FFA726' : 'var(--gold-bright)';
  const timerProgress = Math.max(0, Math.min(100, (playerTimeLeft / PER_PLAYER_TIME_SECONDS) * 100));

  return (
    <div className="glass-card quiz-game-card" style={{ width: '100%', maxWidth: '720px', padding: '1.75rem 1.25rem', textAlign: 'center', boxSizing: 'border-box' }}>
      
      {/* Turn Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
        marginBottom: '1rem',
        padding: '0.65rem 1rem',
        background: 'rgba(11, 6, 16, 0.6)',
        borderRadius: '12px',
        border: '1px solid var(--gold-primary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <img
            src={`/images/avatar/${currentPlayer.avatar || currentPlayer.avatarId || '1'}.png`}
            alt={currentPlayer.name}
            onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
            style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--gold-bright)', objectFit: 'cover' }}
          />
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', fontWeight: '700', letterSpacing: '0.1em' }}>
              CURRENT TURN ({currentPlayerIdx + 1}/{players.length})
            </span>
            <h4 style={{ margin: 0, color: 'var(--gold-bright)', fontSize: '1.05rem', fontFamily: 'var(--font-serif)' }}>
              ตาของ: {currentPlayer.name}
            </h4>
          </div>
        </div>

        <span style={{
          background: 'rgba(214, 175, 92, 0.2)',
          border: '1px solid var(--gold-bright)',
          borderRadius: '20px',
          padding: '0.35rem 0.85rem',
          color: 'var(--gold-bright)',
          fontWeight: '800',
          fontSize: '0.9rem'
        }}>
          คะแนน: {currentScore}
        </span>
      </div>

      {/* Timer Bar */}
      <div style={{
        background: isCriticalTime ? 'rgba(255, 82, 82, 0.15)' : 'rgba(11, 6, 16, 0.65)',
        border: `1px solid ${isCriticalTime ? '#FF5252' : 'rgba(214, 175, 92, 0.3)'}`,
        borderRadius: '12px',
        padding: '0.65rem 1rem',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>⏱️ เวลาที่เหลือ:</span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: '900', color: timerColor }}>
            {formatTime(playerTimeLeft)} ({playerTimeLeft}s)
          </span>
        </div>
        <div style={{ height: '6px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
          <div style={{ width: `${timerProgress}%`, height: '100%', background: timerColor, transition: 'width 0.2s linear' }} />
        </div>
      </div>

      {/* Question Pills */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {questions.map((_, idx) => {
          const ans = currentAnswers[idx];
          const isCurrent = idx === localIndex;
          let pillBg = 'rgba(255, 255, 255, 0.06)';
          let pillBorder = '1px solid rgba(255, 255, 255, 0.15)';
          let pillColor = 'var(--text-muted)';

          if (ans) {
            pillBg = ans.isCorrect ? 'rgba(0, 230, 118, 0.25)' : 'rgba(255, 82, 82, 0.25)';
            pillBorder = ans.isCorrect ? '1px solid #00E676' : '1px solid #FF5252';
            pillColor = ans.isCorrect ? '#00E676' : '#FF6B6B';
          }
          if (isCurrent) {
            pillBorder = '2px solid var(--gold-bright)';
            pillColor = 'var(--gold-bright)';
          }

          return (
            <button
              key={idx}
              onClick={() => setLocalIndex(idx)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: pillBg,
                border: pillBorder,
                color: pillColor,
                fontWeight: '700',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Question Box */}
      <div style={{
        padding: '1.25rem',
        background: 'rgba(11, 6, 16, 0.85)',
        border: '1px solid var(--gold-primary)',
        borderRadius: '14px',
        marginBottom: '1.25rem',
        fontSize: 'clamp(1rem, 3.2vw, 1.2rem)',
        fontWeight: '700',
        color: 'var(--text-main)',
        lineHeight: 1.5,
        minHeight: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <span>
          <strong style={{ color: 'var(--gold-bright)', marginRight: '0.5rem' }}>
            ข้อ {localIndex + 1}/{total}:
          </strong>
          {currentQ.question}
        </span>
      </div>

      {/* Choices Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
        {currentQ.choices.map((choice, idx) => {
          let background = 'rgba(11, 6, 16, 0.75)';
          let border = '1px solid rgba(214, 175, 92, 0.35)';

          if (isAnswered || selectedChoice !== null) {
            if (idx === currentQ.correctIndex) {
              background = 'rgba(0, 230, 118, 0.25)';
              border = '1px solid #00E676';
            } else if (idx === (currentAnswer?.choiceIdx ?? selectedChoice)) {
              background = 'rgba(230, 57, 70, 0.25)';
              border = '1px solid var(--pressure-red)';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelectChoice(idx)}
              disabled={isAnswered || selectedChoice !== null || submitting || playerTimeLeft <= 0}
              style={{
                padding: '0.9rem 1rem',
                minHeight: '58px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                background,
                border,
                color: 'var(--text-main)',
                fontSize: 'clamp(0.88rem, 2.8vw, 1rem)',
                fontWeight: '600',
                cursor: isAnswered || playerTimeLeft <= 0 ? 'default' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {choice}
            </button>
          );
        })}
      </div>

      {/* Answer Explanation */}
      {isAnswered && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          background: currentAnswer.isCorrect ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 82, 82, 0.12)',
          border: `1px solid ${currentAnswer.isCorrect ? '#00E676' : 'rgba(255, 82, 82, 0.4)'}`,
          marginBottom: '1rem'
        }}>
          <p style={{ color: currentAnswer.isCorrect ? '#00E676' : '#FF6B6B', fontWeight: '700', margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>
            {currentAnswer.isCorrect ? '✓ ตอบถูกต้อง! (+10 คะแนน)' : '✕ ตอบผิด!'}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            {currentQ.explanation}
          </p>
        </div>
      )}

      {/* Bottom Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => setLocalIndex((prev) => Math.max(0, prev - 1))}
          disabled={localIndex === 0}
          className="secondary-button"
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', opacity: localIndex === 0 ? 0.35 : 1 }}
        >
          ← ข้อก่อนหน้า
        </button>

        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          ตอบแล้ว {answeredCount} จาก {total} ข้อ
        </span>

        <button
          onClick={() => setLocalIndex((prev) => Math.min(total - 1, prev + 1))}
          disabled={localIndex === total - 1}
          className="secondary-button"
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', opacity: localIndex === total - 1 ? 0.35 : 1 }}
        >
          ข้อถัดไป →
        </button>
      </div>
    </div>
  );
};

export default QuickQuizGame;
