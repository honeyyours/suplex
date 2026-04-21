export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addDays(date, n) {
  const r = new Date(date);
  r.setDate(r.getDate() + n);
  return r;
}

export function addMonths(date, n) {
  const r = new Date(date);
  r.setMonth(r.getMonth() + n);
  return r;
}

export function calendarGrid(year, month) {
  // Returns Date[] covering full weeks (Sun–Sat) that contain any day of month.
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const start = addDays(first, -first.getDay());
  const end = addDays(last, 6 - last.getDay());
  const days = [];
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    days.push(new Date(d));
  }
  return days;
}

export function formatMonthLabel(date) {
  return `${date.getFullYear()}. ${date.getMonth() + 1}`;
}

export function weeksBetween(startStr, endStr) {
  if (!startStr || !endStr) return null;
  const s = new Date(startStr);
  const e = new Date(endStr);
  const days = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.ceil(days / 7));
}

export function formatDateDot(str) {
  if (!str) return '';
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function formatShort(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function formatDateDisplay(dateStr) {
  const d = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} (${days[d.getDay()]})`;
}

export function relativeTime(timestamp) {
  const now = Date.now();
  const t = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  const diff = now - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(t).toLocaleDateString('ko-KR');
}

export const CATEGORIES = [
  '철거', '목공', '전기', '설비', '타일', '도배', '도장', '필름', '마루', '준공',
];

export const CATEGORY_COLORS = {
  철거:   'bg-rose-100 text-rose-800',
  목공:   'bg-amber-100 text-amber-800',
  전기:   'bg-sky-100 text-sky-800',
  설비:   'bg-teal-100 text-teal-800',
  타일:   'bg-pink-100 text-pink-800',
  도배:   'bg-violet-100 text-violet-800',
  도장:   'bg-orange-100 text-orange-800',
  필름:   'bg-fuchsia-100 text-fuchsia-800',
  마루:   'bg-yellow-100 text-yellow-800',
  준공:   'bg-emerald-100 text-emerald-800',
};

export function categoryClass(cat) {
  if (!cat) return 'bg-gray-100 text-gray-700';
  return CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-700';
}
