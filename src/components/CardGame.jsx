import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_CARD_RULES } from '../utils/cardDeck';
import CardRuleEditor from './CardRuleEditor';
import '../styles/global.css';

const CardGame = ({ 
  gameState, 
  currentUser,
  onDrawCard, 
  onResetDeck, 
  onUpdateRules, 
  isHost, 
  onLeave 
}) => {
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pendingDraw, setPendingDraw] = useState(false);

  const players = gameState?.players || [];
  const cardRules = gameState?.cardRules || DEFAULT_CARD_RULES;
  const remainingDeck = gameState?.remainingDeck || [];
  const currentCard = gameState?.currentCard || null;
  const drawnHistory = gameState?.drawnHistory || [];
  const deckSize = remainingDeck.length;

  const currentTurnPlayerId = gameState?.currentTurnPlayerId || (players.length > 0 ? players[0].id : null);
  const currentTurnPlayer = players.find(p => p.id === currentTurnPlayerId) || players[0];

  const lastCardIdRef = useRef(currentCard?.id || null);

  // Synchronized animation when a new card is drawn
  useEffect(() => {
    if (currentCard?.id && currentCard.id !== lastCardIdRef.current) {
      lastCardIdRef.current = currentCard.id;
      setIsDrawing(true);
      setPendingDraw(false);
      const timer = setTimeout(() => {
        setIsDrawing(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentCard?.id]);

  const handleDraw = async () => {
    if (isDrawing || pendingDraw || deckSize === 0) return;
    setPendingDraw(true);
    try {
      await onDrawCard();
    } catch (err) {
      console.error('Error drawing card:', err);
    } finally {
      setPendingDraw(false);
    }
  };

  const isSuitRed = currentCard && (currentCard.suit === '♥' || currentCard.suit === '♦');
  const ruleText = currentCard ? (cardRules[currentCard.rank] || 'ไม่มีกฎสำหรับไพ่ใบนี้') : null;

  return (
    <div style={{ width: '100%', maxWidth: '750px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ color: 'var(--gold-bright)', fontWeight: 'bold', fontSize: '1rem' }}>
          🃏 CARD GAME <span className="game-count" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>เหลือไพ่: {deckSize} / 52 ใบ</span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setShowRuleEditor(!showRuleEditor)} 
            className="secondary-button"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            {showRuleEditor ? 'ปิดการตั้งค่ากฎ' : 'ตั้งค่า / ดูกฎไพ่'}
          </button>
          
          <button 
            onClick={onResetDeck} 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '6px', cursor: 'pointer' }}
          >
            สับสำรับใหม่
          </button>
        </div>
      </div>

      {/* Rule Editor Modal */}
      {showRuleEditor && (
        <CardRuleEditor 
          currentRules={cardRules}
          onSaveRules={(newRules) => {
            onUpdateRules(newRules);
            setShowRuleEditor(false);
          }}
          isHost={true}
          onClose={() => setShowRuleEditor(false)}
        />
      )}

      {/* Main Card View Section */}
      <div className="glass-card" style={{ width: '100%', padding: '1.75rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.5rem' }}>
        
        {/* CURRENT TURN PLAYER INDICATOR BANNER */}
        <div style={{
          width: '100%',
          maxWidth: '480px',
          margin: '0 auto 1.5rem',
          padding: '0.75rem 1.25rem',
          background: 'linear-gradient(135deg, rgba(122, 31, 61, 0.45), rgba(51, 25, 47, 0.7))',
          border: '2px solid var(--gold-primary)',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem'
        }}>
          <img
            src={`/images/avatar/${currentTurnPlayer?.avatar || currentTurnPlayer?.avatarId || '1'}.png`}
            alt={currentTurnPlayer?.name}
            onError={(e) => { e.target.src = '/images/avatar/1.png'; }}
            style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2px solid var(--gold-bright)', objectFit: 'cover' }}
          />
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', fontWeight: '700', letterSpacing: '0.1em' }}>
              CURRENT TURN
            </span>
            <h4 style={{ margin: 0, color: '#fff', fontSize: '1.15rem', fontFamily: 'var(--font-serif)' }}>
              ตาของ: <strong style={{ color: 'var(--gold-bright)' }}>{currentTurnPlayer?.name}</strong>
            </h4>
          </div>
        </div>

        {currentCard ? (
          <div key={`${currentCard.id}-${drawnHistory.length}`} className="card-reveal-stage" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {/* Playing Card UI */}
            <div className={`playing-card-shell ${isDrawing ? 'is-drawing' : ''}`} style={{ 
              width: '150px', 
              height: '220px', 
              background: '#fff', 
              borderRadius: '12px', 
              padding: '0.85rem', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(212, 175, 55, 0.4)',
              border: '2px solid var(--gold-primary)',
              color: isSuitRed ? '#d32f2f' : '#212121',
              marginBottom: '1.25rem'
            }}>
              {/* Top Left */}
              <div style={{ textAlign: 'left', lineHeight: 1 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{currentCard.rank}</div>
                <div style={{ fontSize: '1.2rem' }}>{currentCard.suit}</div>
              </div>

              {/* Center Suit */}
              <div style={{ fontSize: '3.5rem', lineHeight: 1, alignSelf: 'center' }}>
                {currentCard.suit}
              </div>

              {/* Bottom Right */}
              <div style={{ textAlign: 'right', lineHeight: 1, transform: 'rotate(180deg)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{currentCard.rank}</div>
                <div style={{ fontSize: '1.2rem' }}>{currentCard.suit}</div>
              </div>
            </div>

            {/* Rule Banner */}
            <div style={{ background: 'rgba(0,0,0,0.5)', border: '2px solid var(--gold-bright)', borderRadius: '12px', padding: '1rem 1.25rem', maxWidth: '480px', width: '100%', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                คำสั่งไพ่ใบนี้ (RANK {currentCard.rank})
              </p>
              <h2 style={{ color: 'var(--gold-bright)', fontSize: '1.4rem', margin: 0, fontWeight: 'bold', lineHeight: 1.3 }}>
                {ruleText}
              </h2>
            </div>
          </div>
        ) : (
          <div style={{ padding: '1.5rem 1rem' }}>
            <img className="game-illustration game-illustration-card" src="/images/illustrations/card-mascot.svg" alt="Card illustration" />
            <h3 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '0.25rem', fontFamily: 'var(--font-serif)' }}>
              สำรับไพ่พร้อมแล้ว (52 ใบ)
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              กดปุ่มด้านล่างเพื่อเริ่มจั่วไพ่ใบแรก
            </p>
          </div>
        )}

        {/* DRAW CARD BUTTON (Always clickable for whoever holds the phone) */}
        {deckSize > 0 ? (
          <button 
            onClick={handleDraw} 
            disabled={isDrawing || pendingDraw}
            className="primary-button" 
            style={{ 
              fontSize: '1.25rem', 
              padding: '0.95rem 2.5rem', 
              width: '100%', 
              maxWidth: '380px', 
              cursor: (isDrawing || pendingDraw) ? 'not-allowed' : 'pointer'
            }}
          >
            {isDrawing || pendingDraw ? 'กำลังจั่ว...' : `🃏 จั่วไพ่ (ตาของ ${currentTurnPlayer?.name})`}
          </button>
        ) : (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <p style={{ color: 'var(--pressure-red)', fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: 'bold' }}>
              ไพ่หมดสำรับแล้ว!
            </p>
            <button onClick={onResetDeck} className="primary-button" style={{ padding: '0.75rem 2rem' }}>
              สับสำรับใหม่เพื่อเล่นต่อ
            </button>
          </div>
        )}
      </div>

      {/* Drawn History Section */}
      {drawnHistory.length > 0 && (
        <div style={{ width: '100%' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '0.5rem' }}>
            ประวัติการจั่วไพ่ (RECENT DRAWS)
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {drawnHistory.slice(-10).reverse().map((c, idx) => {
              const red = c.suit === '♥' || c.suit === '♦';
              return (
                <div 
                  key={c.id + '-' + idx} 
                  style={{ 
                    minWidth: '45px', 
                    padding: '0.35rem', 
                    background: '#fff', 
                    borderRadius: '6px', 
                    color: red ? '#d32f2f' : '#212121', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    border: '1px solid var(--gold-primary)',
                    flexShrink: 0
                  }}
                >
                  {c.rank} {c.suit}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CardGame;
