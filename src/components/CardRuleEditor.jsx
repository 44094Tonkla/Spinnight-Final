import React, { useState, useEffect } from 'react';
import { RANKS, DEFAULT_CARD_RULES } from '../utils/cardDeck';
import { getSavedPresets, saveCustomPreset, deleteCustomPreset } from '../utils/cardPresets';
import '../styles/global.css';

const CardRuleEditor = ({ currentRules, onSaveRules, isHost = true, onClose }) => {
  const [rules, setRules] = useState(currentRules || { ...DEFAULT_CARD_RULES });
  const [presets, setPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [presetNameInput, setPresetNameInput] = useState('');
  const [showSavePresetInput, setShowSavePresetInput] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setPresets(getSavedPresets());
  }, []);

  useEffect(() => {
    if (currentRules) {
      setRules(currentRules);
    }
  }, [currentRules]);

  const handleRuleChange = (rank, text) => {
    setRules(prev => ({
      ...prev,
      [rank]: text
    }));
  };

  const handleSelectPreset = (presetId) => {
    setSelectedPresetId(presetId);
    const target = presets.find(p => p.id === presetId);
    if (target) {
      setRules({ ...target.rules });
      setMessage(`โหลด Preset "${target.name}" เรียบร้อยแล้ว`);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSavePreset = (e) => {
    e.preventDefault();
    if (!presetNameInput.trim()) return;
    try {
      const updatedPresets = saveCustomPreset(presetNameInput, rules);
      setPresets(updatedPresets);
      setPresetNameInput('');
      setShowSavePresetInput(false);
      setMessage(`บันทึก Preset ใหม่ "${presetNameInput.trim()}" สำเร็จ!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePreset = (id) => {
    if (window.confirm('คุณต้องการลบ Preset นี้หรือไม่?')) {
      const updatedPresets = deleteCustomPreset(id);
      setPresets(updatedPresets);
      if (selectedPresetId === id) setSelectedPresetId('');
    }
  };

  const handleApply = () => {
    onSaveRules(rules);
    if (onClose) onClose();
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', width: '100%', maxWidth: '700px', margin: '1rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.5rem' }}>
        <h3 style={{ color: 'var(--gold)', fontSize: '1.4rem', margin: 0 }}>
          🃏 CARD RULES & PRESET EDITOR
        </h3>
        {onClose && (
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
            ✕
          </button>
        )}
      </div>

      {message && (
        <div style={{ padding: '0.5rem 1rem', marginBottom: '1rem', background: 'rgba(212, 175, 55, 0.2)', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: '4px', fontSize: '0.9rem' }}>
          {message}
        </div>
      )}

      {/* Preset Selector Bar */}
      <div style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
        <label style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '0.5rem' }}>
          LOAD RULE PRESET
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select 
            value={selectedPresetId}
            onChange={(e) => handleSelectPreset(e.target.value)}
            style={{ flex: 1, minWidth: '200px', padding: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--text-muted)', color: 'var(--text-main)', borderRadius: '4px' }}
          >
            <option value="">-- เลือกชุดกฎ Preset --</option>
            {presets.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {isHost && (
            <button 
              type="button" 
              onClick={() => setShowSavePresetInput(!showSavePresetInput)}
              className="secondary-button"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              + SAVE AS PRESET
            </button>
          )}
        </div>

        {/* Form to Save Custom Preset */}
        {showSavePresetInput && (
          <form onSubmit={handleSavePreset} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <input 
              type="text" 
              placeholder="ตั้งชื่อ Preset เช่น (แก๊งเพรียวๆ 2026)"
              value={presetNameInput}
              onChange={(e) => setPresetNameInput(e.target.value)}
              required
              style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--gold)', color: 'var(--text-main)', borderRadius: '4px' }}
            />
            <button type="submit" className="primary-button" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              บันทึก
            </button>
          </form>
        )}
      </div>

      {/* 13 Card Ranks Rules Editor */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.5rem' }}>
        {RANKS.map(rank => (
          <div key={rank} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ 
              minWidth: '40px', 
              height: '40px', 
              background: 'var(--burgundy)', 
              color: 'var(--gold)', 
              fontWeight: 'bold', 
              fontSize: '1.2rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              borderRadius: '6px',
              border: '1px solid var(--gold)'
            }}>
              {rank}
            </div>
            <input 
              type="text"
              value={rules[rank] || ''}
              disabled={!isHost}
              onChange={(e) => handleRuleChange(rank, e.target.value)}
              placeholder={`กำหนดกฎของไพ่ ${rank}`}
              style={{ flex: 1, padding: '0.4rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--text-muted)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.85rem' }}
            />
          </div>
        ))}
      </div>

      {isHost && (
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            type="button" 
            onClick={handleApply} 
            className="primary-button"
            style={{ flex: 1, padding: '0.75rem' }}
          >
            ✓ APPLY & SAVE RULES TO ROOM
          </button>
        </div>
      )}
    </div>
  );
};

export default CardRuleEditor;
