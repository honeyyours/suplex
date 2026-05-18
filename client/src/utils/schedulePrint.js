// 일정 PDF 출력 — 새 창에 인쇄용 HTML을 그려 window.print() 호출.
// 모든 일정 화면 공용. A4 세로 · 월별 페이지 · 캘린더 그리드 + 상세 리스트.
// 회사명만 헤더에 표시(현장 정보·전화번호 등 X). 가시성·예쁨 동시 강조.
//
// 사용:
//   openSchedulePrint({
//     entries,            // [{ id, date, content, project?, vendor?, confirmed?, category? }]
//     start, end,         // 'YYYY-MM-DD' (옵션, 없으면 entries 범위에서 자동 산출)
//     title,              // 헤더 좌측 제목 (예: "전체 일정", "○○현장 일정")
//     companyName,        // 헤더 우측 회사명
//   });

function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateKey(key) {
  // 'YYYY-MM-DD' → Date (로컬). 'YYYY-MM-DDTHH:mm:ss.sssZ' 도 첫 10자만 사용해 동일 처리.
  const [y, m, d] = key.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function monthStart(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function monthEnd(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function addMonths(d, n) { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; }

// 한 달 7×6 캘린더 그리드 (앞뒤 달 일부 포함). 일요일 시작.
function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

// 한국 주요 공휴일 — 인쇄용 간단 표. 정밀한 음력 처리는 utils/holidays.js에 있지만 의존 줄이려고 일부만.
const FIXED_HOLIDAYS = {
  '01-01': '신정',
  '03-01': '삼일절',
  '05-05': '어린이날',
  '06-06': '현충일',
  '08-15': '광복절',
  '10-03': '개천절',
  '10-09': '한글날',
  '12-25': '성탄절',
};
function getHolidayLabel(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return FIXED_HOLIDAYS[`${mm}-${dd}`] || null;
}

// HTML escape
function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 프로젝트 id → 색상 (8가지 팔레트 hash)
const PROJECT_PALETTE = [
  { bg: '#fef3c7', bd: '#f59e0b', tx: '#78350f' }, // amber
  { bg: '#dbeafe', bd: '#3b82f6', tx: '#1e3a8a' }, // blue
  { bg: '#dcfce7', bd: '#22c55e', tx: '#14532d' }, // green
  { bg: '#fce7f3', bd: '#ec4899', tx: '#831843' }, // pink
  { bg: '#ede9fe', bd: '#8b5cf6', tx: '#4c1d95' }, // violet
  { bg: '#cffafe', bd: '#06b6d4', tx: '#164e63' }, // cyan
  { bg: '#fee2e2', bd: '#ef4444', tx: '#7f1d1d' }, // red
  { bg: '#fef9c3', bd: '#eab308', tx: '#713f12' }, // yellow
];
function projectColor(id) {
  if (!id) return { bg: '#f1f5f9', bd: '#94a3b8', tx: '#1e293b' };
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PROJECT_PALETTE[h % PROJECT_PALETTE.length];
}

// entries의 표시 라벨: [현장명] 내용
function entryLabel(e) {
  const proj = e.project?.name ? `[${e.project.name}] ` : '';
  return `${proj}${e.content || ''}`.trim();
}

export function openSchedulePrint({ entries = [], start, end, title = '일정', companyName = '' }) {
  // 기간 산출: 명시값 우선, 없으면 entries 범위. 비어있으면 이번 달.
  let startDate, endDate;
  if (start) startDate = parseDateKey(start);
  if (end) endDate = parseDateKey(end);
  if (!startDate || !endDate) {
    if (entries.length > 0) {
      const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : 1));
      startDate = startDate || parseDateKey(sorted[0].date);
      endDate = endDate || parseDateKey(sorted[sorted.length - 1].date);
    } else {
      const now = new Date();
      startDate = startDate || monthStart(now);
      endDate = endDate || monthEnd(now);
    }
  }

  // 월 단위 페이지로 분할
  const pages = [];
  let cursor = monthStart(startDate);
  const endMonthStart = monthStart(endDate);
  while (cursor <= endMonthStart) {
    pages.push(new Date(cursor));
    cursor = addMonths(cursor, 1);
  }

  // date(YYYY-MM-DD) → entries 그룹
  const byDate = {};
  for (const e of entries) {
    const k = (e.date || '').slice(0, 10);
    if (!k) continue;
    (byDate[k] = byDate[k] || []).push(e);
  }

  // 페이지별 HTML
  const pagesHtml = pages.map((monthDate) => renderMonthPage(monthDate, byDate, { title, companyName, startDate, endDate })).join('');

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${esc(title)} — 일정 출력</title>
<style>
  @page { size: A4 portrait; margin: 12mm 10mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Pretendard', 'Noto Sans KR', 'Malgun Gothic', sans-serif;
    color: #0f172a;
    background: #fff;
    font-size: 10pt;
    line-height: 1.45;
  }
  .toolbar {
    position: fixed; top: 12px; right: 12px;
    display: flex; gap: 6px;
    background: #fff; padding: 8px; border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    z-index: 999;
  }
  .toolbar button {
    font: inherit; font-size: 12pt;
    padding: 6px 14px; border: 1px solid #cbd5e1;
    background: #fff; border-radius: 4px; cursor: pointer;
  }
  .toolbar button.primary { background: #1e3a5f; color: #fff; border-color: #1e3a5f; }
  .toolbar .hint { font-size: 11px; color: #64748b; align-self: center; margin-right: 6px; }
  @media print { .toolbar { display: none !important; } }

  .page { padding: 0; }
  .page + .page { page-break-before: always; }

  .header {
    display: flex; justify-content: space-between; align-items: flex-end;
    border-bottom: 2px solid #1e293b;
    padding-bottom: 4mm; margin-bottom: 5mm;
  }
  .header .left .title {
    font-size: 22pt; font-weight: 800; color: #0f172a;
    letter-spacing: -0.02em;
  }
  .header .left .subtitle {
    font-size: 10.5pt; color: #475569; margin-top: 1.5mm; letter-spacing: 0.02em;
  }
  .header .right {
    text-align: right;
    font-size: 13pt; font-weight: 700; color: #1e3a5f;
  }
  .header .right .label {
    font-size: 8.5pt; font-weight: 500; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.15em;
    display: block; margin-bottom: 1mm;
  }

  /* 캘린더 */
  .cal {
    width: 100%; border-collapse: collapse;
    table-layout: fixed;
    border: 1.5px solid #334155;
  }
  .cal th {
    background: #1e293b; color: #fff;
    padding: 2mm 0; font-size: 10pt; font-weight: 600;
    border-right: 1px solid #475569;
  }
  .cal th:last-child { border-right: none; }
  .cal th.sun { background: #b91c1c; }
  .cal th.sat { background: #1d4ed8; }
  .cal td {
    border-right: 1px solid #cbd5e1;
    border-bottom: 1px solid #cbd5e1;
    vertical-align: top;
    padding: 1.5mm;
    height: 32mm;
    overflow: hidden;
  }
  .cal td:last-child { border-right: none; }
  .cal .day-num {
    font-weight: 700; font-size: 10pt;
    margin-bottom: 1mm;
    display: flex; align-items: baseline; gap: 1mm;
  }
  .cal .day-num .holiday { font-size: 7.5pt; font-weight: 500; color: #b91c1c; }
  .cal .sun { color: #b91c1c; }
  .cal .sat { color: #1d4ed8; }
  .cal .out { background: #f8fafc; color: #94a3b8; }
  .cal .out .day-num { color: #cbd5e1; }
  .entry {
    font-size: 8pt; line-height: 1.3;
    padding: 0.6mm 1.2mm; margin-bottom: 0.6mm;
    border-radius: 1.5px;
    border-left: 2.5px solid;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .entry.confirmed::before { content: '✓ '; font-weight: 700; }
  .more {
    font-size: 7.5pt; color: #64748b; font-weight: 600; margin-top: 0.5mm;
  }

  /* 상세 리스트 */
  .list-section { margin-top: 7mm; }
  .list-section h2 {
    font-size: 12pt; font-weight: 700; color: #0f172a;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 1.5mm; margin: 0 0 3mm 0;
  }
  .list-day {
    display: flex; gap: 4mm;
    padding: 1.5mm 0; border-bottom: 1px dashed #e2e8f0;
    page-break-inside: avoid;
  }
  .list-day:last-child { border-bottom: none; }
  .list-day .date {
    flex: 0 0 22mm; font-size: 9.5pt; font-weight: 700;
    color: #0f172a;
  }
  .list-day .date .dow { font-weight: 500; color: #64748b; margin-left: 1mm; }
  .list-day .date.sun { color: #b91c1c; }
  .list-day .date.sat { color: #1d4ed8; }
  .list-day .items { flex: 1; font-size: 10pt; line-height: 1.5; }
  .list-day .item {
    display: flex; gap: 2mm; align-items: baseline;
    padding: 0.5mm 0;
  }
  .list-day .tag {
    display: inline-block; padding: 0.2mm 1.5mm; font-size: 8pt; font-weight: 600;
    border-radius: 2px; border: 1px solid; flex-shrink: 0;
  }
  .list-day .content { flex: 1; color: #1e293b; }
  .list-day .content.confirmed::before { content: '✓ '; color: #15803d; font-weight: 700; }
  .empty-day { color: #94a3b8; font-style: italic; }

  .footer-note {
    margin-top: 6mm;
    font-size: 8.5pt; color: #94a3b8; text-align: right;
    border-top: 1px solid #e2e8f0; padding-top: 2mm;
  }
</style>
</head>
<body>
  <div class="toolbar">
    <span class="hint">Ctrl/⌘+P 또는 ‘인쇄’ → ‘PDF로 저장’</span>
    <button onclick="window.print()" class="primary">🖨 인쇄 / PDF</button>
    <button onclick="window.close()">닫기</button>
  </div>
  ${pagesHtml}
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) {
    alert('팝업이 차단되었습니다. 브라우저의 팝업 허용 후 다시 시도해주세요.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  // 약간의 지연 후 자동 인쇄창 띄움 (옵션)
  setTimeout(() => { try { w.focus(); } catch { /* ignore */ } }, 200);
}

function renderMonthPage(monthDate, byDate, { title, companyName, startDate, endDate }) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const grid = monthGrid(year, month);
  const startKey = toDateKey(startDate);
  const endKey = toDateKey(endDate);

  // 그리드 셀 1개
  const cells = grid.map((d) => {
    const key = toDateKey(d);
    const inMonth = d.getMonth() === month;
    const inRange = key >= startKey && key <= endKey;
    const dow = d.getDay();
    const holiday = getHolidayLabel(d);
    const isRed = dow === 0 || !!holiday;
    const isBlue = dow === 6;
    const items = (byDate[key] || []).slice();
    const visible = items.slice(0, 4);
    const hidden = items.length - visible.length;

    const dayCls = !inMonth ? 'out' : isRed ? 'sun' : isBlue ? 'sat' : '';
    const entriesHtml = visible.map((e) => {
      const c = projectColor(e.project?.id);
      const confirmedCls = e.confirmed ? ' confirmed' : '';
      return `<div class="entry${confirmedCls}" style="background:${c.bg};border-left-color:${c.bd};color:${c.tx}" title="${esc(entryLabel(e))}">${esc(entryLabel(e))}</div>`;
    }).join('');
    const moreHtml = hidden > 0 ? `<div class="more">+${hidden}개 더</div>` : '';

    return `<td class="${dayCls}${!inRange && inMonth ? ' out' : ''}">
      <div class="day-num ${dayCls}">${d.getDate()}${holiday ? ` <span class="holiday">${esc(holiday)}</span>` : ''}</div>
      ${entriesHtml}${moreHtml}
    </td>`;
  });

  // 7개씩 chunk로 행 구성
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(`<tr>${cells.slice(i, i + 7).join('')}</tr>`);
  }

  // 상세 리스트 (해당 월에 일정 있는 날만)
  const monthDates = [];
  for (let d = new Date(year, month, 1); d.getMonth() === month; d.setDate(d.getDate() + 1)) {
    monthDates.push(new Date(d));
  }
  const listHtml = monthDates
    .map((d) => {
      const key = toDateKey(d);
      const items = byDate[key] || [];
      if (items.length === 0) return null;
      const dow = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
      const dayCls = d.getDay() === 0 ? 'sun' : d.getDay() === 6 ? 'sat' : '';
      const itemsHtml = items.map((e) => {
        const c = projectColor(e.project?.id);
        const tag = e.project?.name
          ? `<span class="tag" style="background:${c.bg};border-color:${c.bd};color:${c.tx}">${esc(e.project.name)}</span>`
          : '';
        const content = esc(e.content || '');
        const confirmedCls = e.confirmed ? ' confirmed' : '';
        return `<div class="item">${tag}<span class="content${confirmedCls}">${content}</span></div>`;
      }).join('');
      return `<div class="list-day">
        <div class="date ${dayCls}">${d.getMonth() + 1}/${d.getDate()}<span class="dow">(${dow})</span></div>
        <div class="items">${itemsHtml}</div>
      </div>`;
    })
    .filter(Boolean)
    .join('');

  return `<section class="page">
    <div class="header">
      <div class="left">
        <div class="title">${esc(title)}</div>
        <div class="subtitle">${year}년 ${month + 1}월 · ${startKey} ~ ${endKey}</div>
      </div>
      ${companyName ? `<div class="right"><span class="label">Company</span>${esc(companyName)}</div>` : ''}
    </div>

    <table class="cal">
      <thead>
        <tr>
          <th class="sun">일</th><th>월</th><th>화</th><th>수</th><th>목</th><th>금</th><th class="sat">토</th>
        </tr>
      </thead>
      <tbody>${rows.join('')}</tbody>
    </table>

    ${listHtml ? `<div class="list-section">
      <h2>${year}년 ${month + 1}월 상세 일정</h2>
      ${listHtml}
    </div>` : ''}

    <div class="footer-note">출력일 ${new Date().toLocaleDateString('ko-KR')} · Suplex</div>
  </section>`;
}
