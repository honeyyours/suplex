import { formatWon } from '../api/simpleQuotes';
import { formatDateDot } from '../utils/date';

// ============================================
// 데이터 매핑 — 그룹 = 한 행으로 압축
// ============================================
// 간편견적 lines: [그룹 헤더, 라인…, 그룹 끝 마커, 평면 라인…] 혼합
// 출력용으로는 그룹 한 묶음을 한 행으로 합침.
//   항목 = 그룹 헤더의 itemName (= 공정명)
//   시공내용 = 그룹 안 라인들의 itemName(spec) 을 ' / ' 로 join
//   금액 = 그룹 안 라인들의 quantity * unitPrice 합
// 그룹 밖 평면 라인은 한 줄씩 단독 행으로.
export function buildPrintRows(lines = []) {
  const rows = [];
  let group = null;
  const closeGroup = () => {
    if (group) { rows.push(group); group = null; }
  };
  for (const l of lines) {
    if (l.isGroup && l.isGroupEnd) { closeGroup(); continue; }
    if (l.isGroup) {
      closeGroup();
      group = { kind: 'group', category: l.itemName || '', items: [], amount: 0 };
      continue;
    }
    const amt = (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0);
    if (group) {
      group.items.push(l);
      group.amount += amt;
    } else {
      rows.push({ kind: 'flat', category: l.itemName || '', items: [l], amount: amt });
    }
  }
  closeGroup();
  return rows.map((r, i) => {
    const detail = r.kind === 'group'
      ? r.items.map((it) => {
          const name = (it.itemName || '').trim();
          const spec = (it.spec || '').trim();
          if (!name && !spec) return '';
          if (name && spec) return `${name}(${spec})`;
          return name || spec;
        }).filter(Boolean).join(' / ')
      : ((r.items[0]?.spec || '').trim() || '');
    return {
      no: String(i + 1).padStart(2, '0'),
      category: r.category,
      detail,
      amount: r.amount,
    };
  });
}

// ============================================
// 클래식 — 견적서_리플레이스디자인.html 기반
// (네이비 + 골드, 풀테두리 표, 시공사 정보 섹션 별도)
// ============================================
function ClassicTemplate({ quote, lines, totals }) {
  const rows = buildPrintRows(lines);
  const designFeeOn = Number(quote.designFeeRate) > 0;
  const round = Number(quote.roundAdjustment) || 0;
  const vatOn = Number(quote.vatRate) > 0;

  return (
    <>
      <style>{CLASSIC_CSS}</style>
      <article className="qpt-classic">
        <header className="qpt-classic__header">
          <h1 className="qpt-classic__title">견 적 서</h1>
          <p className="qpt-classic__title-en">ESTIMATE</p>
          <hr className="qpt-classic__header-divider" />
        </header>

        <section className="qpt-classic__info">
          <div className="qpt-classic__info-block">
            <span className="qpt-classic__info-label">TO.</span>
            <p className="qpt-classic__info-value">
              {quote.clientName || '—'} <small>귀하</small>
            </p>
            <p className="qpt-classic__info-note">아래와 같이 견적합니다.</p>
          </div>
          <div className="qpt-classic__info-block qpt-classic__info-block--right">
            <span className="qpt-classic__info-label">DATE.</span>
            <p className="qpt-classic__info-value">{quote.quoteDate ? formatDateDot(quote.quoteDate) : ''}</p>
            <span className="qpt-classic__info-label">PROJECT.</span>
            <p className="qpt-classic__info-value qpt-classic__info-value--sm">{quote.projectName || ''}</p>
          </div>
        </section>

        <section className="qpt-classic__total">
          <p className="qpt-classic__total-label">TOTAL AMOUNT</p>
          <p className="qpt-classic__total-amount">
            합 계 금 액 :
            <span className="qpt-classic__total-num"> {formatWon(totals.total)} </span>
            원
            {!vatOn && <small>(VAT 별도)</small>}
          </p>
        </section>

        <section className="qpt-classic__company">
          <h2 className="qpt-classic__section-title">시공사 정보</h2>
          <div className="qpt-classic__company-grid">
            <div>
              <p className="qpt-classic__company-name">{quote.supplierName || '—'}</p>
              {quote.supplierOwner && (
                <p className="qpt-classic__company-rep">대표 <strong>{quote.supplierOwner}</strong></p>
              )}
            </div>
            <div className="qpt-classic__company-details">
              {quote.supplierRegNo && (
                <div className="info-row"><span className="info-row__label">등록번호</span><span className="info-row__value">{quote.supplierRegNo}</span></div>
              )}
              {quote.supplierAddress && (
                <div className="info-row"><span className="info-row__label">주&nbsp;&nbsp;&nbsp;&nbsp;소</span><span className="info-row__value">{quote.supplierAddress}</span></div>
              )}
              {quote.supplierTel && (
                <div className="info-row"><span className="info-row__label">연 락 처</span><span className="info-row__value">{quote.supplierTel}</span></div>
              )}
              {quote.supplierEmail && (
                <div className="info-row"><span className="info-row__label">이 메 일</span><span className="info-row__value">{quote.supplierEmail}</span></div>
              )}
            </div>
          </div>
        </section>

        <section className="qpt-classic__items-section">
          <h2 className="qpt-classic__section-title">공사 내역</h2>
          <table className="qpt-classic__items">
            <thead>
              <tr>
                <th className="col-no">NO</th>
                <th className="col-category">항 목</th>
                <th className="col-detail">시 공 내 용</th>
                <th className="col-unit">단위</th>
                <th className="col-amount">금 액</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td className="qpt-classic__empty" colSpan={5}>—</td></tr>
              ) : rows.map((r) => (
                <tr key={r.no}>
                  <td className="col-no">{r.no}</td>
                  <td className="col-category">{r.category}</td>
                  <td className="col-detail">{r.detail}</td>
                  <td className="col-unit">식</td>
                  <td className="col-amount">{r.amount > 0 ? formatWon(r.amount) : '―'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="qpt-classic__sum-section">
          <table className="qpt-classic__sum">
            <tbody>
              <tr><th>합  계</th><td>{formatWon(totals.subtotal)} <span className="unit">원</span></td></tr>
              {designFeeOn && (
                <tr><th>설계 및 감리비 ({Number(quote.designFeeRate)}%)</th><td>{formatWon(totals.designFeeAmount)} <span className="unit">원</span></td></tr>
              )}
              {round !== 0 && (
                <tr><th>단수조정</th><td>{round < 0 ? '-' : ''}{formatWon(Math.abs(round))} <span className="unit">원</span></td></tr>
              )}
              <tr><th>부가세 ({Number(quote.vatRate) || 0}%)</th><td>{formatWon(totals.vatAmount)} <span className="unit">원</span></td></tr>
              <tr className="qpt-classic__sum--total">
                <th>총  금  액</th>
                <td>{formatWon(totals.total)} <span className="unit">원</span></td>
              </tr>
            </tbody>
          </table>
        </section>

        <footer className="qpt-classic__notes">
          {quote.footerNotes ? (
            <p className="qpt-classic__notes-custom">{quote.footerNotes}</p>
          ) : (
            <>
              <p>본 견적서는 <strong>가견적서</strong>이며, 실제 디자인 계약 내용에 따라 금액이 달라질 수 있습니다.</p>
              <p>세금계산서 발행 시 부가세(10%)는 별도이며, 견적 외 공사는 추가금이 발생됩니다.</p>
            </>
          )}
        </footer>
      </article>
    </>
  );
}

const CLASSIC_CSS = `
.qpt-classic, .qpt-classic * { box-sizing: border-box; }
.qpt-classic {
  --c-primary: #2C3E50;
  --c-accent: #C9A961;
  --c-light: #F5F2EC;
  --c-border: #B8B8B8;
  --c-gray: #666666;
  --c-alt: #FAFAF7;
  --c-text: #1a1a1a;
  --c-bg: #ffffff;
  --fs-xs: 11px; --fs-sm: 12px; --fs-base: 13px; --fs-md: 14px;
  --fs-lg: 16px; --fs-xl: 19px; --fs-title: 42px;

  font-family: 'Pretendard', 'Malgun Gothic', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: var(--fs-base);
  color: var(--c-text);
  line-height: 1.5;
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 14mm 18mm;
  background: var(--c-bg);
}

/* 헤더 */
.qpt-classic__header { text-align: center; margin-bottom: 18px; }
.qpt-classic__title { font-size: var(--fs-title); font-weight: 700; color: var(--c-primary);
  letter-spacing: 0.4em; padding-left: 0.4em; margin: 0 0 4px; }
.qpt-classic__title-en { font-size: var(--fs-sm); font-weight: 700; color: var(--c-accent);
  letter-spacing: 0.5em; padding-left: 0.5em; margin: 0; }
.qpt-classic__header-divider { border: 0; border-top: 2px solid var(--c-accent); margin-top: 14px; }

/* 발주처/일자 */
.qpt-classic__info { display: flex; justify-content: space-between; gap: 16px; margin: 18px 0; }
.qpt-classic__info-block { flex: 1; }
.qpt-classic__info-block--right { text-align: right; }
.qpt-classic__info-label { display: block; font-size: var(--fs-xs); font-weight: 700;
  color: var(--c-gray); letter-spacing: 0.2em; margin-bottom: 4px; }
.qpt-classic__info-value { font-size: var(--fs-xl); font-weight: 700; color: var(--c-primary);
  margin: 0 0 8px; }
.qpt-classic__info-value--sm { font-size: var(--fs-md); font-weight: 400; }
.qpt-classic__info-value small { font-size: var(--fs-md); font-weight: 400; }
.qpt-classic__info-note { font-size: var(--fs-base); color: var(--c-gray); margin: 0; }

/* 합계 박스 */
.qpt-classic__total { background: var(--c-primary); color: #fff; text-align: center;
  padding: 14px 16px; margin-bottom: 18px; }
.qpt-classic__total-label { font-size: var(--fs-xs); font-weight: 700; letter-spacing: 0.4em;
  padding-left: 0.4em; margin: 0 0 4px; opacity: 0.9; }
.qpt-classic__total-amount { font-size: var(--fs-xl); font-weight: 700; letter-spacing: 0.05em;
  margin: 0; }
.qpt-classic__total-num { color: var(--c-accent); font-size: 22px; margin: 0 4px; }
.qpt-classic__total-amount small { font-size: var(--fs-sm); font-weight: 400;
  color: var(--c-light); margin-left: 6px; }

/* 섹션 타이틀 */
.qpt-classic__section-title { font-size: var(--fs-md); font-weight: 700; color: var(--c-primary);
  letter-spacing: 0.15em; padding-bottom: 6px; border-bottom: 2px solid var(--c-primary);
  margin: 0 0 12px; }

/* 시공사 정보 */
.qpt-classic__company { margin-bottom: 18px; }
.qpt-classic__company-grid { display: flex; gap: 16px; align-items: center; }
.qpt-classic__company-grid > * { flex: 1; }
.qpt-classic__company-name { font-size: 22px; font-weight: 700; color: var(--c-primary);
  margin: 0 0 6px; }
.qpt-classic__company-rep { font-size: var(--fs-md); color: var(--c-gray); margin: 0; }
.qpt-classic__company-rep strong { color: var(--c-text); font-weight: 700; margin-left: 4px; }
.qpt-classic__company-details { font-size: var(--fs-sm); }
.qpt-classic__company-details .info-row { display: flex; gap: 12px; margin-bottom: 4px; }
.qpt-classic__company-details .info-row__label { flex: 0 0 60px; color: var(--c-gray);
  letter-spacing: 0.1em; }
.qpt-classic__company-details .info-row__value { flex: 1; }

/* 공사 내역 표 */
.qpt-classic__items-section { margin-bottom: 18px; }
.qpt-classic__items { width: 100%; border-collapse: collapse; font-size: var(--fs-base); }
.qpt-classic__items thead th { background: var(--c-primary); color: #fff; font-weight: 700;
  padding: 8px 6px; text-align: center; border: 1px solid var(--c-primary);
  -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.qpt-classic__items tbody td { border: 1px solid var(--c-border); padding: 7px 10px;
  vertical-align: middle; }
.qpt-classic__items tbody tr:nth-child(even) td { background: var(--c-alt);
  -webkit-print-color-adjust: exact; print-color-adjust: exact; }
/* 컬럼 너비는 thead/tbody 공통, 색·정렬은 tbody만 — thead 헤더는 흰색+가운데 일괄 유지 */
.qpt-classic__items .col-no { width: 7%; }
.qpt-classic__items .col-category { width: 13%; }
.qpt-classic__items .col-detail { width: 56%; }
.qpt-classic__items .col-unit { width: 8%; }
.qpt-classic__items .col-amount { width: 16%; }
.qpt-classic__items tbody td.col-no { text-align: center; color: var(--c-gray); }
.qpt-classic__items tbody td.col-category { text-align: center; font-weight: 700;
  color: var(--c-primary); }
.qpt-classic__items tbody td.col-unit { text-align: center; }
.qpt-classic__items tbody td.col-amount { text-align: right; color: var(--c-text); }
.qpt-classic__empty { text-align: center; color: var(--c-gray); padding: 24px; }

/* 합계 산출 */
.qpt-classic__sum-section { margin-bottom: 12px; }
.qpt-classic__sum { width: 100%; border-collapse: collapse; font-size: var(--fs-base); }
.qpt-classic__sum th, .qpt-classic__sum td { border: 1px solid var(--c-border);
  padding: 7px 12px; }
.qpt-classic__sum th { width: 60%; text-align: right; font-weight: 400; }
.qpt-classic__sum td { text-align: right; }
.qpt-classic__sum td .unit { color: var(--c-gray); margin-left: 4px; font-size: var(--fs-sm); }
.qpt-classic__sum--total th, .qpt-classic__sum--total td { background: var(--c-light);
  font-weight: 700; font-size: var(--fs-md); color: var(--c-primary);
  -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.qpt-classic__sum--total td .unit { color: var(--c-primary); }

/* 푸터 안내 */
.qpt-classic__notes { font-size: var(--fs-xs); color: var(--c-gray); line-height: 1.7; }
.qpt-classic__notes p { margin: 0; }
.qpt-classic__notes p::before { content: "※"; color: var(--c-accent); font-weight: 700;
  margin-right: 6px; }
.qpt-classic__notes-custom { white-space: pre-line; }
.qpt-classic__notes-custom::before { content: ""; margin-right: 0; }
.qpt-classic__notes strong { color: var(--c-primary); font-weight: 700; }

/* 인쇄 */
@page { size: A4; margin: 0; }
@media print {
  .qpt-classic { width: 100%; min-height: auto; margin: 0; }
}
`;

// ============================================
// 사이드바 — 견적서_v2_사이드바.html 기반
// (다크 사이드바 + 워밍 베이지, 우측 미니멀 표)
// ============================================
function SidebarTemplate({ quote, lines, totals }) {
  const rows = buildPrintRows(lines);
  const designFeeOn = Number(quote.designFeeRate) > 0;
  const round = Number(quote.roundAdjustment) || 0;
  const vatOn = Number(quote.vatRate) > 0;

  return (
    <>
      <style>{SIDEBAR_CSS}</style>
      <article className="qpt-side">
        <aside className="qpt-side__sidebar">
          <div className="qpt-side__brand">
            <h2 className="qpt-side__company-name">{quote.supplierName || '—'}</h2>
          </div>

          <section className="qpt-side__info">
            <div className="qpt-side__info-block">
              <span className="qpt-side__info-label">CLIENT</span>
              <p className="qpt-side__info-value">{quote.clientName || '—'} <small>귀하</small></p>
            </div>
            <div className="qpt-side__info-block">
              <span className="qpt-side__info-label">DATE</span>
              <p className="qpt-side__info-value">{quote.quoteDate ? formatDateDot(quote.quoteDate) : ''}</p>
            </div>
            <div className="qpt-side__info-block">
              <span className="qpt-side__info-label">PROJECT</span>
              <p className="qpt-side__info-value">{quote.projectName || ''}</p>
            </div>
          </section>

          <section className="qpt-side__total">
            <span className="qpt-side__total-label">TOTAL AMOUNT</span>
            <p className="qpt-side__total-amount">
              {formatWon(totals.total)}원
              {!vatOn && <small>VAT 별도</small>}
            </p>
          </section>

          <footer className="qpt-side__company-details">
            {quote.supplierOwner && (
              <div className="info-row"><span className="info-row__label">CEO</span><span className="info-row__value">{quote.supplierOwner}</span></div>
            )}
            {quote.supplierRegNo && (
              <div className="info-row"><span className="info-row__label">REG.</span><span className="info-row__value">{quote.supplierRegNo}</span></div>
            )}
            {quote.supplierAddress && (
              <div className="info-row"><span className="info-row__label">ADDR.</span><span className="info-row__value">{quote.supplierAddress}</span></div>
            )}
            {quote.supplierTel && (
              <div className="info-row"><span className="info-row__label">TEL.</span><span className="info-row__value">{quote.supplierTel}</span></div>
            )}
            {quote.supplierEmail && (
              <div className="info-row"><span className="info-row__label">MAIL</span><span className="info-row__value">{quote.supplierEmail}</span></div>
            )}
          </footer>
        </aside>

        <main className="qpt-side__main">
          <header className="qpt-side__header">
            <h1 className="qpt-side__title">Estimate.</h1>
            <p className="qpt-side__title-sub">견 적 서</p>
            <p className="qpt-side__greeting">아래와 같이 견적합니다.</p>
          </header>

          <section className="qpt-side__items-section">
            <h2 className="qpt-side__section-title">SCOPE OF WORK</h2>
            <table className="qpt-side__items">
              <thead>
                <tr>
                  <th className="col-no">NO</th>
                  <th className="col-category">항목</th>
                  <th className="col-detail">시공내용</th>
                  <th className="col-amount">금액</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td className="qpt-side__empty" colSpan={4}>—</td></tr>
                ) : rows.map((r) => (
                  <tr key={r.no}>
                    <td className="col-no">{r.no}</td>
                    <td className="col-category">{r.category}</td>
                    <td className="col-detail">{r.detail}</td>
                    <td className="col-amount">{r.amount > 0 ? formatWon(r.amount) : '―'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="qpt-side__sum-section">
            <table className="qpt-side__sum">
              <tbody>
                <tr><th>합  계</th><td>{formatWon(totals.subtotal)} <span className="unit">원</span></td></tr>
                {designFeeOn && (
                  <tr><th>설계 및 감리비 ({Number(quote.designFeeRate)}%)</th><td>{formatWon(totals.designFeeAmount)} <span className="unit">원</span></td></tr>
                )}
                {round !== 0 && (
                  <tr><th>단수조정</th><td>{round < 0 ? '-' : ''}{formatWon(Math.abs(round))} <span className="unit">원</span></td></tr>
                )}
                <tr><th>부가세 ({Number(quote.vatRate) || 0}%)</th><td>{formatWon(totals.vatAmount)} <span className="unit">원</span></td></tr>
                <tr className="qpt-side__sum--total">
                  <th>총  금  액</th>
                  <td>{formatWon(totals.total)} <span className="unit">원</span></td>
                </tr>
              </tbody>
            </table>
          </section>

          <footer className="qpt-side__notes">
            {quote.footerNotes ? (
              <p className="qpt-side__notes-custom">{quote.footerNotes}</p>
            ) : (
              <>
                <p>본 견적서는 <strong>가견적서</strong>이며, 실제 디자인 계약 내용에 따라 금액이 달라질 수 있습니다.</p>
                <p>세금계산서 발행 시 부가세(10%)는 별도이며, 견적 외 공사는 추가금이 발생됩니다.</p>
              </>
            )}
          </footer>
        </main>
      </article>
    </>
  );
}

const SIDEBAR_CSS = `
.qpt-side, .qpt-side * { box-sizing: border-box; }
.qpt-side {
  --c-primary: #1F1D1A;
  --c-accent: #B8956A;
  --c-light: #F4F0EA;
  --c-border: #E5E2DC;
  --c-gray: #8A8680;
  --c-text: #1F1D1A;
  --c-bg: #FFFFFF;
  --c-side-bg: #1F1D1A;
  --c-side-text: #FFFFFF;
  --c-side-muted: #B8B3AB;
  --fs-xs: 10px; --fs-sm: 11px; --fs-base: 12px; --fs-md: 14px;
  --fs-lg: 16px; --fs-xl: 22px; --fs-display: 64px;

  font-family: 'Pretendard', 'Malgun Gothic', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: var(--fs-base);
  color: var(--c-text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;

  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  background: var(--c-bg);
  display: flex;
  align-items: stretch;
}

/* 좌측 사이드바 */
.qpt-side__sidebar {
  flex: 0 0 28%;
  background: var(--c-side-bg);
  color: var(--c-side-text);
  padding: 20mm 14mm;
  display: flex;
  flex-direction: column;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.qpt-side__brand {
  margin-bottom: 28px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--c-accent);
}
.qpt-side__company-name { font-size: 19px; font-weight: 700; white-space: nowrap;
  color: #fff; margin: 0; }

.qpt-side__info { margin-bottom: 28px; }
.qpt-side__info-block { margin-bottom: 18px; }
.qpt-side__info-block:last-child { margin-bottom: 0; }
.qpt-side__info-label { display: block; font-size: var(--fs-xs); font-weight: 700;
  color: var(--c-accent); letter-spacing: 0.3em; margin-bottom: 5px; }
.qpt-side__info-value { font-size: var(--fs-md); font-weight: 500; color: #fff; margin: 0; }
.qpt-side__info-value small { opacity: 0.7; }

.qpt-side__total {
  margin-top: auto;
  margin-bottom: 28px;
  padding: 22px 0;
  border-top: 1px solid rgba(184, 149, 106, 0.4);
  border-bottom: 1px solid rgba(184, 149, 106, 0.4);
}
.qpt-side__total-label { display: block; font-size: var(--fs-xs); font-weight: 700;
  color: var(--c-accent); letter-spacing: 0.4em; margin-bottom: 10px; }
.qpt-side__total-amount { font-size: 26px; font-weight: 700; color: #fff;
  line-height: 1.2; margin: 0; }
.qpt-side__total-amount small { display: block; font-size: var(--fs-xs);
  color: var(--c-side-muted); font-weight: 400; letter-spacing: 0.1em; margin-top: 4px; }

.qpt-side__company-details { font-size: var(--fs-xs); }
.qpt-side__company-details .info-row { display: flex; gap: 12px; margin-bottom: 6px;
  color: var(--c-side-muted); }
.qpt-side__company-details .info-row__label { flex: 0 0 44px; color: var(--c-accent);
  font-weight: 700; letter-spacing: 0.15em; }
.qpt-side__company-details .info-row__value { flex: 1; line-height: 1.5; word-break: break-all; }

/* 우측 메인 */
.qpt-side__main { flex: 1; padding: 22mm 16mm; display: flex; flex-direction: column; }

.qpt-side__header { margin-bottom: 26px; }
.qpt-side__title { font-size: var(--fs-display); font-weight: 200; letter-spacing: -0.02em;
  color: var(--c-primary); line-height: 0.95; margin: 0 0 8px; }
.qpt-side__title-sub { font-size: var(--fs-sm); color: var(--c-gray); letter-spacing: 0.5em;
  padding-left: 0.5em; margin: 0 0 14px; }
.qpt-side__greeting { font-size: var(--fs-base); color: var(--c-gray); margin: 0; }

.qpt-side__section-title { font-size: var(--fs-xs); font-weight: 700; color: var(--c-primary);
  letter-spacing: 0.35em; margin: 0 0 12px; padding-bottom: 8px;
  border-bottom: 2px solid var(--c-primary); }

.qpt-side__items-section { margin-bottom: 22px; }
.qpt-side__items { width: 100%; border-collapse: collapse; font-size: var(--fs-base); }
.qpt-side__items thead th { font-size: var(--fs-xs); font-weight: 700; color: var(--c-gray);
  letter-spacing: 0.2em; padding: 8px 6px; text-align: left;
  border-bottom: 1px solid var(--c-primary); }
.qpt-side__items thead .col-amount { text-align: right; }
.qpt-side__items tbody td { padding: 9px 6px; border-bottom: 1px solid var(--c-border);
  vertical-align: top; line-height: 1.5; }
.qpt-side__items .col-no { width: 7%; color: var(--c-gray); font-size: var(--fs-xs); }
.qpt-side__items .col-category { width: 15%; font-weight: 700; color: var(--c-primary); }
.qpt-side__items .col-detail { width: 65%; }
.qpt-side__items .col-amount { width: 13%; text-align: right; color: var(--c-text); }
.qpt-side__empty { text-align: center; color: var(--c-gray); padding: 24px; }

.qpt-side__sum-section { margin-left: auto; width: 60%; margin-bottom: auto; }
.qpt-side__sum { width: 100%; border-collapse: collapse; font-size: var(--fs-base); }
.qpt-side__sum th, .qpt-side__sum td { padding: 7px 8px;
  border-bottom: 1px solid var(--c-border); }
.qpt-side__sum th { text-align: right; font-weight: 400; color: var(--c-gray); width: 60%; }
.qpt-side__sum td { text-align: right; color: var(--c-text); }
.qpt-side__sum td .unit { color: var(--c-gray); font-size: var(--fs-xs); margin-left: 4px; }
.qpt-side__sum--total th, .qpt-side__sum--total td { color: var(--c-primary); font-weight: 700;
  font-size: var(--fs-md); border-top: 2px solid var(--c-primary); border-bottom: none;
  padding-top: 9px; }
.qpt-side__sum--total td .unit { color: var(--c-primary); font-weight: 400; }

.qpt-side__notes { margin-top: 22px; padding-top: 14px; border-top: 1px solid var(--c-border);
  font-size: var(--fs-xs); color: var(--c-gray); line-height: 1.7; }
.qpt-side__notes p { margin: 0; }
.qpt-side__notes p::before { content: "—"; color: var(--c-accent); font-weight: 700;
  margin-right: 6px; }
.qpt-side__notes-custom { white-space: pre-line; }
.qpt-side__notes-custom::before { content: ""; margin-right: 0; }
.qpt-side__notes strong { color: var(--c-primary); font-weight: 700; }

/* 인쇄 */
@page { size: A4; margin: 0; }
@media print {
  .qpt-side { width: 100%; min-height: auto; margin: 0; }
}
`;

// ============================================
// 에디토리얼 — 견적서_v3_에디토리얼.html 기반
// (아이보리 배경 + 가는 라인 위계 + hero 합계 + 콜로폰 회사정보)
// ============================================
function EditorialTemplate({ quote, lines, totals }) {
  const rows = buildPrintRows(lines);
  const designFeeOn = Number(quote.designFeeRate) > 0;
  const round = Number(quote.roundAdjustment) || 0;
  const vatOn = Number(quote.vatRate) > 0;
  const docNo = quote.quoteDate ? formatDateDot(quote.quoteDate).replace(/\./g, ' ·') : '';

  return (
    <>
      <style>{EDITORIAL_CSS}</style>
      <article className="qpt-edit">
        <div className="qpt-edit__top-strip">
          <span className="qpt-edit__company-en">{quote.supplierName || '—'}</span>
          {docNo && <span className="qpt-edit__doc-no">№ {docNo}</span>}
        </div>

        <header className="qpt-edit__header">
          <h1 className="qpt-edit__title">Estimate.</h1>
          <p className="qpt-edit__title-sub">견 적 서</p>
        </header>

        <section className="qpt-edit__info">
          <div className="qpt-edit__info-block">
            <span className="qpt-edit__info-label">CLIENT</span>
            <p className="qpt-edit__info-value">{quote.clientName || '—'} <small>귀하</small></p>
          </div>
          <div className="qpt-edit__info-block">
            <span className="qpt-edit__info-label">DATE</span>
            <p className="qpt-edit__info-value">{quote.quoteDate ? formatDateDot(quote.quoteDate) : ''}</p>
          </div>
          <div className="qpt-edit__info-block">
            <span className="qpt-edit__info-label">PROJECT</span>
            <p className="qpt-edit__info-value">{quote.projectName || ''}</p>
          </div>
        </section>

        <section className="qpt-edit__total">
          <div className="qpt-edit__total-header">
            <span className="qpt-edit__total-label">TOTAL AMOUNT</span>
            <span className="qpt-edit__total-meta">{vatOn ? `VAT 포함 (${Number(quote.vatRate)}%)` : 'VAT 별도'}</span>
          </div>
          <p className="qpt-edit__total-amount">
            <span className="currency">₩</span>
            <span className="amount-num">{formatWon(totals.total)}</span>
            <span className="unit">원</span>
          </p>
        </section>

        <section className="qpt-edit__items-section">
          <h2 className="qpt-edit__section-title">SCOPE OF WORK</h2>
          <table className="qpt-edit__items">
            <thead>
              <tr>
                <th className="col-no">NO</th>
                <th className="col-category">항목</th>
                <th className="col-detail">시공내용</th>
                <th className="col-amount">금액</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td className="qpt-edit__empty" colSpan={4}>—</td></tr>
              ) : rows.map((r) => (
                <tr key={r.no}>
                  <td className="col-no">{r.no}</td>
                  <td className="col-category">{r.category}</td>
                  <td className="col-detail">{r.detail}</td>
                  <td className="col-amount">{r.amount > 0 ? formatWon(r.amount) : '―'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="qpt-edit__sum-section">
          <table className="qpt-edit__sum">
            <tbody>
              <tr><th>합  계</th><td>{formatWon(totals.subtotal)} <span className="unit">원</span></td></tr>
              {designFeeOn && (
                <tr><th>설계 및 감리비 ({Number(quote.designFeeRate)}%)</th><td>{formatWon(totals.designFeeAmount)} <span className="unit">원</span></td></tr>
              )}
              {round !== 0 && (
                <tr><th>단수조정</th><td>{round < 0 ? '-' : ''}{formatWon(Math.abs(round))} <span className="unit">원</span></td></tr>
              )}
              <tr><th>부가세 ({Number(quote.vatRate) || 0}%)</th><td>{formatWon(totals.vatAmount)} <span className="unit">원</span></td></tr>
              <tr className="qpt-edit__sum--total">
                <th>총  금  액</th>
                <td>{formatWon(totals.total)} <span className="unit">원</span></td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="qpt-edit__notes">
          {quote.footerNotes ? (
            <p className="qpt-edit__notes-custom">{quote.footerNotes}</p>
          ) : (
            <>
              <p>본 견적서는 <strong>가견적서</strong>이며, 실제 디자인 계약 내용에 따라 금액이 달라질 수 있습니다.</p>
              <p>세금계산서 발행 시 부가세(10%)는 별도이며, 견적 외 공사는 추가금이 발생됩니다.</p>
            </>
          )}
        </section>

        <footer className="qpt-edit__company">
          {quote.supplierName && (
            <p className="qpt-edit__company-name">{quote.supplierName}</p>
          )}
          <div className="qpt-edit__company-details">
            {quote.supplierOwner && (
              <span className="info-row"><span className="info-row__label">CEO</span><span className="info-row__value">{quote.supplierOwner}</span></span>
            )}
            {quote.supplierRegNo && (
              <span className="info-row"><span className="info-row__label">REG.</span><span className="info-row__value">{quote.supplierRegNo}</span></span>
            )}
            {quote.supplierTel && (
              <span className="info-row"><span className="info-row__label">TEL.</span><span className="info-row__value">{quote.supplierTel}</span></span>
            )}
            {quote.supplierEmail && (
              <span className="info-row"><span className="info-row__label">MAIL</span><span className="info-row__value">{quote.supplierEmail}</span></span>
            )}
            {quote.supplierAddress && (
              <span className="info-row"><span className="info-row__label">ADDR.</span><span className="info-row__value">{quote.supplierAddress}</span></span>
            )}
          </div>
        </footer>
      </article>
    </>
  );
}

const EDITORIAL_CSS = `
.qpt-edit, .qpt-edit * { box-sizing: border-box; }
.qpt-edit {
  --c-primary: #1A1A1A;
  --c-accent: #8B7355;
  --c-light: #F0EBE2;
  --c-border: #D8D2C4;
  --c-gray: #999999;
  --c-text: #1A1A1A;
  --c-bg: #FAF8F3;
  --fs-xs: 10px; --fs-sm: 11px; --fs-base: 13px; --fs-md: 14px;
  --fs-lg: 17px; --fs-xl: 28px; --fs-display: 64px; --fs-title: 56px;

  font-family: 'Pretendard', 'Malgun Gothic', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: var(--fs-base);
  color: var(--c-text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;

  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 16mm 22mm 14mm;
  background: var(--c-bg);
  display: flex;
  flex-direction: column;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* 0. 상단 스트립 */
.qpt-edit__top-strip { display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 10px; border-bottom: 1px solid var(--c-border); margin-bottom: 26px; }
.qpt-edit__company-en { font-size: var(--fs-xs); font-weight: 700; color: var(--c-primary);
  letter-spacing: 0.4em; text-transform: uppercase; }
.qpt-edit__doc-no { font-size: var(--fs-xs); font-weight: 400; color: var(--c-gray);
  letter-spacing: 0.3em; }

/* 1. 메인 타이틀 */
.qpt-edit__header { margin-bottom: 26px; }
.qpt-edit__title { font-size: var(--fs-title); font-weight: 200; color: var(--c-primary);
  line-height: 0.95; letter-spacing: -0.02em; margin: 0 0 10px; }
.qpt-edit__title-sub { font-size: var(--fs-xs); font-weight: 700; color: var(--c-primary);
  letter-spacing: 0.5em; padding-left: 0.5em; margin: 0; }

/* 2. 발주처/일자/프로젝트 가로 3분할 */
.qpt-edit__info { display: flex; border-top: 1px solid var(--c-primary);
  border-bottom: 1px solid var(--c-border); padding: 14px 0; margin-bottom: 26px; }
.qpt-edit__info-block { flex: 1; padding-right: 16px; }
.qpt-edit__info-block + .qpt-edit__info-block { padding-left: 16px;
  border-left: 1px solid var(--c-border); }
.qpt-edit__info-label { display: block; font-size: var(--fs-xs); font-weight: 700;
  color: var(--c-gray); letter-spacing: 0.3em; margin-bottom: 6px; }
.qpt-edit__info-value { font-size: var(--fs-md); font-weight: 500; color: var(--c-primary);
  margin: 0; }
.qpt-edit__info-value small { font-size: var(--fs-sm); font-weight: 400; color: var(--c-gray); }

/* 3. 합계 hero */
.qpt-edit__total { margin-bottom: 26px; padding: 14px 0 18px; }
.qpt-edit__total-header { display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 10px; }
.qpt-edit__total-label { display: block; font-size: var(--fs-xs); font-weight: 700;
  color: var(--c-primary); letter-spacing: 0.5em; }
.qpt-edit__total-meta { font-size: var(--fs-xs); font-weight: 700; color: var(--c-gray);
  letter-spacing: 0.3em; }
.qpt-edit__total-amount { font-size: 52px; font-weight: 200; color: var(--c-primary);
  line-height: 1; letter-spacing: -0.02em; margin: 0;
  white-space: nowrap; }
.qpt-edit__total-amount .currency { font-size: 22px; font-weight: 300;
  color: var(--c-primary); margin-right: 8px; vertical-align: 13px; }
.qpt-edit__total-amount .amount-num { letter-spacing: -0.02em; }
.qpt-edit__total-amount .unit { font-size: 22px; font-weight: 300;
  color: var(--c-primary); margin-left: 6px; }

/* 4. 섹션 타이틀 */
.qpt-edit__section-title { font-size: var(--fs-xs); font-weight: 700; color: var(--c-primary);
  letter-spacing: 0.5em; padding-bottom: 10px; border-bottom: 1px solid var(--c-primary);
  margin: 0 0 4px; }

/* 5. 공사 내역 표 (미니멀) */
.qpt-edit__items-section { margin-bottom: 18px; }
.qpt-edit__items { width: 100%; border-collapse: collapse; font-size: var(--fs-base); }
.qpt-edit__items thead th { font-size: var(--fs-xs); font-weight: 400; color: var(--c-gray);
  letter-spacing: 0.25em; padding: 10px 6px 7px; text-align: left;
  border-bottom: 1px solid var(--c-border); }
.qpt-edit__items thead .col-amount { text-align: right; }
.qpt-edit__items tbody td { padding: 8px 6px; border-bottom: 1px solid var(--c-border);
  vertical-align: top; line-height: 1.5; }
.qpt-edit__items tbody tr:last-child td { border-bottom: 1px solid var(--c-primary); }
/* 컬럼 너비 공통 + 색·정렬은 tbody 만 (헤더는 위 thead th 규칙으로 통일) */
.qpt-edit__items .col-no { width: 7%; }
.qpt-edit__items .col-category { width: 16%; }
.qpt-edit__items .col-detail { width: 64%; }
.qpt-edit__items .col-amount { width: 13%; }
.qpt-edit__items tbody td.col-no { color: var(--c-gray); font-size: var(--fs-xs); padding-top: 10px; }
.qpt-edit__items tbody td.col-category { font-weight: 700; color: var(--c-primary); }
.qpt-edit__items tbody td.col-detail { color: var(--c-text); }
.qpt-edit__items tbody td.col-amount { text-align: right; color: var(--c-gray); padding-top: 10px; }
.qpt-edit__empty { text-align: center; color: var(--c-gray); padding: 24px; }

/* 6. 합계 산출 — 우측 50%, 박스 X */
.qpt-edit__sum-section { display: flex; justify-content: flex-end; margin-bottom: 26px; }
.qpt-edit__sum { width: 50%; border-collapse: collapse; font-size: var(--fs-base); }
.qpt-edit__sum th, .qpt-edit__sum td { padding: 8px 0;
  border-bottom: 1px solid var(--c-border); }
.qpt-edit__sum th { text-align: right; font-weight: 400; color: var(--c-gray); width: 65%;
  padding-right: 16px; }
.qpt-edit__sum td { text-align: right; color: var(--c-text); }
.qpt-edit__sum td .unit { color: var(--c-gray); font-size: var(--fs-xs); margin-left: 6px;
  letter-spacing: 0.1em; }
.qpt-edit__sum--total th, .qpt-edit__sum--total td { color: var(--c-primary); font-weight: 700;
  font-size: var(--fs-lg); border-top: 1px solid var(--c-primary); border-bottom: none;
  padding-top: 12px; letter-spacing: 0.05em; }
.qpt-edit__sum--total td .unit { color: var(--c-primary); font-weight: 400;
  font-size: var(--fs-sm); }

/* 7. 안내문 */
.qpt-edit__notes { font-size: var(--fs-xs); color: var(--c-gray); line-height: 1.8;
  margin-bottom: 18px; }
.qpt-edit__notes p { margin: 0; }
.qpt-edit__notes p::before { content: "—"; color: var(--c-accent); font-weight: 700;
  margin-right: 8px; letter-spacing: 0; }
.qpt-edit__notes-custom { white-space: pre-line; }
.qpt-edit__notes-custom::before { content: ""; margin-right: 0; }
.qpt-edit__notes strong { color: var(--c-primary); font-weight: 700; }

/* 8. 콜로폰 회사정보 (페이지 하단) */
.qpt-edit__company { margin-top: auto; padding-top: 14px; border-top: 1px solid var(--c-border); }
.qpt-edit__company-name { font-size: var(--fs-sm); font-weight: 700; color: var(--c-primary);
  letter-spacing: 0.2em; margin: 0 0 6px; text-transform: uppercase; }
.qpt-edit__company-details { font-size: var(--fs-xs); color: var(--c-gray); line-height: 1.8; }
.qpt-edit__company-details .info-row { display: inline; }
.qpt-edit__company-details .info-row__label { color: var(--c-primary); font-weight: 700;
  letter-spacing: 0.15em; margin-right: 6px; }
.qpt-edit__company-details .info-row__value { margin-right: 16px; }

/* 인쇄 */
@page { size: A4; margin: 0; }
@media print {
  .qpt-edit { width: 100%; min-height: auto; margin: 0; }
}
`;

// ============================================
// Registry — 양식 추가는 이 배열에 push 만
// ============================================
export const QUOTE_PRINT_TEMPLATES = [
  { key: 'classic',   label: '클래식 (네이비/풀테두리)',   Component: ClassicTemplate },
  { key: 'sidebar',   label: '사이드바 (다크/미니멀)',     Component: SidebarTemplate },
  { key: 'editorial', label: '에디토리얼 (아이보리/hero)', Component: EditorialTemplate },
];

export const DEFAULT_TEMPLATE_KEY = 'classic';
