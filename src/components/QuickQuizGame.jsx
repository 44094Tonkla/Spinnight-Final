import React, { useEffect, useMemo, useRef, useState } from 'react';
import { QUIZ_QUESTIONS } from '../utils/quizQuestions';
import { shuffleArray } from '../utils/random';
import '../styles/global.css';

const QUESTIONS_PER_GAME = 10;
const TOTAL_QUIZ_TIME_SECONDS = 120; // 10 ข้อ รวม 120 วินาที

const QuickQuizGame = ({
  gameState,
  currentUser,
  updateGameState,
  isHost
}) => {
  const currentUserId = currentUser?.uid || 'host-1';

  const questionIds = gameState?.quizQuestionIds || [];
  const quizAnswers = gameState?.quizAnswers || {};
  const scores = gameState?.scores || {};
  const players = gameState?.players || [];
  const quizDurationSec = Number(gameState?.quizDurationSec || TOTAL_QUIZ_TIME_SECONDS);

  const [now, setNow] = useState(Date.now());
  const [localIndex, setLocalIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initRef = useRef(false);
  const hostConcludedRef = useRef(false);

  // Load questions based on shared question IDs
  const questions = useMemo(() => {
    return questionIds
      .map((id) => QUIZ_QUESTIONS.find((q) => q.id === id))
      .filter(Boolean);
  }, [questionIds]);

  const total = questions.length;
  const currentQ = questions[localIndex] || null;

  // Answers & Score for the current user
  const myAnswers = quizAnswers[currentUserId] || {};
  const myAnswer = myAnswers[localIndex];
  const isAnswered = Boolean(myAnswer);
  const totalAnsweredCount = Object.keys(myAnswers).length;
  const isAllAnswered = total > 0 && totalAnsweredCount >= total;

  const isFinished =
    gameState?.quizStatus === 'ROUND_OVER' ||
    gameState?.gameStatus === 'RESULTS';

  const myScore = Number(scores[currentUserId] || 0);

  // Synchronized total timestamp
  const quizStartedAt = Number(
    gameState?.quizStartedAt || gameState?.quizQuestionStartedAt || 0
  );

  const elapsedSeconds = quizStartedAt
    ? Math.floor((now - quizStartedAt) / 1000)
    : 0;

  const timeLeft = Math.max(0, quizDurationSec - elapsedSeconds);
  const isTimeExpired = quizStartedAt > 0 && timeLeft <= 0;

  // Reset initRef when questionIds is empty (new game session started)
  useEffect(() => {
    if (questionIds.length === 0) {
      initRef.current = false;
      hostConcludedRef.current = false;
      setLocalIndex(0);
      setSelectedChoice(null);
    }
  }, [questionIds.length]);

  // Host: Initializes one shared question set and master total timer (120s) for the entire room
  useEffect(() => {
    if (questionIds.length > 0) return;
    if (!isHost) return;
    if (initRef.current) return;

    initRef.current = true;
    const pickedIds = shuffleArray(QUIZ_QUESTIONS)
      .slice(0, QUESTIONS_PER_GAME)
      .map((question) => question.id);

    const startTime = Date.now();
    updateGameState({
      quizQuestionIds: pickedIds,
      quizStartedAt: startTime,
      quizQuestionStartedAt: startTime,
      quizDurationSec: TOTAL_QUIZ_TIME_SECONDS,
      quizAnswers: {},
      quizStatus: 'PLAYING',
      gameStatus: 'PLAYING',
      scores: {},
      punishment: null
    });
  }, [isHost, questionIds.length, updateGameState]);

  // Synchronized clock tick (200ms) for high-precision countdown on all devices
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 200);

    return () => clearInterval(timer);
  }, []);

  // When local question changes, reset selected choice state
  useEffect(() => {
    setSelectedChoice(null);
    setSubmitting(false);
  }, [localIndex]);

  // When the 120-second Total Timer expires:
  // Host triggers the shared transition to GameResultsModal so EVERYONE finishes together!
  useEffect(() => {
    if (!isHost || isFinished || !quizStartedAt) return;

    if (timeLeft <= 0) {
      if (hostConcludedRef.current) return;
      hostConcludedRef.current = true;

      const delayTimer = setTimeout(() => {
        updateGameState({
          quizStatus: 'ROUND_OVER',
          gameStatus: 'RESULTS'
        }).catch?.(() => {
          hostConcludedRef.current = false;
        });
      }, 1000);

      return () => clearTimeout(delayTimer);
    }
  }, [isHost, isFinished, quizStartedAt, timeLeft, updateGameState]);

  // Handle answering question at player's own individual pace
  const handleSelectChoice = async (choiceIdx) => {
    if (
      !currentQ ||
      isAnswered ||
      isFinished ||
      submitting ||
      timeLeft <= 0
    ) {
      return;
    }

    setSubmitting(true);
    setSelectedChoice(choiceIdx);

    const isCorrect = choiceIdx === currentQ.correctIndex;

    const previousAnswers = myAnswers;
    const previousScore = Object.values(previousAnswers).reduce(
      (sum, ans) => sum + (ans?.isCorrect ? 10 : 0),
      0
    );
    const updatedScore = previousScore + (isCorrect ? 10 : 0);

    try {
      await updateGameState({
        [`quizAnswers.${currentUserId}.${localIndex}`]: {
          choiceIdx,
          isCorrect,
          answeredAt: Date.now()
        },
        [`scores.${currentUserId}`]: updatedScore
      });

      // Auto-advance to next unanswered question after 900ms feedback
      setTimeout(() => {
        setLocalIndex((prevIdx) => {
          if (prevIdx + 1 < total) {
            return prevIdx + 1;
          }
          return prevIdx;
        });
        setSubmitting(false);
      }, 900);
    } catch (error) {
      console.error('Failed to submit quiz answer:', error);
      setSelectedChoice(null);
      setSubmitting(false);
    }
  };

  // Format MM:SS for countdown display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // 1. Loading / Waiting for Host to prepare questions
  if (questions.length === 0 || !currentQ) {
    if (isFinished) {
      return (
        <div
          className="glass-card"
          style={{
            width: '100%',
            maxWidth: '680px',
            padding: '2rem 1.5rem',
            textAlign: 'center'
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-bright)' }}>⚡ QUICK QUIZ</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem' }}>กำลังรวบรวมผลคะแนนของทุกคน...</p>
        </div>
      );
    }

    return (
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          padding: '2.5rem 1.5rem',
          textAlign: 'center'
        }}
      >
        <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-bright)', marginBottom: '1rem', fontSize: '1.6rem' }}>
          ⚡ QUICK QUIZ (10 ข้อ 120 วินาที)
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          {isHost ? 'กำลังสุ่มชุดคำถามสำหรับห้องนี้...' : 'รอ Host เริ่มเกมและเตรียมชุดคำถาม...'}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          ทุกคนในห้องจะได้รับคำถามชุดเดียวกัน และมีเวลารวม 120 วินาที
        </p>
      </div>
    );
  }

  // Timer Color styling: Gold (>30s) -> Amber (11-30s) -> Red (<=10s)
  const isCriticalTime = timeLeft <= 10;
  const isWarningTime = timeLeft <= 30 && timeLeft > 10;
  const timerColor = isCriticalTime ? '#FF5252' : isWarningTime ? '#FFA726' : 'var(--gold-bright)';
  const timerProgress = Math.max(0, Math.min(100, (timeLeft / quizDurationSec) * 100));

  return (
    <div
      className="glass-card quiz-game-card"
      style={{
        width: '100%',
        maxWidth: '720px',
        padding: '1.75rem 1.25rem',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}
    >
      {/* 📐 TOP HEADER: Title, Total Time & Score */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginBottom: '1rem'
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--gold-bright)',
              fontSize: 'clamp(1.1rem, 3.5vw, 1.4rem)',
              margin: 0
            }}
          >
            ⚡ QUICK QUIZ
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            เวลารวม {quizDurationSec} วินาที · ตอบแยกกันตามความเร็ว
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              background: 'rgba(214, 175, 92, 0.15)',
              border: '1px solid var(--gold-primary)',
              borderRadius: '20px',
              padding: '0.35rem 0.85rem',
              color: 'var(--gold-bright)',
              fontWeight: '800',
              fontSize: '0.88rem'
            }}
          >
            คะแนน: {myScore}
          </span>
        </div>
      </div>

      {/* ⏱️ TOTAL COUNTDOWN BANNER (Responsive for Desktop, iPad, Mobile) */}
      <div
        className="quiz-timer-container"
        style={{
          background: isCriticalTime
            ? 'rgba(255, 82, 82, 0.15)'
            : isWarningTime
            ? 'rgba(255, 167, 38, 0.12)'
            : 'rgba(11, 6, 16, 0.65)',
          border: `1px solid ${isCriticalTime ? '#FF5252' : isWarningTime ? '#FFA726' : 'rgba(214, 175, 92, 0.3)'}`,
          borderRadius: '14px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.25rem',
          transition: 'all 0.3s ease'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
            ⏱️ เวลารวมที่เหลือ:
          </span>
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
              fontWeight: '900',
              color: timerColor,
              letterSpacing: '0.05em'
            }}
          >
            {formatTime(timeLeft)} <small style={{ fontSize: '0.8rem', opacity: 0.8 }}>({timeLeft}s)</small>
          </span>
        </div>

        {/* Synchronized Progress Bar */}
        <div
          style={{
            height: '8px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.12)',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${timerProgress}%`,
              height: '100%',
              background: isCriticalTime ? '#FF5252' : isWarningTime ? '#FFA726' : 'var(--gold-primary)',
              boxShadow: isCriticalTime ? '0 0 10px #FF5252' : 'none',
              transition: 'width 0.2s linear'
            }}
          />
        </div>

        {/* 🚨 RESPONSIVE ALERT NOTIFICATIONS (Always visible on all screen sizes) */}
        {isCriticalTime && timeLeft > 0 && (
          <div
            style={{
              marginTop: '0.65rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '8px',
              background: 'rgba(255, 82, 82, 0.25)',
              border: '1px solid #FF5252',
              color: '#FF6B6B',
              fontSize: '0.85rem',
              fontWeight: '700',
              display: 'block'
            }}
          >
            🔥 10 วินาทีสุดท้าย! ระบบจะสรุปคะแนนพร้อมกันเมื่อหมดเวลา
          </div>
        )}

        {isWarningTime && (
          <div
            style={{
              marginTop: '0.65rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '8px',
              background: 'rgba(255, 167, 38, 0.18)',
              border: '1px solid #FFA726',
              color: '#FFA726',
              fontSize: '0.82rem',
              fontWeight: '600',
              display: 'block'
            }}
          >
            ⚠️ เหลือเวลาอีก {timeLeft} วินาที! เร่งตอบคำถามให้ครบ
          </div>
        )}

        {isTimeExpired && (
          <div
            style={{
              marginTop: '0.65rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              background: 'rgba(255, 82, 82, 0.3)',
              border: '1px solid #FF5252',
              color: '#FFFFFF',
              fontSize: '0.9rem',
              fontWeight: '800',
              display: 'block'
            }}
          >
            ⏰ หมดเวลา 120 วินาทีแล้ว! กำลังเข้าสู่หน้าสรุปผลพร้อมกันทุกคน...
          </div>
        )}
      </div>

      {/* 🧭 QUESTION NAVIGATION PILLS: 1 to 10 */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '1.25rem'
        }}
      >
        {questions.map((_, idx) => {
          const ans = myAnswers[idx];
          const isCurrent = idx === localIndex;
          let pillBg = 'rgba(255, 255, 255, 0.06)';
          let pillBorder = '1px solid rgba(255, 255, 255, 0.15)';
          let pillColor = 'var(--text-muted)';

          if (ans) {
            if (ans.isCorrect) {
              pillBg = 'rgba(0, 230, 118, 0.25)';
              pillBorder = '1px solid #00E676';
              pillColor = '#00E676';
            } else {
              pillBg = 'rgba(255, 82, 82, 0.25)';
              pillBorder = '1px solid #FF5252';
              pillColor = '#FF6B6B';
            }
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
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              title={`ข้อที่ ${idx + 1}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* 📝 QUESTION & CHOICES VIEW */}
      {!isAllAnswered || isAnswered ? (
        <>
          {/* Question Box */}
          <div
            style={{
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
            }}
          >
            <span>
              <strong style={{ color: 'var(--gold-bright)', marginRight: '0.5rem' }}>
                ข้อ {localIndex + 1}/{total}:
              </strong>
              {currentQ.question}
            </span>
          </div>

          {/* Choices Grid (Adaptive for iPad / Tablet / Mobile) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '0.85rem',
              marginBottom: '1.25rem'
            }}
          >
            {currentQ.choices.map((choice, idx) => {
              let background = 'rgba(11, 6, 16, 0.75)';
              let border = '1px solid rgba(214, 175, 92, 0.35)';

              if (isAnswered || selectedChoice !== null) {
                if (idx === currentQ.correctIndex) {
                  background = 'rgba(0, 230, 118, 0.25)';
                  border = '1px solid #00E676';
                } else if (idx === (myAnswer?.choiceIdx ?? selectedChoice)) {
                  background = 'rgba(230, 57, 70, 0.25)';
                  border = '1px solid var(--pressure-red)';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectChoice(idx)}
                  disabled={
                    isAnswered ||
                    selectedChoice !== null ||
                    submitting ||
                    timeLeft <= 0
                  }
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
                    cursor: isAnswered || timeLeft <= 0 ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                >
                  {choice}
                </button>
              );
            })}
          </div>

          {/* Answer Explanation & Result Feedback */}
          {isAnswered && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                background: myAnswer.isCorrect
                  ? 'rgba(0, 230, 118, 0.12)'
                  : 'rgba(255, 82, 82, 0.12)',
                border: `1px solid ${myAnswer.isCorrect ? '#00E676' : 'rgba(255, 82, 82, 0.4)'}`,
                marginBottom: '1.25rem'
              }}
            >
              <p
                style={{
                  color: myAnswer.isCorrect ? '#00E676' : '#FF6B6B',
                  fontWeight: '700',
                  margin: '0 0 0.25rem 0',
                  fontSize: '0.95rem'
                }}
              >
                {myAnswer.isCorrect ? '✓ ตอบถูกต้อง! (+10 คะแนน)' : '✕ ตอบผิด!'}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Bottom Navigation Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              marginTop: '0.5rem'
            }}
          >
            <button
              onClick={() => setLocalIndex((prev) => Math.max(0, prev - 1))}
              disabled={localIndex === 0}
              className="secondary-button"
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.85rem',
                opacity: localIndex === 0 ? 0.35 : 1,
                cursor: localIndex === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              ← ข้อก่อนหน้า
            </button>

            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              ตอบแล้ว {totalAnsweredCount} จาก {total} ข้อ
            </span>

            <button
              onClick={() => setLocalIndex((prev) => Math.min(total - 1, prev + 1))}
              disabled={localIndex === total - 1}
              className="secondary-button"
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.85rem',
                opacity: localIndex === total - 1 ? 0.35 : 1,
                cursor: localIndex === total - 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ข้อถัดไป →
            </button>
          </div>
        </>
      ) : (
        /* 🎉 ALL 10 QUESTIONS COMPLETED SCREEN (Waiting for 120s timer to finish) */
        /* NO premature "ดูสรุปคะแนน" button — player comfortably waits for room timer to finish */
        <div style={{ padding: '1.5rem 0.5rem' }}>
          <div
            style={{
              fontSize: '3rem',
              marginBottom: '0.5rem',
              animation: 'bounce 1s ease infinite'
            }}
          >
            🎯
          </div>
          <h4
            style={{
              color: 'var(--gold-bright)',
              fontSize: '1.4rem',
              marginBottom: '0.5rem',
              fontFamily: 'var(--font-serif)'
            }}
          >
            คุณตอบคำถามครบทั้ง {total} ข้อแล้ว!
          </h4>

          <div
            style={{
              background: 'rgba(214, 175, 92, 0.15)',
              border: '1px solid var(--gold-bright)',
              borderRadius: '14px',
              padding: '1rem',
              maxWidth: '320px',
              margin: '1rem auto',
              textAlign: 'center'
            }}
          >
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 0.25rem 0' }}>
              คะแนนของคุณในรอบนี้
            </p>
            <h2
              style={{
                color: 'var(--gold-bright)',
                fontSize: '2.2rem',
                margin: 0,
                fontFamily: 'var(--font-serif)'
              }}
            >
              {myScore}{' '}
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/ {total * 10}</span>
            </h2>
          </div>

          <p style={{ color: 'var(--gold-primary)', fontSize: '0.95rem', fontWeight: '600' }}>
            ⏱️ เหลือเวลาอีก {formatTime(timeLeft)}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            กำลังรอเพื่อนๆ ในห้องตอบคำถามจนหมดเวลา 120 วินาที เมื่อหมดเวลาระบบจะแสดงผลสรุปและบทลงโทษพร้อมกันทุกคน
          </p>

          <button
            onClick={() => setLocalIndex(0)}
            className="secondary-button"
            style={{ padding: '0.55rem 1.5rem', fontSize: '0.85rem' }}
          >
            🔍 ดูทบทวนคำตอบข้อ 1–10
          </button>
        </div>
      )}
    </div>
  );
};

export default QuickQuizGame;
