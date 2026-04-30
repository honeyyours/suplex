// 간단한 CSV 직렬화/역직렬화 유틸 (RFC 4180 부분 준수) + 한국 은행 .xls/.xlsx 직접 파싱

import * as XLSX from 'xlsx';

export function csvEscape(v) {
  const s = v == null ? '' : String(v);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

// rows: 2차원 배열 [[col, col], ...]. 첫 행은 헤더.
// Excel에서 한글 깨지지 않도록 BOM(﻿) 포함.
export function toCSV(rows) {
  return '﻿' + rows.map((r) => r.map(csvEscape).join(',')).join('\r\n');
}

// CSV 텍스트 → 2차원 배열. 쌍따옴표 내 콤마/줄바꿈 안전 처리.
export function parseCSV(text) {
  if (!text) return [];
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // strip BOM
  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (c === '\r') { /* skip — \r\n 처리 */ }
      else cur += c;
    }
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  // 빈 줄 제거
  return rows.filter((r) => r.some((x) => x !== ''));
}

// 파일 다운로드 트리거
export function downloadFile(filename, content, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// File 객체 → 텍스트 (Promise). 한글 깨짐 자동 감지 후 EUC-KR fallback.
// 신한·하나·국민 등 일부 한국 은행 CSV가 EUC-KR로 다운되는 경우 대응.
export async function readFileAsText(file) {
  const utf8Text = await readWithEncoding(file, 'utf-8');
  // 깨짐 감지: U+FFFD(replacement char) 비율이 높으면 EUC-KR 재시도
  const fffdCount = (utf8Text.match(/�/g) || []).length;
  if (fffdCount > 5) {
    try {
      return await readWithEncoding(file, 'euc-kr');
    } catch (e) {
      // EUC-KR 디코더 미지원 환경 (구형 브라우저) — UTF-8 결과 그대로 반환
      return utf8Text;
    }
  }
  return utf8Text;
}

function readWithEncoding(file, encoding) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file, encoding);
  });
}

// CSV 헤더 자동 탐지 — 상단 메타 줄(계좌번호·기간 등)을 건너뛰고 한글 키워드가 포함된 첫 행을 헤더로 잡는다.
// rows: parseCSV 결과. 반환: { headerIndex, header, dataRows } 또는 폴백으로 { headerIndex: 0, ... }
const HEADER_KEYWORDS = ['일자', '날짜', '출금', '입금', '거래', '적요', '내용', '거래처', '받는'];
export function detectCsvHeader(rows) {
  if (!rows || rows.length === 0) return { headerIndex: 0, header: [], dataRows: [] };
  // 상단 10행 이내 검사
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue; // 너무 짧은 메타 줄
    const joined = row.join(' ').toLowerCase();
    const hits = HEADER_KEYWORDS.filter((k) => joined.includes(k.toLowerCase())).length;
    if (hits >= 2) {
      return { headerIndex: i, header: row, dataRows: rows.slice(i + 1) };
    }
  }
  // 폴백 — 첫 행을 헤더로 (기존 동작)
  return { headerIndex: 0, header: rows[0], dataRows: rows.slice(1) };
}

// 통합 파일 리더 — 확장자 따라 CSV/XLS/XLSX 자동 분기.
// 반환: 2차원 배열 [[col, col], ...] (header 미분리, 첫 행이 헤더이거나 메타 줄일 수 있음 → detectCsvHeader로 보정).
// 신한·국민·하나 등 한국 은행은 .xls 다운로드가 일반적이라 핵심.
export async function readSpreadsheetFile(file) {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.xls') || name.endsWith('.xlsx')) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { cellDates: true, cellNF: false });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return [];
    // raw: false → 날짜·숫자도 사람 읽는 형식 문자열로 변환 (예: "2026-04-30")
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, header: 1, raw: false, blankrows: false });
    return rows;
  }
  // CSV (또는 .txt)
  const text = await readFileAsText(file);
  return parseCSV(text);
}

// 날짜 문자열 정규화 — 다양한 한국 은행 포맷 대응 → "YYYY-MM-DD" 반환 (실패 시 빈 문자열)
// 지원: "2026.04.30", "2026/04/30", "2026-04-30", "20260430", "2026.04.30 12:34:56"
export function normalizeDate(s) {
  if (!s) return '';
  let v = String(s).trim();
  // 시간 부분 제거
  v = v.split(/[\sT]/)[0];
  // 8자리 숫자 (YYYYMMDD)
  if (/^\d{8}$/.test(v)) {
    return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
  }
  // 점·슬래시 → 하이픈
  v = v.replace(/[./]/g, '-');
  // 한글 (예: "2026년 04월 30일")
  v = v.replace(/년|월/g, '-').replace(/일/g, '').replace(/\s+/g, '');
  // YYYY-MM-DD 패턴 추출
  const m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const yy = m[1];
    const mm = m[2].padStart(2, '0');
    const dd = m[3].padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  }
  return '';
}
