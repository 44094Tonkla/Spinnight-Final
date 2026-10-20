import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/global.css';

const Home = () => {
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '3rem 1rem 5rem', 
      background: 'radial-gradient(circle at 50% 30%, #33192F 0%, #1B0E1F 50%, #0B0610 90%)', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      color: 'var(--text-main)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Door/Party Texture with dark vignette */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        backgroundImage: 'url(/images/home/door-home.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.08,
        zIndex: 0,
        filter: 'blur(3px)'
      }} />

      {/* Ambient Radial Lights */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '800px',
        height: '800px',
        background: 'radial-gradient(circle, rgba(122, 31, 61, 0.45) 0%, rgba(239, 217, 160, 0.2) 40%, rgba(0, 0, 0, 0) 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div className="home-starfield" aria-hidden="true">
        {Array.from({ length: 34 }).map((_, i) => <span key={i} className={`home-star home-star-${(i % 6) + 1}`} />)}
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '950px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* 2. Label: ✦ SOCIAL PARTY GAME ✦ */}
        <p style={{ 
          color: 'var(--text-muted)', 
          letterSpacing: '0.25em', 
          marginBottom: '1rem', 
          textTransform: 'uppercase', 
          fontSize: '0.82rem',
          fontWeight: '700' 
        }}>
          ✦ SOCIAL PARTY GAME ✦
        </p>

        {/* 3. Main Headline: คืนนี้ใครโดน? */}
        <h1 className="brand-headline" style={{ 
          color: 'var(--text-main)', 
          fontSize: 'clamp(2.75rem, 7vw, 5rem)', 
          marginBottom: '0.75rem', 
          fontWeight: '900',
          lineHeight: 1.15
        }}>
          คืนนี้ใครโดน?
        </h1>

        {/* 4. Sub Headline */}
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: 'clamp(1.05rem, 2vw, 1.3rem)', 
          marginBottom: '2.5rem', 
          maxWidth: '680px',
          fontWeight: '500',
          lineHeight: 1.5
        }}>
          สร้างเกม เพิ่มผู้เล่น แล้วเล่นได้เลยในเครื่องเดียว
        </p>

        {/* 5 & 6. Primary & Secondary Action Buttons (NO EMOJIS) */}
        <div style={{ 
          display: 'flex', 
          justify: 'center', 
          gap: '1.25rem', 
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}>
          <Link to="/create-room" className="primary-button home-action-button" style={{ fontSize: '1.05rem', padding: '1rem 2.5rem' }}>
            CREATE ROOM
          </Link>
          <Link to="/create-room" className="secondary-button home-action-button" style={{ fontSize: '1.05rem', padding: '1rem 2.5rem' }}>
            ADD PLAYERS
          </Link>
        </div>

        {/* 7. Sub-button footnote */}
        <p style={{ color: 'var(--text-very-muted)', fontSize: '0.85rem', marginBottom: '3.5rem', letterSpacing: '0.05em' }}>
          ไม่ต้องสมัคร · เล่นฟรี · 2–12 คน
        </p>

        {/* 8. HERO MAIN VISUAL: Enlarged Wine Glass with Rich Glowing Halo & Idle Floating Animation */}
        <div className="floating-hero-glass" style={{ 
          position: 'relative', 
          margin: '0 auto 4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '480px',
          width: '100%'
        }}>
          {/* Multi-layered Animated Ambient Halo Glow */}
          <div style={{
            position: 'absolute',
            width: '440px',
            height: '440px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(239, 217, 160, 0.45) 0%, rgba(122, 31, 61, 0.5) 45%, transparent 75%)',
            boxShadow: '0 0 100px rgba(122, 31, 61, 0.7), 0 0 60px rgba(214, 175, 92, 0.45)',
            filter: 'blur(25px)',
            zIndex: 0,
            animation: 'pulseGlow 3s ease-in-out infinite alternate'
          }} />

          {/* Enlarged Real Wine Glass Hero Image from Assets */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            padding: '16px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(51, 25, 47, 0.7), rgba(11, 6, 16, 0.4) 75%)',
            border: '2px solid rgba(239, 217, 160, 0.45)',
            boxShadow: '0 25px 65px rgba(0,0,0,0.85), inset 0 0 25px rgba(239, 217, 160, 0.3)',
            overflow: 'hidden'
          }}>
            {/* Shimmer Light Reflection Overlay */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'linear-gradient(45deg, transparent 45%, rgba(255, 255, 255, 0.18) 50%, transparent 55%)',
              animation: 'lightShineSweep 6s infinite',
              pointerEvents: 'none',
              zIndex: 2
            }} />

            <img 
              src="/images/home/wine-glass-home.jpg" 
              alt="SPINNIGHT Wine Glass Hero Visual" 
              style={{ 
                width: '100%', 
                maxWidth: '400px', 
                height: 'auto',
                borderRadius: '50%', 
                objectFit: 'cover',
                display: 'block',
                filter: 'contrast(1.1) brightness(1.06)',
                border: '2px solid rgba(214, 175, 92, 0.5)'
              }} 
            />
          </div>
        </div>

        {/* 9. Horizontal Divider */}
        <div style={{ 
          width: '100%', 
          maxWidth: '700px', 
          height: '1px', 
          background: 'linear-gradient(90deg, transparent, var(--gold-primary), transparent)', 
          opacity: 0.4, 
          margin: '0 auto 4.5rem' 
        }} />

        {/* 10. How It Works Section */}
        <section style={{ width: '100%', maxWidth: '950px', marginBottom: '2rem' }}>
          <p style={{ 
            color: 'var(--text-muted)', 
            fontSize: '0.8rem', 
            letterSpacing: '0.2em', 
            textTransform: 'uppercase', 
            marginBottom: '0.5rem',
            fontWeight: '700'
          }}>
            HOW TO PLAY
          </p>

          <h3 style={{ 
            fontSize: '2.2rem', 
            marginBottom: '2.5rem', 
            color: 'var(--gold-bright)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em',
            fontFamily: 'var(--font-serif)'
          }}>
            3 ขั้นตอนง่าย ๆ
          </h3>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
            gap: '1.75rem',
            width: '100%'
          }}>
            {/* Step Card 01 - Door Image Asset */}
            <div className="glass-card glass-card-interactive" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: '800', color: 'var(--gold-bright)' }}>
                  01
                </span>
                <img 
                  src="/images/home/door-home.jpg" 
                  alt="Create Room" 
                  style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--gold-primary)', boxShadow: '0 0 10px rgba(214, 175, 92, 0.3)' }} 
                />
              </div>
              <h4 style={{ color: 'var(--gold-primary)', fontSize: '1.25rem', margin: 0, fontWeight: '700', fontFamily: 'var(--font-serif)' }}>
                CREATE
              </h4>
              <p style={{ color: 'var(--text-main)', fontSize: '1rem', margin: 0, fontWeight: '700' }}>
                สร้างห้อง
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                สร้างห้องเกมของคุณ ตั้งชื่อ เลือกโหมด แล้วเพิ่มชื่อผู้เล่นทุกคนลงในเครื่องเดียว
              </p>
            </div>

            {/* Step Card 02 - Spin Wheel Image Asset */}
            <div className="glass-card glass-card-interactive" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: '800', color: 'var(--gold-bright)' }}>
                  02
                </span>
                <img 
                  src="/images/home/wheel-home.png" 
                  alt="Spin Wheel" 
                  style={{ width: '50px', height: '50px', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(239, 217, 160, 0.5))' }} 
                />
              </div>
              <h4 style={{ color: 'var(--gold-primary)', fontSize: '1.25rem', margin: 0, fontWeight: '700', fontFamily: 'var(--font-serif)' }}>
                SPIN
              </h4>
              <p style={{ color: 'var(--text-main)', fontSize: '1rem', margin: 0, fontWeight: '700' }}>
                สุ่มว่าใครโดน
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                กดปุ่ม Spin วงล้อจะหมุนเลือกคน ลุ้นว่าใครคือผู้โชคดีประจำรอบนี้!
              </p>
            </div>

            {/* Step Card 03 - Dice Image Asset */}
            <div className="glass-card glass-card-interactive" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: '800', color: 'var(--gold-bright)' }}>
                  03
                </span>
                <img 
                  src="/images/home/dice-home.png" 
                  alt="Chaos Dice" 
                  style={{ width: '50px', height: '50px', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(239, 217, 160, 0.5))' }} 
                />
              </div>
              <h4 style={{ color: 'var(--gold-primary)', fontSize: '1.25rem', margin: 0, fontWeight: '700', fontFamily: 'var(--font-serif)' }}>
                CHAOS
              </h4>
              <p style={{ color: 'var(--text-main)', fontSize: '1rem', margin: 0, fontWeight: '700' }}>
                ทำ Challenge
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                ทำภารกิจสุดป่วนที่สุ่มได้ เก็บสะสมคะแนน แล้วลุยรอบถัดไปทันที!
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Home;
