import React, { useState } from 'react';
import '../styles/global.css';

const QUICK_SUGGESTIONS = [
  'แอบชอบเพื่อนที่อยู่ในห้องนี้',
  'เมาจนภาพตัดจำอะไรไม่ได้เลย',
  'โกหกเพื่อนในโต๊ะนี้เพื่อไม่ต้องมาปาร์ตี้',
  'ทักคนผิดในผับแล้วทำเป็นเนียน',
  'แอบชอบแฟนเก่าของเพื่อน',
  'แอบส่งข้อความหาแฟนเก่าตอนเมา'
];

const NeverHaveIEverGame = ({
  gameState,
  currentUser,
  onPickAsker,
  onSubmitQuestion,
  onSubmitVote,
  onRevealResults,
  isHost
}) => {
  const [questionInput, setQuestionInput] = useState('');

  const players = gameState?.players || [];
  const currentUserId = currentUser?.uid;
  const currentAskerId = gameState?.currentAskerId || null;
  const currentAsker = players.find(p => p.id === currentAskerId);
  const isCurrentAsker = currentUserId === currentAskerId;

  const currentQuestion = gameState?.currentQuestion || '';
  const votes = gameState?.votes || {};
  const roundStatus = gameState?.roundStatus || 'SELECTING_ASKER'; // 'SELECTING_ASKER' | 'TYPING' | 'VOTING' | 'REVEAL'

  const myVote = votes[currentUserId];
  const totalVotedCount = Object.keys(votes).length;

  const everPlayers = players.filter(p => votes[p.id] === 'EVER');
  const neverPlayers = players.filter(p => votes[p.id] === 'NEVER');
  const unvotedPlayers = players.filter(p => !votes[p.id]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!questionInput.trim()) return;
    onSubmitQuestion(questionInput.trim());
    setQuestionInput('');
  };

  return (
    <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Title Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--gold)', fontSize: '2.2rem', margin: 0, fontWeight: 'bold' }}>
          NEVER HAVE I EVER
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          ฉันไม่เคย... เวอร์ชันปั่นสด (ใครเคยทำ ต้องดื่ม!)
        </p>
      </div>

      <div className="never-ambient-scene" aria-hidden="true">
        <span className="ambient-orb ambient-orb-one" />
        <span className="ambient-orb ambient-orb-two" />
        <span className="ambient-star ambient-star-one" />
        <span className="ambient-star ambient-star-two" />
      </div>

      {/* PHASE 1: SELECTING ASKER */}
      {roundStatus === 'SELECTING_ASKER' && (
        <div className="glass-card never-hero-card" style={{ padding: '2.5rem', textAlign: 'center', width: '100%', maxWidth: '500px' }}>
          <img className="game-illustration game-illustration-never" src="/images/illustrations/never-mascot.svg" alt="Cute night illustration" />
          <h3 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '1rem' }}>
            พร้อมสุ่มคนตั้งโจทย์หรือยัง?
          </h3>
          <button 
            onClick={onPickAsker} 
            className="primary-button" 
            style={{ fontSize: '1.3rem', padding: '0.9rem 2.5rem', width: '100%' }}
          >
            สุ่มผู้ตั้งโจทย์ · RANDOM ASKER
          </button>
        </div>
      )}

      {/* PHASE 2: TYPING (Asker writes question) */}
      {roundStatus === 'TYPING' && (
        <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '600px', textAlign: 'center' }}>
          {currentAsker && (
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img 
                src={`/images/avatar/${currentAsker.avatar || currentAsker.avatarId || '1'}.png`}
                alt={currentAsker.name}
                onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid var(--gold)', marginBottom: '0.5rem' }}
              />
              <span style={{ color: 'var(--gold)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                {currentAsker.name} {isCurrentAsker && '(คุณ)'}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                ได้รับเลือกให้เป็นผู้ตั้งโจทย์รอบนี้
              </span>
            </div>
          )}

          {isCurrentAsker ? (
            <form onSubmit={handleFormSubmit}>
              <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', letterSpacing: '1px' }}>
                  พิมพ์คำถาม "ฉันไม่เคย...":
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', border: '2px solid var(--gold)', borderRadius: '6px', padding: '0.5rem 1rem' }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 'bold', fontSize: '1.1rem', marginRight: '0.5rem', whiteSpace: 'nowrap' }}>
                    ฉันไม่เคย...
                  </span>
                  <input 
                    type="text"
                    required
                    placeholder="แอบชอบเพื่อนในห้องนี้"
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.1rem', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Quick suggestions */}
              <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>ตัวอย่างโจทย์ฮิต (กดเลือกได้ทันที):</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {QUICK_SUGGESTIONS.map((text, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuestionInput(text)}
                      style={{ padding: '0.3rem 0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', borderRadius: '15px', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      + {text}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="primary-button" style={{ width: '100%', fontSize: '1.2rem', padding: '0.8rem' }}>
                ส่งคำถามให้ทุกคนโหวต
              </button>
            </form>
          ) : (
            <div className="never-wait-state" style={{ padding: '2rem 1rem' }}>
              <img className="game-illustration game-illustration-never-small" src="/images/illustrations/never-mascot.svg" alt="Waiting illustration" />
              <h3 style={{ color: 'var(--text-main)', fontSize: '1.3rem' }}>
                กำลังรอคุณ <span style={{ color: 'var(--gold)' }}>{currentAsker?.name}</span> พิมพ์ข้อความ "ฉันไม่เคย..."
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                เตรียมตัวให้พร้อมสำหรับโจทย์สุดปั่น!
              </p>
            </div>
          )}
        </div>
      )}

      {/* PHASE 3: VOTING (All players vote EVER vs NEVER) */}
      {roundStatus === 'VOTING' && (
        <div className="glass-card never-voting-card" style={{ padding: '2rem', width: '100%', maxWidth: '650px', textAlign: 'center' }}>
          <img className="game-illustration game-illustration-never-vote" src="/images/illustrations/never-mascot.svg" alt="Never Have I Ever illustration" />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '2px', marginBottom: '0.5rem' }}>
            โจทย์จาก {currentAsker?.name || 'ผู้ตั้งโจทย์'}
          </p>

          <div style={{ background: 'rgba(0,0,0,0.4)', border: '2px solid var(--gold)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
            <h1 style={{ color: 'var(--gold)', fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>
              "ฉันไม่เคย{currentQuestion}"
            </h1>
          </div>

          <p style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>
            คุณเคยทำสิ่งนี้หรือไม่?
          </p>

          {/* Voting Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
            <button 
              onClick={() => onSubmitVote('EVER')}
              style={{
                flex: 1,
                padding: '1.25rem 1rem',
                borderRadius: '10px',
                border: myVote === 'EVER' ? '3px solid var(--gold)' : '2px solid rgba(255, 77, 77, 0.5)',
                background: myVote === 'EVER' ? 'var(--burgundy)' : 'rgba(255, 77, 77, 0.15)',
                color: myVote === 'EVER' ? 'var(--gold)' : '#fff',
                fontSize: '1.4rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: myVote === 'EVER' ? '0 0 15px rgba(212, 175, 55, 0.5)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              เคย · EVER
            </button>

            <button 
              onClick={() => onSubmitVote('NEVER')}
              style={{
                flex: 1,
                padding: '1.25rem 1rem',
                borderRadius: '10px',
                border: myVote === 'NEVER' ? '3px solid var(--gold)' : '2px solid rgba(0, 150, 255, 0.5)',
                background: myVote === 'NEVER' ? '#0d47a1' : 'rgba(0, 150, 255, 0.15)',
                color: myVote === 'NEVER' ? 'var(--gold)' : '#fff',
                fontSize: '1.4rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: myVote === 'NEVER' ? '0 0 15px rgba(212, 175, 55, 0.5)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              ไม่เคย · NEVER
            </button>
          </div>

          {/* Real-time Vote Progress */}
          <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              โหวตแล้ว: <span style={{ color: 'var(--gold)', fontWeight: 'bold', fontSize: '1.1rem' }}>{totalVotedCount} / {players.length} คน</span>
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {players.map(p => (
                <span 
                  key={p.id}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    background: votes[p.id] ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255,255,255,0.1)',
                    border: votes[p.id] ? '1px solid #00e676' : '1px solid transparent',
                    color: votes[p.id] ? '#00e676' : 'var(--text-muted)'
                  }}
                >
                  {p.name} {votes[p.id] ? '✓' : '...'}
                </span>
              ))}
            </div>
          </div>

          {(isCurrentAsker || isHost) && (
            <button 
              onClick={onRevealResults}
              className="primary-button" 
              style={{ width: '100%', fontSize: '1.1rem', padding: '0.75rem' }}
            >
              เปิดเฉลยผลลัพธ์ทันที
            </button>
          )}
        </div>
      )}

      {/* PHASE 4: REVEAL (Show results: who voted EVER vs NEVER) */}
      {roundStatus === 'REVEAL' && (
        <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '700px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '2px', marginBottom: '0.5rem' }}>
            สรุปผลเฉลยโจทย์
          </p>

          <h2 style={{ color: 'var(--gold)', fontSize: '1.8rem', marginBottom: '2rem' }}>
            "ฉันไม่เคย{currentQuestion}"
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* List of EVER Voted Players */}
            <div style={{ background: 'rgba(255, 77, 77, 0.15)', border: '2px solid var(--pressure-red)', borderRadius: '12px', padding: '1.25rem' }}>
              <h3 style={{ color: 'var(--pressure-red)', fontSize: '1.3rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                คนที่กด "เคยทำ" ({everPlayers.length} คน)
              </h3>
              <p style={{ color: 'var(--gold)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '1rem' }}>
                โดนทำโทษ ดื่ม 1 ช็อต
              </p>

              {everPlayers.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ไม่มีใครเคยทำเรื่องนี้เลย!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {everPlayers.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.8rem', borderRadius: '8px' }}>
                      <img 
                        src={`/images/avatar/${p.avatar || p.avatarId || '1'}.png`}
                        alt={p.name}
                        onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                        style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                      />
                      <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '1rem' }}>{p.name}</span>
                      <span className="result-dot result-dot-ever" aria-hidden="true" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* List of NEVER Voted Players */}
            <div style={{ background: 'rgba(0, 150, 255, 0.15)', border: '2px solid #0096ff', borderRadius: '12px', padding: '1.25rem' }}>
              <h3 style={{ color: '#0096ff', fontSize: '1.3rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                คนที่กด "ไม่เคยทำ" ({neverPlayers.length} คน)
              </h3>
              <p style={{ color: '#00e676', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '1rem' }}>
                รอดตัว! ไม่ต้องดื่ม
              </p>

              {neverPlayers.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ไม่มีใครไม่เคยเลย (เคยทุกคน!)</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {neverPlayers.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.8rem', borderRadius: '8px' }}>
                      <img 
                        src={`/images/avatar/${p.avatar || p.avatarId || '1'}.png`}
                        alt={p.name}
                        onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                        style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                      />
                      <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '1rem' }}>{p.name}</span>
                      <span className="result-dot result-dot-never" aria-hidden="true" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Unvoted Warning if any */}
          {unvotedPlayers.length > 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              ไม่ได้ลงคะแนน: {unvotedPlayers.map(p => p.name).join(', ')}
            </p>
          )}

          {/* Next Round Button */}
          <button 
            onClick={onPickAsker}
            className="primary-button" 
            style={{ fontSize: '1.3rem', padding: '0.9rem 3rem', width: '100%', maxWidth: '400px' }}
          >
            สุ่มคนตั้งโจทย์รอบถัดไป
          </button>
        </div>
      )}
    </div>
  );
};

export default NeverHaveIEverGame;
