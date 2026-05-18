// 일정 PDF 인쇄 — A4 가로, 월별 한 페이지.
// 디자이너 시안 이식(2026-05-18, schedule_print_a4.html):
// - 헤더 3분할(SUPLEX / 큰 월 제목 / 회사명·출력일)
// - 캘린더 6주 그리드, 셀 23.5mm
// - 인라인 ✓ 확정 표시, 미확정은 텍스트 회색·얇음
// - 공정 chip 컬러 매핑(철거·목공·전기·설비·타일·도배·도장·필름·마루·준공)
// - 하단 인덱스 바: 현장 색상 + 프로젝트명 + ✓ 범례
// - 푸터: suplex.kr + 격리 안내(현장 정보·금액 비공개)
//
// 사용:
//   openSchedulePrint({
//     entries,            // [{ id, date, content, project?, confirmed?, category? }]
//     start, end,         // 'YYYY-MM-DD' (옵션, 없으면 entries 또는 이번 달)
//     title,              // 헤더 우측 보조 텍스트 (예: "전체 일정")
//     companyName,        // 헤더 우측 회사명
//   });

function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateKey(key) {
  const [y, m, d] = key.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function monthStart(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function monthEnd(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function addMonths(d, n) { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; }

function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const start = addDays(first, -first.getDay());
  // 6주(42칸) 채움
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

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

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 프로젝트 색상 (시안 6종 팔레트, id hash)
const PROJECT_PALETTE = [
  { cls: 'pj-blue',   bg: '#dbeafe', bd: '#2563eb' },
  { cls: 'pj-green',  bg: '#dcfce7', bd: '#16a34a' },
  { cls: 'pj-amber',  bg: '#fef3c7', bd: '#d97706' },
  { cls: 'pj-pink',   bg: '#fce7f3', bd: '#db2777' },
  { cls: 'pj-violet', bg: '#ede9fe', bd: '#7c3aed' },
  { cls: 'pj-cyan',   bg: '#cffafe', bd: '#0891b2' },
];
function projectColor(id) {
  if (!id) return { cls: 'pj-gray', bg: '#f1f5f9', bd: '#94a3b8' };
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PROJECT_PALETTE[h % PROJECT_PALETTE.length];
}

// 공정명 → chip class (시안 매핑)
const PHASE_CHIP = {
  '철거': 'chip-demo',
  '목공': 'chip-wood',
  '전기': 'chip-elec',
  '설비': 'chip-plumb',
  '타일': 'chip-tile',
  '도배': 'chip-wall',
  '도장': 'chip-paint',
  '필름': 'chip-film',
  '마루': 'chip-floor',
  '준공': 'chip-done',
};
function phaseChipClass(name) {
  if (!name) return null;
  // 정확 매칭 우선, 그 외엔 부분 포함(예: "도배·풀칠" → 도배)
  if (PHASE_CHIP[name]) return PHASE_CHIP[name];
  for (const key of Object.keys(PHASE_CHIP)) {
    if (name.includes(key)) return PHASE_CHIP[key];
  }
  return 'chip-generic';
}

// entry에서 공정 chip · 잔여 텍스트 분리.
// 1) entry.category가 있으면 그걸로
// 2) 없으면 content 앞쪽에 표준 공정 단어가 있는지 추출
function splitEntry(e) {
  const cat = e.category || (e.phase || null);
  const content = (e.content || '').trim();
  if (cat) return { chip: cat, text: content };
  // content 시작이 표준 공정 키워드면 분리 (예: "도배 벽지 도착")
  for (const key of Object.keys(PHASE_CHIP)) {
    const re = new RegExp(`^${key}[ ·:\\-]+`);
    if (re.test(content)) {
      return { chip: key, text: content.replace(re, '').trim() };
    }
  }
  return { chip: null, text: content };
}

export function openSchedulePrint({ entries = [], start, end, title = '전체 일정', companyName = '' }) {
  // 기간 산출
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

  // 월별 페이지 분할
  const months = [];
  let cursor = monthStart(startDate);
  const endMonthStart = monthStart(endDate);
  while (cursor <= endMonthStart) {
    months.push(new Date(cursor));
    cursor = addMonths(cursor, 1);
  }

  // 날짜별 entries
  const byDate = {};
  for (const e of entries) {
    const k = (e.date || '').slice(0, 10);
    if (!k) continue;
    (byDate[k] = byDate[k] || []).push(e);
  }

  // 출력일
  const today = new Date();
  const printedDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
  const todayKey = toDateKey(today);

  // 페이지 HTML
  const pagesHtml = months.map((m) => renderMonthPage(m, byDate, { title, companyName, printedDate, todayKey })).join('');

  const html = buildShell(pagesHtml, title);

  const w = window.open('', '_blank');
  if (!w) {
    alert('팝업이 차단되었습니다. 브라우저의 팝업 허용 후 다시 시도해주세요.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  setTimeout(() => { try { w.focus(); } catch { /* ignore */ } }, 200);
}

function buildShell(pagesHtml, title) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${esc(title)} — 일정 출력</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css">
<style>
  @page { size: A4 landscape; margin: 10mm 10mm 8mm 10mm; }

  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }

  body {
    font-family: 'Pretendard', system-ui, sans-serif;
    color: #0f172a;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-size: 11px;
    line-height: 1.3;
  }

  @media screen {
    body { background: #e9ecf1; padding: 24px; }
    .page {
      width: 277mm;
      min-height: 190mm;
      background: #fff;
      margin: 0 auto 16px;
      padding: 0;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }
  }
  @media print {
    .page { width: 100%; min-height: auto; }
    .page + .page { page-break-before: always; }
    .toolbar { display: none !important; }
  }

  .toolbar {
    position: fixed; top: 12px; right: 12px;
    display: flex; gap: 6px; align-items: center;
    background: #fff; padding: 8px 10px; border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.18);
    z-index: 999;
  }
  .toolbar .hint { font-size: 11px; color: #64748b; }
  .toolbar button {
    font-family: inherit; font-size: 12pt;
    padding: 6px 14px; border: 1px solid #cbd5e1;
    background: #fff; border-radius: 4px; cursor: pointer;
  }
  .toolbar button.primary {
    background: #15294a; color: #fff; border-color: #15294a;
  }

  .print-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 6mm;
    border-bottom: 1.5pt solid #15294a;
    padding-bottom: 2.5mm;
    margin-bottom: 3mm;
  }
  .brand {
    font-weight: 700;
    font-size: 15pt;
    color: #15294a;
    letter-spacing: -0.01em;
    flex: 1;
  }
  .brand-mark {
    display: inline-block;
    width: 5mm; height: 1mm;
    background: #15294a;
    vertical-align: 3px;
    margin-right: 2mm;
  }
  .month-title {
    font-size: 18pt;
    font-weight: 700;
    color: #15294a;
    letter-spacing: -0.02em;
    line-height: 1;
    white-space: nowrap;
    margin: 0;
  }
  .month-title .year {
    font-size: 11pt;
    font-weight: 500;
    color: #64748b;
    margin-right: 3mm;
    letter-spacing: 0;
  }
  .print-meta {
    font-size: 7.5pt;
    color: #94a3b8;
    text-align: right;
    flex: 1;
    line-height: 1.45;
  }

  .cal {
    border: 0.5pt solid #94a3b8;
    border-collapse: collapse;
    width: 100%;
    table-layout: fixed;
  }
  .cal th, .cal td {
    border: 0.5pt solid #cbd5e1;
    padding: 0;
    vertical-align: top;
  }
  .cal thead th {
    background: #f1f5f9;
    font-weight: 600;
    font-size: 9pt;
    color: #334155;
    padding: 2mm 0;
    text-align: center;
    letter-spacing: 0.5px;
    border-bottom-width: 0.7pt;
    border-bottom-color: #64748b;
  }
  .cal thead th.sun { color: #ef4444; }
  .cal thead th.sat { color: #2563eb; }

  .cal tbody td {
    height: 23.5mm;
    padding: 1.2mm;
    position: relative;
  }
  .day-num {
    font-size: 8.5pt;
    font-weight: 600;
    color: #1e3a66;
    line-height: 1;
    margin-bottom: 1.2mm;
    display: flex;
    align-items: center;
    gap: 1.5mm;
  }
  .day-num.sun { color: #dc2626; }
  .day-num.sat { color: #2563eb; }
  .day-num.out { color: #cbd5e1; font-weight: 500; }
  .day-num .today {
    background: #15294a;
    color: #fff;
    border-radius: 9999px;
    padding: 0.6mm 2.2mm;
    font-size: 8pt;
    line-height: 1;
    display: inline-block;
  }
  .holiday {
    font-size: 6.5pt;
    color: #dc2626;
    font-weight: 400;
    margin-left: 0.5mm;
  }
  td.out { background: #fafbfc; }

  .entry {
    font-size: 7.5pt;
    line-height: 1.25;
    padding: 0.4mm 1.2mm 0.4mm 0;
    margin-bottom: 0.6mm;
    border-left: 1mm solid;
    border-radius: 0 0.5mm 0.5mm 0;
    display: flex;
    align-items: center;
    gap: 1mm;
    overflow: hidden;
    page-break-inside: avoid;
  }
  .entry .txt {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
    color: #0f172a;
    font-weight: 500;
    padding-left: 1.2mm;
  }
  .entry.unconfirmed .txt {
    color: #64748b;
    font-weight: 400;
  }
  .entry .ph-chip {
    flex-shrink: 0;
    font-size: 6.5pt;
    padding: 0.2mm 1.2mm;
    border-radius: 0.5mm;
    font-weight: 600;
    line-height: 1.35;
    margin-left: 1.2mm;
  }
  .entry.confirmed .txt::after {
    content: " ✓";
    color: #047857;
    font-weight: 700;
    margin-left: 1mm;
  }
  .entry.confirmed .txt { color: #0f172a; font-weight: 600; }

  .pj-blue   { background: #dbeafe; border-left-color: #2563eb; }
  .pj-green  { background: #dcfce7; border-left-color: #16a34a; }
  .pj-amber  { background: #fef3c7; border-left-color: #d97706; }
  .pj-pink   { background: #fce7f3; border-left-color: #db2777; }
  .pj-violet { background: #ede9fe; border-left-color: #7c3aed; }
  .pj-cyan   { background: #cffafe; border-left-color: #0891b2; }
  .pj-gray   { background: #f1f5f9; border-left-color: #94a3b8; }

  .chip-demo    { background: #ffe4e6; color: #9f1239; }
  .chip-wood    { background: #fef3c7; color: #92400e; }
  .chip-elec    { background: #e0f2fe; color: #075985; }
  .chip-plumb   { background: #ccfbf1; color: #115e59; }
  .chip-tile    { background: #fce7f3; color: #9d174d; }
  .chip-wall    { background: #ede9fe; color: #5b21b6; }
  .chip-paint   { background: #ffedd5; color: #9a3412; }
  .chip-film    { background: #fae8ff; color: #86198f; }
  .chip-floor   { background: #fef9c3; color: #854d0e; }
  .chip-done    { background: #d1fae5; color: #065f46; }
  .chip-generic { background: #e2e8f0; color: #334155; }

  .index-bar {
    margin-top: 2.5mm;
    padding-top: 2mm;
    border-top: 0.5pt solid #cbd5e1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.5mm 4mm;
    font-size: 8pt;
  }
  .index-label {
    font-size: 7pt;
    color: #64748b;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .index-item {
    display: inline-flex;
    align-items: center;
    gap: 1.5mm;
    color: #334155;
    white-space: nowrap;
  }
  .index-swatch {
    display: inline-block;
    width: 3mm; height: 3mm;
    border-radius: 0.3mm;
    flex-shrink: 0;
  }
  .confirm-legend {
    font-size: 7pt;
    color: #64748b;
    margin-left: auto;
    white-space: nowrap;
  }
  .confirm-legend strong { color: #047857; margin-right: 0.5mm; }

  .print-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 1.5mm;
    padding-top: 1.5mm;
    font-size: 6.5pt;
    color: #94a3b8;
    border-top: 0.3pt solid #e2e8f0;
  }
</style>
</head>
<body>
  <div class="toolbar">
    <span class="hint">Ctrl/⌘+P 또는 ‘인쇄/PDF’ → ‘PDF로 저장’</span>
    <button onclick="window.print()" class="primary">🖨 인쇄 / PDF</button>
    <button onclick="window.close()">닫기</button>
  </div>
  ${pagesHtml}
</body>
</html>`;
}

function renderMonthPage(monthDate, byDate, { title, companyName, printedDate, todayKey }) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const grid = monthGrid(year, month);

  // 그리드 → 주(7) 별로 chunk
  const weeks = [];
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));

  // 본 페이지에 등장하는 프로젝트 인덱스 수집
  const projectIndex = new Map();

  const rowsHtml = weeks.map((week) => {
    const cells = week.map((d) => {
      const key = toDateKey(d);
      const inMonth = d.getMonth() === month;
      const dow = d.getDay();
      const isToday = key === todayKey;
      const holiday = getHolidayLabel(d);
      const items = (byDate[key] || []);

      // 인덱스에 프로젝트 누적
      for (const e of items) {
        if (e.project?.id && !projectIndex.has(e.project.id)) {
          projectIndex.set(e.project.id, {
            id: e.project.id,
            name: e.project.name || '(이름 없음)',
            color: projectColor(e.project.id),
          });
        }
      }

      const dayNumCls = !inMonth
        ? 'out'
        : dow === 0 || holiday ? 'sun'
        : dow === 6 ? 'sat'
        : '';
      const showMonthPrefix = inMonth && d.getDate() === 1;

      const dayNumHtml = isToday
        ? `<span class="today">${d.getDate()}</span>`
        : showMonthPrefix
        ? `${d.getMonth() + 1}/${d.getDate()}`
        : `${d.getDate()}`;
      const holidayHtml = holiday ? ` <span class="holiday">${esc(holiday)}</span>` : '';

      const entriesHtml = items.map((e) => {
        const c = projectColor(e.project?.id);
        const { chip, text } = splitEntry(e);
        const chipCls = chip ? phaseChipClass(chip) : null;
        const chipHtml = chip && chipCls
          ? `<span class="ph-chip ${chipCls}">${esc(chip)}</span>`
          : '';
        const confirmedCls = e.confirmed ? ' confirmed' : ' unconfirmed';
        return `<div class="entry ${c.cls}${confirmedCls}">${chipHtml}<span class="txt">${esc(text || e.content || '')}</span></div>`;
      }).join('');

      const tdCls = inMonth ? '' : 'out';
      return `<td class="${tdCls}">
        <div class="day-num ${dayNumCls}">${dayNumHtml}${holidayHtml}</div>
        ${entriesHtml}
      </td>`;
    });
    return `<tr>${cells.join('')}</tr>`;
  }).join('');

  const indexItems = [...projectIndex.values()]
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    .map((p) => `<span class="index-item">
      <span class="index-swatch ${p.color.cls}" style="border-left: 1mm solid ${p.color.bd}"></span>
      ${esc(p.name)}
    </span>`).join('');

  return `<section class="page">
    <header class="print-header">
      <div class="brand"><span class="brand-mark"></span>SUPLEX</div>
      <h1 class="month-title">
        <span class="year">${year}</span>${month + 1}월
      </h1>
      <div class="print-meta">
        ${esc(title)}${companyName ? ` · ${esc(companyName)}` : ''}<br>
        출력일: ${printedDate}
      </div>
    </header>

    <table class="cal">
      <thead>
        <tr>
          <th class="sun">일</th>
          <th>월</th>
          <th>화</th>
          <th>수</th>
          <th>목</th>
          <th>금</th>
          <th class="sat">토</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>

    <div class="index-bar">
      ${indexItems ? `<span class="index-label">현장</span>${indexItems}` : ''}
      <span class="confirm-legend"><strong>✓</strong> 확정 일정</span>
    </div>

    <footer class="print-footer">
      <span>SUPLEX · suplex.kr</span>
      <span>현장 정보·금액 비공개 · 인쇄 시 자동 격리됨</span>
    </footer>
  </section>`;
}
