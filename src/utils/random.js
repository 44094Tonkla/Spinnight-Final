// ตัวสุ่มกลางของทั้งโปรเจกต์ (Fisher–Yates + สุ่มแบบไม่ลำเอียง)
const randomInt = (max) => {
  if (max <= 1) return 0;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const range = 0x100000000;
    const limit = range - (range % max);
    const buf = new Uint32Array(1);
    do {
      crypto.getRandomValues(buf);
    } while (buf[0] >= limit);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
};

// สลับลำดับ array โดยไม่แก้ array ต้นฉบับ
export const shuffleArray = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// สุ่ม 1 รายการจาก pool โดยไม่เอาตัวที่ใช้ไปแล้ว (usedItems)
// ถ้าใช้ครบหมดแล้ว จะเริ่มรอบใหม่เอง
export const pickWithoutRepeat = (pool, usedItems = []) => {
  if (!Array.isArray(pool) || pool.length === 0) return null;
  let available = pool.filter((item) => !usedItems.includes(item));
  let didReset = false;
  if (available.length === 0) {
    available = pool;
    didReset = true;
  }
  const picked = available[randomInt(available.length)];
  return { picked, usedItems: didReset ? [picked] : [...usedItems, picked] };
};
