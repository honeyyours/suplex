// 매뉴얼 v0.7 캡처 — 전역 메뉴 11 + 프로젝트 13탭 = 24페이지.
// 사용:
//   cd scripts/screens && npm install
//   .env 에 EXPORT_EMAIL=1988kbk@naver.com, EXPORT_PASSWORD=<비번>, EXPORT_BASE_URL=https://suplex.kr
//   npm run export:manual
//
// 출력: ~/Desktop/suplex_manual_screens_YYYY-MM-DD/01_home.png … 24_project_tools.png + HTML
//
// PII 자동 블러 (best-effort):
//   - 010-XXXX-XXXX 전화번호 패턴
//   - "고객:" / "고객명" prefix 텍스트
//   - InfoRow label="연락처"·"주소"·"출입번호" 인접 값
//   - 견적의 clientName input value
//   놓치는 부분은 수동 모자이크로 보정 (계획서 9번 참조).

import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 라벨링 anchor 정의 — annotations.json 에서 로드 (페이지별 영역 ① ② ③)
let ANNOTATIONS = {};
try {
  const raw = await fs.readFile(path.join(__dirname, 'annotations.json'), 'utf-8');
  ANNOTATIONS = JSON.parse(raw);
} catch (e) {
  console.warn('⚠️  annotations.json 로드 실패 — 라벨링 없이 진행:', e.message);
}

// --viewport=mobile|web — 모바일/데스크톱 viewport 토글 (다른 const들이 IS_MOBILE 참조하므로 먼저 정의)
const VIEWPORT_MODE = (process.argv.find((a) => a.startsWith('--viewport=')) || '').split('=')[1] || 'web';
const IS_MOBILE = VIEWPORT_MODE === 'mobile';

// --only=<key> 옵션 — 단일 페이지만 캡처 (예: --only=17_project_materials)
const ONLY_KEY = (process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1] || null;

// assets/screens 자동 복사 — 매뉴얼 docs/manual/assets/screens/ (모바일은 screens/mobile/)
const ASSETS_TARGET = IS_MOBILE
  ? path.join(__dirname, '..', '..', 'docs', 'manual', 'assets', 'screens', 'mobile')
  : path.join(__dirname, '..', '..', 'docs', 'manual', 'assets', 'screens');
const COPY_TO_ASSETS = process.env.EXPORT_COPY_TO_ASSETS !== '0'; // 기본 ON

// 영역 라벨링 토글 — 0으로 두면 깨끗한 raw PNG. 1차 v0.7 자동화 정확도 한계로 봉기님 결정(2026-05-17)
const ENABLE_LABELS = process.env.EXPORT_LABEL !== '0'; // 기본 ON, EXPORT_LABEL=0 으로 끔

const EMAIL = process.env.EXPORT_EMAIL;
const PASSWORD = process.env.EXPORT_PASSWORD;
const BASE_URL = (process.env.EXPORT_BASE_URL || 'https://suplex.kr').replace(/\/$/, '');
const BLUR_PII = process.env.EXPORT_BLUR_PII !== '0'; // 기본 ON, '0'으로 끌 수 있음

if (!EMAIL || !PASSWORD) {
  console.error('❌ .env 에 EXPORT_EMAIL · EXPORT_PASSWORD 를 채워주세요.');
  process.exit(1);
}

// iPhone 14 Pro 393×852 / 데스크톱 1440×900
const MOBILE_VIEWPORT = {
  width: 393,
  height: 852,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
};
const WEB_VIEWPORT = {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  isMobile: false,
  hasTouch: false,
};
const VIEWPORT = IS_MOBILE ? MOBILE_VIEWPORT : WEB_VIEWPORT;

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const OUT_DIR =
  process.env.EXPORT_OUT_DIR ||
  path.join(os.homedir(), 'Desktop', `suplex_manual_screens_${VIEWPORT_MODE}_${today()}`);

// 전역 메뉴 11개 (라운지 글 / 글쓰기는 동적 진입)
const GLOBAL_PAGES = [
  { key: '01_home', url: '/' },
  { key: '02_schedule', url: '/schedule' },
  { key: '03_projects', url: '/projects' },
  { key: '04_projects_new', url: '/projects/new' },
  { key: '05_orders', url: '/orders' },
  { key: '06_expenses', url: '/expenses' },
  { key: '07_ai_assistant', url: '/ai-assistant' },
  { key: '08_team', url: '/team' },
  { key: '09_lounge', url: '/lounge' },
  // 10_lounge_post — /lounge 에서 첫 카드 동적
  { key: '11_lounge_new', url: '/lounge/new' },
];

// 프로젝트 13탭 — 첫 프로젝트 ID를 동적으로 붙임
const PROJECT_TABS = [
  { key: '12_project_schedule', tab: 'schedule' },
  { key: '13_project_process', tab: 'process' },
  { key: '14_project_quotes', tab: 'quotes' },
  { key: '15_project_quotes_detail', tab: 'quotes-detail' },
  { key: '16_project_quote_consultations', tab: 'quote-consultations' },
  { key: '17_project_materials', tab: 'materials' },
  { key: '18_project_orders', tab: 'orders' },
  { key: '19_project_checklist', tab: 'checklist' },
  { key: '20_project_reports', tab: 'reports' },
  { key: '21_project_memo', tab: 'memo' },
  { key: '22_project_expenses', tab: 'expenses' },
  { key: '23_project_settlement', tab: 'settlement' },
  { key: '24_project_tools', tab: 'tools' },
];

async function login(page) {
  console.log('🔐 로그인 시도...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 60_000 });
  await page.waitForSelector('input[type="email"]', { timeout: 30_000 });
  await page.type('input[type="email"]', EMAIL, { delay: 30 });
  await page.type('input[type="password"]', PASSWORD, { delay: 30 });
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60_000 }).catch(() => {}),
  ]);
  await new Promise((r) => setTimeout(r, 2000));
  if (page.url().includes('/login')) {
    throw new Error('로그인 실패 — 이메일/비번 확인 또는 2FA 활성화 여부 확인');
  }
  console.log('✅ 로그인 성공');
}

async function findFirstProjectId(page) {
  await page.goto(`${BASE_URL}/projects`, { waitUntil: 'networkidle2', timeout: 60_000 });
  // React Query 로딩 완료까지 명시 대기 — 프로젝트 카드 anchor가 나타날 때까지
  try {
    await page.waitForFunction(
      () => {
        const anchors = Array.from(document.querySelectorAll('a[href^="/projects/"]'));
        return anchors.some((a) => /^\/projects\/[a-z0-9]{20,}/i.test(a.getAttribute('href') || ''));
      },
      { timeout: 15_000 }
    );
  } catch {
    // anchor 못 찾으면 fallback — 빈 상태일 수도
  }
  return page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href^="/projects/"]'));
    for (const a of anchors) {
      const h = a.getAttribute('href');
      const m = h && h.match(/^\/projects\/([a-z0-9]{20,})/i);
      if (m) return m[1];
    }
    return null;
  });
}

async function findFirstLoungePostUrl(page) {
  await page.goto(`${BASE_URL}/lounge`, { waitUntil: 'networkidle2', timeout: 60_000 });
  await new Promise((r) => setTimeout(r, 1500));
  return page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href^="/lounge/"]'));
    for (const a of anchors) {
      const h = a.getAttribute('href');
      // /lounge/new, /lounge/:id/edit 제외, /lounge/:id 만
      if (h && /^\/lounge\/[a-z0-9]+$/i.test(h) && !h.endsWith('/new')) return h;
    }
    return null;
  });
}

// 페이지에 영역 라벨링 — 빨간 점선 outline + 좌상단 ① ② ③ 동그라미
async function injectAreaLabels(page, key) {
  const labels = ANNOTATIONS[key];
  if (!Array.isArray(labels) || labels.length === 0) return { applied: 0, missed: [] };

  const result = await page.evaluate((items) => {
    const findElement = (anchor) => {
      // 1. selector 우선
      if (anchor.selector) {
        const candidates = Array.from(document.querySelectorAll(anchor.selector));
        if (candidates.length === 0) return null;
        if (anchor.text) {
          // selectorWithText: selector로 좁히고 text 매칭
          const filtered = candidates.filter((el) => (el.textContent || '').includes(anchor.text));
          if (filtered.length > 0) return filtered[0];
          return null;
        }
        // 보이는 element 우선
        const visible = candidates.find((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });
        return visible || candidates[0];
      }
      // 2. text 기반 — 가장 작은 컨테이너
      if (anchor.text) {
        const all = Array.from(document.querySelectorAll('body *'));
        const matches = all.filter((el) => {
          if (el.children.length > 10) return false; // 너무 큰 컨테이너 제외
          const t = el.textContent || '';
          return t.includes(anchor.text);
        });
        if (matches.length === 0) return null;
        // 정확히 일치 + 보이는 것 우선
        const exact = matches.find((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && (el.textContent || '').trim() === anchor.text;
        });
        if (exact) return exact;
        // 그 다음 가장 작은 visible
        matches.sort((a, b) => (a.textContent || '').length - (b.textContent || '').length);
        return matches.find((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        }) || null;
      }
      return null;
    };

    const missed = [];
    let applied = 0;
    for (const item of items) {
      const el = findElement(item);
      if (!el) {
        missed.push(item.label);
        continue;
      }
      const rect = el.getBoundingClientRect();
      // 영역 outline — box-shadow inset으로 화면 안에 그려 fullPage 캡처 잘 잡힘
      el.style.outline = '2px dashed #ef4444';
      el.style.outlineOffset = '2px';

      // 라벨 동그라미 — 좌상단 (rect 모서리 살짝 안쪽으로)
      const badge = document.createElement('div');
      badge.textContent = item.label;
      const top = rect.top + window.scrollY - 14;
      const left = rect.left + window.scrollX - 14;
      badge.style.cssText = [
        'position: absolute',
        `top: ${top}px`,
        `left: ${left}px`,
        'width: 28px',
        'height: 28px',
        'border-radius: 50%',
        'background: #ef4444',
        'color: white',
        'font-weight: bold',
        'font-size: 14px',
        'display: flex',
        'align-items: center',
        'justify-content: center',
        'box-shadow: 0 2px 8px rgba(0,0,0,0.35)',
        'z-index: 2147483647',
        'pointer-events: none',
        'font-family: sans-serif',
        'line-height: 1',
      ].join('; ');
      document.body.appendChild(badge);
      applied++;
    }
    return { applied, missed };
  }, labels);

  return result;
}

// 페이지에 PII 블러 CSS·JS 주입
async function injectPiiBlur(page) {
  if (!BLUR_PII) return;
  await page.evaluate(() => {
    const PHONE_RE = /^010[-\s]?\d{3,4}[-\s]?\d{4}$/;
    const LABELED = new Set(['연락처', '주소', '출입번호', '고객명', '클라이언트', '고객 연락처']);

    const blur = (el) => {
      if (!el || el.dataset.piiBlurred) return;
      el.style.filter = 'blur(6px)';
      el.style.userSelect = 'none';
      el.dataset.piiBlurred = '1';
    };

    // 1. 전화번호 패턴
    document.querySelectorAll('*').forEach((el) => {
      if (el.children.length === 0) {
        const t = (el.textContent || '').trim();
        if (PHONE_RE.test(t)) blur(el);
      }
    });

    // 2. "고객:" prefix (홈/리스트 카드)
    document.querySelectorAll('span,div,td').forEach((el) => {
      if (el.children.length === 0) {
        const t = (el.textContent || '').trim();
        if (/^고객\s*[:：]\s*\S/.test(t)) blur(el);
      }
    });

    // 3. InfoRow label="..." 인접 값 (ProjectInfoCard 패턴)
    //    구조: <div><label>연락처</label><div>값</div></div> — 라벨 텍스트 기준
    document.querySelectorAll('label, dt, .info-row-label, [data-label]').forEach((labelEl) => {
      const labelText = (labelEl.getAttribute('data-label') || labelEl.textContent || '').trim();
      if (LABELED.has(labelText)) {
        const sib = labelEl.nextElementSibling;
        if (sib) blur(sib);
        const parent = labelEl.parentElement;
        if (parent) {
          parent.querySelectorAll(':scope > :not(label):not(dt):not(.info-row-label)').forEach(blur);
        }
      }
    });

    // 4. 견적 등에서 라벨이 inline 텍스트인 경우 — 같은 부모의 다음 텍스트 노드
    document.querySelectorAll('div, td, span').forEach((el) => {
      if (el.children.length !== 1) return;
      const onlyChild = el.firstElementChild;
      const inline = (onlyChild.textContent || '').trim();
      if (LABELED.has(inline)) {
        // 형제 노드 중 텍스트 값 추정
        const sib = el.nextElementSibling;
        if (sib) blur(sib);
      }
    });

    // 5. 견적의 clientName / customerName input value
    document.querySelectorAll('input').forEach((inp) => {
      const name = (inp.getAttribute('name') || '') + ' ' + (inp.getAttribute('id') || '') + ' ' + (inp.getAttribute('placeholder') || '');
      if (/client|customer|고객|연락처|전화|주소/i.test(name)) blur(inp);
    });
  });
}

async function capture(page, { key, url }, { lenient = false } = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  console.log(`  📸 ${key} ← ${url}${lenient ? ' (관대 모드 재시도)' : ''}`);
  try {
    await page.goto(fullUrl, {
      waitUntil: lenient ? 'domcontentloaded' : 'networkidle2',
      timeout: lenient ? 120_000 : 60_000,
    });
  } catch (e) {
    if (!lenient) {
      console.warn(`    ↻ networkidle2 실패 — 관대 모드로 재시도: ${e.message.split('\n')[0]}`);
      return capture(page, { key, url }, { lenient: true });
    }
    throw e;
  }
  await new Promise((r) => setTimeout(r, lenient ? 5000 : 2500));

  await injectPiiBlur(page);
  // PII 블러 후 라벨링 (라벨이 블러보다 위 z-index)
  if (ENABLE_LABELS) {
    const labelResult = await injectAreaLabels(page, key);
    if (labelResult.applied > 0 || labelResult.missed.length > 0) {
      console.log(`    🏷️  라벨 ${labelResult.applied}개 적용${labelResult.missed.length > 0 ? ` · 미스: ${labelResult.missed.join(' ')}` : ''}`);
    }
  }
  await new Promise((r) => setTimeout(r, 400));

  const htmlPath = path.join(OUT_DIR, `${key}.html`);
  const pngPath = path.join(OUT_DIR, `${key}.png`);

  const html = await page.content();
  await fs.writeFile(htmlPath, html, 'utf-8');
  await page.screenshot({ path: pngPath, fullPage: true });

  // assets/screens 자동 복사 (기본 ON)
  if (COPY_TO_ASSETS) {
    try {
      await fs.mkdir(ASSETS_TARGET, { recursive: true });
      await fs.copyFile(pngPath, path.join(ASSETS_TARGET, `${key}.png`));
    } catch (e) {
      console.warn(`    ⚠️  assets 복사 실패: ${e.message}`);
    }
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log(`📂 출력:    ${OUT_DIR}`);
  console.log(`🌐 BASE:    ${BASE_URL}`);
  console.log(`👤 계정:    ${EMAIL}`);
  console.log(`🖥️  viewport: ${VIEWPORT.width}×${VIEWPORT.height} (${IS_MOBILE ? '모바일 iPhone 14 Pro' : '데스크톱'} · 라이트모드)`);
  console.log(`🫥 PII 블러: ${BLUR_PII ? '켜짐 (전화번호·라벨 인접 값 best-effort)' : '꺼짐'}`);
  console.log(`🏷️  영역 라벨: ${ENABLE_LABELS ? `켜짐 (${Object.keys(ANNOTATIONS).filter((k) => !k.startsWith('_')).length}개 페이지)` : '꺼짐 (EXPORT_LABEL=0)'}`);
  console.log(`📁 assets 복사: ${COPY_TO_ASSETS ? `켜짐 → ${ASSETS_TARGET}` : '꺼짐'}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);

    // 모바일 viewport일 때 iPhone UA — 모바일 분기 보장
    if (IS_MOBILE) {
      await page.setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      );
    }

    // 라이트 모드 강제
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
    await page.evaluateOnNewDocument(() => {
      try { localStorage.setItem('suplex-theme', 'light'); } catch {}
    });

    await login(page);

    // 라운지 첫 게시글 URL
    const loungePostUrl = await findFirstLoungePostUrl(page);

    // 프로젝트 13탭용 첫 프로젝트 ID
    const projectId = await findFirstProjectId(page);

    // 캡처 순서 조립
    const pages = [...GLOBAL_PAGES];
    if (loungePostUrl) {
      pages.splice(9, 0, { key: '10_lounge_post', url: loungePostUrl });
    } else {
      console.warn('⚠️  라운지 게시글이 없어 10_lounge_post 캡처 건너뜀.');
    }
    if (projectId) {
      for (const t of PROJECT_TABS) {
        pages.push({ key: t.key, url: `/projects/${projectId}/${t.tab}` });
      }
    } else {
      console.warn('⚠️  프로젝트가 없어 12~24 캡처 건너뜀.');
    }

    const targetPages = ONLY_KEY ? pages.filter((p) => p.key === ONLY_KEY) : pages;
    if (ONLY_KEY && targetPages.length === 0) {
      console.error(`❌ --only=${ONLY_KEY} 와 일치하는 페이지가 없습니다. 사용 가능 키 목록:`);
      pages.forEach((p) => console.error(`   - ${p.key}`));
      return;
    }
    if (ONLY_KEY) console.log(`🎯 단일 페이지 모드: ${ONLY_KEY}\n`);

    for (const p of targetPages) {
      try {
        await capture(page, p);
      } catch (e) {
        console.error(`  ❌ ${p.key} 실패:`, e.message);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`\n✅ 완료: ${OUT_DIR}`);
  if (COPY_TO_ASSETS) {
    console.log(`📁 assets/screens 자동 복사: ${ASSETS_TARGET}`);
  }
  console.log('\n다음 단계:');
  console.log('  1. PNG에 ① ② ③ 빨간 동그라미·점선 outline이 잘 박혔는지 확인');
  console.log('  2. 페이지 미스 라벨(콘솔 로그) 있으면 봉기님이 메시지로 알려주시면 annotations.json 보강');
  console.log('  3. PII 누락 있으면 이미지 편집기로 추가 모자이크');
}

main().catch((e) => {
  console.error('❌ 실패:', e);
  process.exit(1);
});
