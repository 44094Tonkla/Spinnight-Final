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
  const [selectedVoteChoice, setSelectedVoteChoice] = useState(null);

  const players = gameState?.players || [];
  const currentAskerId = gameState?.currentAskerId || null;
  const currentAsker = players.find(p => p.id === currentAskerId) || players[0];

  const currentQuestion = gameState?.currentQuestion || '';
  const votes = gameState?.votes || {};
  const roundStatus = gameState?.roundStatus || 'SELECTING_ASKER'; // 'SELECTING_ASKER' | 'TYPING' | 'VOTING' | 'REVEAL'

  const currentVotingPlayerId = gameState?.currentVotingPlayerId || (players.find(p => !votes[p.id])?.id ?? players[0]?.id);
  const currentVotingPlayer = players.find(p => p.id === currentVotingPlayerId) || players[0];

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

  const handleConfirmVote = () => {
    if (!selectedVoteChoice) return;
    onSubmitVote(selectedVoteChoice);
    setSelectedVoteChoice(null);
  };

  return (
    <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Title Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--gold-bright)', fontSize: '2.2rem', margin: 0, fontWeight: 'bold', fontFamily: 'var(--font-serif)' }}>
          NEVER HAVE I EVER
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          ฉันไม่เคย... เวอร์ชันปั่นสด (สลับกันโหวตทีละคน ใครเคยต้องดื่ม!)
        </p>
      </div>

      {/* PHASE 1: SELECTING ASKER */}
      {roundStatus === 'SELECTING_ASKER' && (
        <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', width: '100%', maxWidth: '500px' }}>
          <img className="game-illustration game-illustration-never" src="/images/illustrations/never-mascot.svg" alt="Never illustration" />
          <h3 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '1rem', fontFamily: 'var(--font-serif)' }}>
            พร้อมสุ่มคนตั้งโจทย์หรือยัง?
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
            ระบบจะสุ่มเพื่อน 1 คนเพื่อตั้งประโยค "ฉันไม่เคย..."
          </p>
          <button 
            onClick={onPickAsker} 
            className="primary-button" 
            style={{ fontSize: '1.2rem', padding: '0.9rem 2.5rem', width: '100%' }}
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
                style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid var(--gold-bright)', marginBottom: '0.5rem', objectFit: 'cover' }}
              />
              <span style={{ color: 'var(--gold-bright)', fontWeight: 'bold', fontSize: '1.3rem', fontFamily: 'var(--font-serif)' }}>
                {currentAsker.name}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                ได้รับเลือกให้เป็นผู้ตั้งโจทย์รอบนี้ (พิมพ์คำถามลงในช่องด้านล่าง)
              </span>
            </div>
          )}

          <form onSubmit={handleFormSubmit}>
            <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
              <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', letterSpacing: '1px' }}>
                พิมพ์คำถาม "ฉันไม่เคย...":
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(11, 6, 16, 0.85)', border: '2px solid var(--gold-primary)', borderRadius: '10px', padding: '0.65rem 1rem' }}>
                <span style={{ color: 'var(--gold-bright)', fontWeight: 'bold', fontSize: '1.1rem', marginRight: '0.5rem', whiteSpace: 'nowrap' }}>
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
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.5rem' }}>ตัวอย่างโจทย์ฮิต (กดเลือกได้ทันที):</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {QUICK_SUGGESTIONS.map((text, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQuestionInput(text)}
                    style={{ padding: '0.35rem 0.75rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-secondary)', borderRadius: '15px', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    + {text}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="primary-button" style={{ width: '100%', fontSize: '1.15rem', padding: '0.9rem' }}>
              ส่งคำถามให้ทุกคนเริ่มโหวต →
            </button>
          </form>
        </div>
      )}

      {/* PHASE 3: VOTING (Pass-and-Play Sequential Voting) */}
      {roundStatus === 'VOTING' && (
        <div className="glass-card" style={{ padding: '2rem 1.5rem', width: '100%', maxWidth: '650px', textAlign: 'center' }}>
          
          {/* Question Display */}
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            โจทย์จาก {currentAsker?.name || 'ผู้ตั้งโจทย์'}
          </p>
          <div style={{ background: 'rgba(0,0,0,0.5)', border: '2px solid var(--gold-bright)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.75rem' }}>
            <h1 style={{ color: 'var(--gold-bright)', fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', margin: 0, fontWeight: 'bold' }}>
              "ฉันไม่เคย{currentQuestion}"
            </h1>
          </div>

          {/* Current Voter Turn Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(122, 31, 61, 0.4), rgba(51, 25, 47, 0.7))',
            border: '2px solid var(--gold-primary)',
            borderRadius: '16px',
            padding: '1.25rem',
            marginBottom: '1.75rem'
          }}>
            <p style={{ color: 'var(--gold-bright)', fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              📱 ส่งเครื่องให้ผู้เล่นคนนี้โหวต:
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <img
                src={`/images/avatar/${currentVotingPlayer?.avatar || currentVotingPlayer?.avatarId || '1'}.png`}
                alt={currentVotingPlayer?.name}
                onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                style={{ width: '55px', height: '55px', borderRadius: '50%', border: '2px solid var(--gold-bright)', objectFit: 'cover' }}
              />
              <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fff', fontFamily: 'var(--font-serif)' }}>
                {currentVotingPlayer?.name}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.5rem', marginBottom: 0 }}>
              (คุณเคยทำสิ่งนี้หรือไม่? เลือกแล้วกดยืนยัน)
            </p>
          </div>

          {/* Voting Choice Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <button 
              onClick={() => setSelectedVoteChoice('EVER')}
              style={{
                flex: 1,
                padding: '1.25rem 1rem',
                borderRadius: '12px',
                border: selectedVoteChoice === 'EVER' ? '3px solid #ff4d4d' : '2px solid rgba(255, 77, 77, 0.4)',
                background: selectedVoteChoice === 'EVER' ? 'var(--burgundy)' : 'rgba(255, 77, 77, 0.12)',
                color: selectedVoteChoice === 'EVER' ? '#fff' : 'var(--text-secondary)',
                fontSize: '1.3rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: selectedVoteChoice === 'EVER' ? '0 0 20px rgba(255, 77, 77, 0.5)' : 'none',
                transform: selectedVoteChoice === 'EVER' ? 'scale(1.03)' : 'scale(1)',
                transition: 'all 0.2s ease'
              }}
            >
              เคย · EVER 🍺
            </button>

            <button 
              onClick={() => setSelectedVoteChoice('NEVER')}
              style={{
                flex: 1,
                padding: '1.25rem 1rem',
                borderRadius: '12px',
                border: selectedVoteChoice === 'NEVER' ? '3px solid #00E676' : '2px solid rgba(0, 230, 118, 0.4)',
                background: selectedVoteChoice === 'NEVER' ? 'rgba(0, 230, 118, 0.25)' : 'rgba(0, 230, 118, 0.12)',
                color: selectedVoteChoice === 'NEVER' ? '#00E676' : 'var(--text-secondary)',
                fontSize: '1.3rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: selectedVoteChoice === 'NEVER' ? '0 0 20px rgba(0, 230, 118, 0.4)' : 'none',
                transform: selectedVoteChoice === 'NEVER' ? 'scale(1.03)' : 'scale(1)',
                transition: 'all 0.2s ease'
              }}
            >
              ไม่เคย · NEVER 😇
            </button>
          </div>

          {/* Confirm Vote Button */}
          <button
            onClick={handleConfirmVote}
            disabled={!selectedVoteChoice}
            className="primary-button"
            style={{
              width: '100%',
              fontSize: '1.15rem',
              padding: '0.95rem',
              opacity: selectedVoteChoice ? 1 : 0.4,
              cursor: selectedVoteChoice ? 'pointer' : 'not-allowed',
              marginBottom: '1.5rem'
            }}
          >
            ✓ ยืนยันคำตอบ & ส่งต่อให้คนถัดไป
          </button>

          {/* Progress Indicators */}
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.85rem', borderRadius: '12px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              โหวตแล้ว: <strong style={{ color: 'var(--gold-bright)' }}>{totalVotedCount} / {players.length} คน</strong>
            </p>
            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {players.map(p => (
                <span 
                  key={p.id}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    background: votes[p.id] ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255,255,255,0.08)',
                    border: votes[p.id] ? '1px solid #00e676' : '1px solid transparent',
                    color: votes[p.id] ? '#00e676' : 'var(--text-muted)'
                  }}
                >
                  {p.name} {votes[p.id] ? '✓' : '...'}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PHASE 4: REVEAL (Results) */}
      {roundStatus === 'REVEAL' && (
        <div className="glass-card" style={{ padding: '2rem 1.5rem', width: '100%', maxWidth: '720px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            สรุปผลเฉลยโจทย์
          </p>

          <h2 style={{ color: 'var(--gold-bright)', fontSize: 'clamp(1.4rem, 4vw, 2rem)', marginBottom: '1.75rem', fontFamily: 'var(--font-serif)' }}>
            "ฉันไม่เคย{currentQuestion}"
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            
            {/* List of EVER Voted Players */}
            <div style={{ background: 'rgba(255, 77, 77, 0.15)', border: '2px solid var(--pressure-red)', borderRadius: '14px', padding: '1.25rem' }}>
              <h3 style={{ color: 'var(--pressure-red)', fontSize: '1.25rem', marginBottom: '0.35rem', fontWeight: 'bold' }}>
                คนที่กด "เคยทำ" ({everPlayers.length} คน)
              </h3>
              <p style={{ color: 'var(--gold-bright)', fontWeight: 'bold', fontSize: '0.88rem', marginBottom: '1rem' }}>
                🍺 โดนทำโทษ ดื่ม 1 ช็อต!
              </p>

              {everPlayers.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>ไม่มีใครเคยทำเรื่องนี้เลย!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {everPlayers.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.8rem', borderRadius: '8px' }}>
                      <img 
                        src={`/images/avatar/${p.avatar || p.avatarId || '1'}.png`}
                        alt={p.name}
                        onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '1rem' }}>{p.name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '1.1rem' }}>🍺</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* List of NEVER Voted Players */}
            <div style={{ background: 'rgba(0, 230, 118, 0.12)', border: '2px solid #00E676', borderRadius: '14px', padding: '1.25rem' }}>
              <h3 style={{ color: '#00E676', fontSize: '1.25rem', marginBottom: '0.35rem', fontWeight: 'bold' }}>
                คนที่กด "ไม่เคยทำ" ({neverPlayers.length} คน)
              </h3>
              <p style={{ color: '#00e676', fontWeight: 'bold', fontSize: '0.88rem', marginBottom: '1rem' }}>
                😇 รอดตัว! ไม่ต้องดื่ม
              </p>

              {neverPlayers.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>ไม่มีใครไม่เคยเลย (เคยทุกคน!)</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {neverPlayers.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.8rem', borderRadius: '8px' }}>
                      <img 
                        src={`/images/avatar/${p.avatar || p.avatarId || '1'}.png`}
                        alt={p.name}
                        onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '1rem' }}>{p.name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '1.1rem' }}>✨</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={onPickAsker}
              className="primary-button" 
              style={{ fontSize: '1.1rem', padding: '0.85rem 2rem' }}
            >
              🔄 สุ่มคนตั้งโจทย์รอบถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NeverHaveIEverGame;
