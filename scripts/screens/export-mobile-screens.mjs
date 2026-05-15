// Suplex 모바일 화면 자동 캡처 — HTML + PNG 9페이지.
// 사용: cd scripts/screens && npm install && cp .env.example .env (값 채움) && npm run export
// --viewport=web 플래그로 데스크톱 캡처도 가능.

import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

dotenv.config();

const ARG_VIEWPORT = (process.argv.find((a) => a.startsWith('--viewport=')) || '')
  .split('=')[1] || 'mobile';

const EMAIL = process.env.EXPORT_EMAIL;
const PASSWORD = process.env.EXPORT_PASSWORD;
const BASE_URL = (process.env.EXPORT_BASE_URL || 'https://splex-mu.vercel.app').replace(/\/$/, '');

if (!EMAIL || !PASSWORD) {
  console.error('❌ .env에 EXPORT_EMAIL · EXPORT_PASSWORD 를 채워주세요.');
  process.exit(1);
}

// iPhone 14 Pro 기준 (393x852, devicePixelRatio 3) — 한국 사용자 디폴트 모바일
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
const VIEWPORT = ARG_VIEWPORT === 'web' ? WEB_VIEWPORT : MOBILE_VIEWPORT;

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const OUT_DIR =
  process.env.EXPORT_OUT_DIR ||
  path.join(os.homedir(), 'Desktop', `suplex_screens_${ARG_VIEWPORT}_${today()}`);

const PAGES = [
  { key: '01_home', url: '/' },
  { key: '02_schedule', url: '/schedule' },
  { key: '03_projects', url: '/projects' },
  // 04_project_internal — projects 페이지에서 첫 카드 링크를 동적으로 찾음
  { key: '05_orders', url: '/orders' },
  { key: '06_expenses', url: '/expenses' },
  { key: '07_ai_assistant', url: '/ai-assistant' },
  { key: '08_team', url: '/team' },
  { key: '09_lounge', url: '/lounge' },
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
  // 일부 케이스 SPA라 navigation 안 일어남 — URL 변화 또는 안정 대기
  await new Promise((r) => setTimeout(r, 2000));
  if (page.url().includes('/login')) {
    throw new Error('로그인 실패 — 이메일/비번 확인 또는 2FA 활성화 여부 확인');
  }
  console.log('✅ 로그인 성공');
}

async function findFirstProjectUrl(page) {
  await page.goto(`${BASE_URL}/projects`, { waitUntil: 'networkidle2', timeout: 60_000 });
  await new Promise((r) => setTimeout(r, 1500));
  const href = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href^="/projects/"]'));
    for (const a of anchors) {
      const h = a.getAttribute('href');
      // /projects/new 같은 경로 제외, ID 형태만
      if (h && /^\/projects\/[a-z0-9]{20,}/i.test(h)) return h;
    }
    return null;
  });
  return href;
}

async function capture(page, { key, url }) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  console.log(`  📸 ${key} ← ${url}`);
  await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 60_000 });
  await new Promise((r) => setTimeout(r, 2500)); // React 안정화

  const htmlPath = path.join(OUT_DIR, `${key}.html`);
  const pngPath = path.join(OUT_DIR, `${key}.png`);

  const html = await page.content();
  await fs.writeFile(htmlPath, html, 'utf-8');
  await page.screenshot({ path: pngPath, fullPage: true });
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log(`📂 출력: ${OUT_DIR}`);
  console.log(`🌐 BASE: ${BASE_URL}`);
  console.log(`📱 viewport: ${ARG_VIEWPORT} (${VIEWPORT.width}×${VIEWPORT.height})`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    // iPhone UA로 모바일 분기 보장
    if (ARG_VIEWPORT !== 'web') {
      await page.setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      );
    }
    // 라이트 모드 강제 — (1) prefers-color-scheme: light emulate
    //                    (2) 페이지 로드 전 localStorage suplex-theme=light 주입
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
    await page.evaluateOnNewDocument(() => {
      try { localStorage.setItem('suplex-theme', 'light'); } catch {}
    });

    await login(page);

    // 04 프로젝트 내부 — 첫 프로젝트 동적 결정
    const projectHref = await findFirstProjectUrl(page);
    const pagesWithInternal = [...PAGES];
    if (projectHref) {
      pagesWithInternal.splice(3, 0, { key: '04_project_internal', url: projectHref });
    } else {
      console.warn('⚠️  프로젝트가 없어 04_project_internal 캡처를 건너뜁니다.');
    }

    for (const p of pagesWithInternal) {
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
}

main().catch((e) => {
  console.error('❌ 실패:', e);
  process.exit(1);
});
