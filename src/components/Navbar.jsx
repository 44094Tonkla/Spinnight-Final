import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/global.css';

const Navbar = () => {
  const location = useLocation();
  const isNavActive = (path) => location.pathname === path;

  return (
    <nav className="site-navbar" style={{ 
      padding: '0.85rem 3rem', 
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center', 
      borderBottom: '1px solid rgba(214, 175, 92, 0.2)', 
      background: 'rgba(11, 6, 16, 0.9)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%'
    }}>
      {/* 1. มุมซ้ายบน: SPINNIGHT Logo / Home Link (ชิดซ้ายสุด) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="navbar-brand" style={{ 
            fontFamily: 'var(--font-serif)',
            fontSize: '1.5rem', 
            fontWeight: '900', 
            color: 'var(--gold-primary)', 
            letterSpacing: '0.15em',
            textShadow: '0 0 12px rgba(239, 217, 160, 0.4)',
            cursor: 'pointer'
          }}>
            SPINNIGHT
          </div>
        </Link>
      </div>

      {/* 1.1 ตรงกลาง: HOW TO PLAY / PROFILE / LEADERBOARD Nav */}
      <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', justifyContent: 'center' }}>
        <Link 
          to="/" 
          style={{ 
            color: isNavActive('/') ? 'var(--gold-bright)' : 'var(--text-muted)', 
            textDecoration: 'none', 
            fontSize: '0.82rem',
            fontFamily: 'var(--font-sans)',
            fontWeight: '700',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            paddingBottom: '4px',
            borderBottom: isNavActive('/') ? '2px solid var(--gold-bright)' : '2px solid transparent',
            transition: 'all 0.25s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = 'var(--gold-bright)';
            e.target.style.textShadow = '0 0 8px rgba(239, 217, 160, 0.4)';
          }}
          onMouseLeave={(e) => {
            if (!isNavActive('/')) {
              e.target.style.color = 'var(--text-muted)';
              e.target.style.textShadow = 'none';
            }
          }}
        >
          HOW TO PLAY
        </Link>

        <Link 
          to="/profile" 
          style={{ 
            color: isNavActive('/profile') ? 'var(--gold-bright)' : 'var(--text-muted)', 
            textDecoration: 'none', 
            fontSize: '0.82rem',
            fontFamily: 'var(--font-sans)',
            fontWeight: '700',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            paddingBottom: '4px',
            borderBottom: isNavActive('/profile') ? '2px solid var(--gold-bright)' : '2px solid transparent',
            transition: 'all 0.25s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = 'var(--gold-bright)';
            e.target.style.textShadow = '0 0 8px rgba(239, 217, 160, 0.4)';
          }}
          onMouseLeave={(e) => {
            if (!isNavActive('/profile')) {
              e.target.style.color = 'var(--text-muted)';
              e.target.style.textShadow = 'none';
            }
          }}
        >
          PROFILE
        </Link>

        <Link 
          to="/leaderboard" 
          style={{ 
            color: isNavActive('/leaderboard') ? 'var(--gold-bright)' : 'var(--text-muted)', 
            textDecoration: 'none', 
            fontSize: '0.82rem',
            fontFamily: 'var(--font-sans)',
            fontWeight: '700',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            paddingBottom: '4px',
            borderBottom: isNavActive('/leaderboard') ? '2px solid var(--gold-bright)' : '2px solid transparent',
            transition: 'all 0.25s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = 'var(--gold-bright)';
            e.target.style.textShadow = '0 0 8px rgba(239, 217, 160, 0.4)';
          }}
          onMouseLeave={(e) => {
            if (!isNavActive('/leaderboard')) {
              e.target.style.color = 'var(--text-muted)';
              e.target.style.textShadow = 'none';
            }
          }}
        >
          LEADERBOARD
        </Link>
      </div>

      {/* 1.2 มุมขวาบน: ONLINE Status Indicator (ชิดขวาสุด) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <div className="online-status" style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.35rem 0.95rem', 
          borderRadius: '20px', 
          border: '1px solid var(--gold-primary)', 
          background: 'rgba(51, 25, 47, 0.4)',
          fontSize: '0.75rem',
          fontWeight: '700',
          color: 'var(--gold-bright)',
          letterSpacing: '0.1em'
        }}>
          <span style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            backgroundColor: '#00E676',
            boxShadow: '0 0 8px #00E676',
            display: 'inline-block',
            animation: 'pulseGlow 2s infinite'
          }} />
          ONLINE
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
