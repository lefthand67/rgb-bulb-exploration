// Pure challenge data and helpers. Kept free of DOM/confetti imports so the
// unit tests can exercise the colour math directly.
export const TOLERANCE = 24;

// Ordered so returning children meet the familiar Sun first, then old and new
// colours alternate. Every pair differs by > 2 × TOLERANCE on at least one
// channel, so no two ±tolerance boxes can overlap (tested).
export const TARGETS = [
  { name: '☀️ Солнце', r: 255, g: 220, b: 0 },
  { name: '🍓 Клубника', r: 255, g: 40, b: 80 },
  { name: '🌊 Океан', r: 0, g: 120, b: 255 },
  { name: '🍋 Лимон', r: 255, g: 255, b: 80 },
  { name: '🍇 Виноград', r: 128, g: 0, b: 160 },
  { name: '🌱 Трава', r: 40, g: 200, b: 60 },
  { name: '🌸 Сакура', r: 255, g: 170, b: 200 },
  { name: '🍊 Апельсин', r: 255, g: 140, b: 0 },
  { name: '🍬 Жвачка', r: 255, g: 105, b: 180 },
  { name: '❄️ Лёд', r: 150, g: 230, b: 255 },
  { name: '🔮 Фиолетовый', r: 160, g: 60, b: 255 },
  { name: '🌿 Мята', r: 80, g: 255, b: 170 },
  { name: '🌙 Полночь', r: 10, g: 20, b: 50 },
  { name: '🌅 Закат', r: 255, g: 127, b: 80 },
  { name: '☁️ Небо', r: 120, g: 180, b: 255 },
  { name: '🐸 Лягушка', r: 100, g: 200, b: 20 }
];

export const isColorMatch = (current, target, tolerance = TOLERANCE) =>
  Math.abs(current.r - target.r) <= tolerance &&
  Math.abs(current.g - target.g) <= tolerance &&
  Math.abs(current.b - target.b) <= tolerance;

/**
 * First useful correction for the channel furthest out of range. Returns a
 * Russian hint, or the "almost there" fallback when every channel is close.
 */
export const hintFor = (current, target, tolerance = TOLERANCE) => {
  const hints = [];
  if (current.r < target.r - tolerance) hints.push('Добавь красного');
  else if (current.r > target.r + tolerance) hints.push('Убавь красный');

  if (current.g < target.g - tolerance) hints.push('Добавь зелёного');
  else if (current.g > target.g + tolerance) hints.push('Убавь зелёный');

  if (current.b < target.b - tolerance) hints.push('Добавь синего');
  else if (current.b > target.b + tolerance) hints.push('Убавь синий');

  return hints.length ? `🔍 Близко! Подсказка: ${hints.join(', ')}` : '🔍 Почти! Покрути ещё чуть-чуть.';
};
