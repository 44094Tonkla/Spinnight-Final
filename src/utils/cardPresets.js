import { BUILTIN_PRESETS, DEFAULT_CARD_RULES } from './cardDeck';

const STORAGE_KEY = 'spinnight_card_presets';

export const getSavedPresets = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const customPresets = saved ? JSON.parse(saved) : [];
    return [...BUILTIN_PRESETS, ...customPresets];
  } catch (err) {
    console.error('Error reading custom presets:', err);
    return BUILTIN_PRESETS;
  }
};

export const saveCustomPreset = (name, rules) => {
  if (!name || !name.trim()) {
    throw new Error('กรุณาระบุชื่อ Preset');
  }

  const existing = getSavedPresets();
  const customOnly = existing.filter(p => !p.id.startsWith('classic') && !p.id.startsWith('hardcore') && !p.id.startsWith('icebreaker'));

  const newPreset = {
    id: 'custom_' + Date.now(),
    name: name.trim(),
    rules: { ...rules }
  };

  const updatedCustom = [...customOnly, newPreset];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustom));
  return getSavedPresets();
};

export const deleteCustomPreset = (id) => {
  const existing = getSavedPresets();
  const customOnly = existing.filter(p => !p.id.startsWith('classic') && !p.id.startsWith('hardcore') && !p.id.startsWith('icebreaker'));
  const updatedCustom = customOnly.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustom));
  return getSavedPresets();
};
