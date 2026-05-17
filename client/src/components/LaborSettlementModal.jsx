// 인건비 정산 모달 — 편의기능 탭 카드에서 트리거
// 흐름: 공종 필터 → 작업자 선택 → 행마다 일수·일당·교통비 + 반장 1명 식비/일 입력 → 카톡 텍스트 복사
// 식비 정책: 반장 1명이 전체 작업자 식비를 일괄 수령 (반장 식비/일 × 전체 일수 합계)
// 저장 정책: 카톡 복사 시 변경된 행은 Vendor.unitPrice/defaultMeal/defaultTransport 자동 갱신
// 지출 격리 정책: 지출 탭으로의 push 없음. 카톡 텍스트만 산출.
import { useEffect, useMemo, useState } from 'react';
import { vendorsApi } from '../api/vendors';
import { projectMemosApi } from '../api/projectMemos';
import { useEscape } from '../hooks/useEscape';
import { useAuth } from '../contexts/AuthContext';
import { appendKakaoFooter } from '../utils/kakaoFooter';
import MoneyInput from './MoneyInput';

export default function LaborSettlementModal({ project, projectId, onClose }) {
  useEscape(true, onClose);
  const auth = useAuth();
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [rows, setRows] = useState([]);
  const [title, setTitle] = useState(() => `${new Date().getMonth() + 1}월 정산`);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  // 회사에서 사용 중인 공종 목록
  useEffect(() => {
    vendorsApi.categories()
      .then(({ categories }) => setCategories(categories || []))
      .catch(() => {});
  }, []);

  // 공종 변경 시 vendor 리스트 로드
  useEffect(() => {
    if (!category) { setVendors([]); return; }
    setLoadingVendors(true);
    vendorsApi.list({ category })
      .then(({ vendors }) => setVendors(vendors || []))
      .catch(() => alert('협력업체 로드 실패'))
      .finally(() => setLoadingVendors(false));
  }, [category]);

  function toggleVendor(v) {
    if (rows.some((r) => r.vendorId === v.id)) {
      setRows(rows.filter((r) => r.vendorId !== v.id));
      return;
    }
    const dailyRate = v.unitPrice != null ? Number(v.unitPrice) : 0;
    const meal = v.defaultMeal != null ? Number(v.defaultMeal) : 0;
    const transport = v.defaultTransport != null ? Number(v.defaultTransport) : 0;
    // 첫 번째로 추가되는 행이 기본 반장 (이미 반장이 있으면 유지)
    const hasLeader = rows.some((r) => r.isLeader);
    setRows([
      ...rows,
      {
        vendorId: v.id,
        name: v.name,
        category: v.category,
        bankAccount: v.bankAccount || '',
        days: 1,
        dailyRate,
        meal,
        transport,
        isLeader: !hasLeader,
        defaults: { dailyRate, meal, transport },
      },
    ]);
  }

  function updateRow(idx, patch) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function setLeader(idx) {
    setRows((prev) => prev.map((r, i) => ({ ...r, isLeader: i === idx })));
  }

  function removeRow(idx) {
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      // 반장을 제거했고 남은 행이 있으면 첫 행을 새 반장으로 자동 지정
      if (prev[idx]?.isLeader && next.length > 0 && !next.some((r) => r.isLeader)) {
        next[0] = { ...next[0], isLeader: true };
      }
      return next;
    });
  }

  const totalDays = useMemo(
    () => rows.reduce((s, r) => s + Number(r.days || 0), 0),
    [rows]
  );

  function rowTotal(r) {
    const days = Number(r.days || 0);
    const base = days * (Number(r.dailyRate || 0) + Number(r.transport || 0));
    // 반장은 식비/일 × 전체 일수 합계를 일괄 수령, 나머지는 식비 0
    const mealSum = r.isLeader ? Number(r.meal || 0) * totalDays : 0;
    return base + mealSum;
  }

  const grandTotal = useMemo(() => rows.reduce((s, r) => s + rowTotal(r), 0), [rows]);

  function buildText() {
    const head = project ? `[${project.name}] ${title}` : title;
    const lines = [head, '───────────────'];
    rows.forEach((r) => {
      const tag = r.isLeader && Number(r.meal || 0) > 0 && totalDays > 0
        ? ` ※반장 식비 ${totalDays}일분 포함`
        : '';
      lines.push(`${r.name} ${r.category} (${r.days}일)${tag}`);
      lines.push(`  ${r.bankAccount || '계좌 미등록'}`);
      lines.push(`  ${rowTotal(r).toLocaleString('ko-KR')}원`);
    });
    lines.push('───────────────');
    lines.push(`합계 ${grandTotal.toLocaleString('ko-KR')}원`);
    return lines.join('\n');
  }

  async function copyAndSave() {
    if (rows.length === 0) {
      alert('작업자를 한 명 이상 선택하세요');
      return;
    }
    setBusy(true);
    try {
      const text = appendKakaoFooter(buildText(), auth?.company?.plan);

      // 1) 카톡 텍스트 클립보드 복사
      await navigator.clipboard.writeText(text);

      // 2) 디폴트값이 변경된 행은 Vendor에 자동 저장 (다음 정산 시 자동 채움)
      const changed = rows.filter((r) =>
        Number(r.dailyRate) !== Number(r.defaults.dailyRate) ||
        Number(r.meal)      !== Number(r.defaults.meal) ||
        Number(r.transport) !== Number(r.defaults.transport)
      );
      await Promise.all(
        changed.map((r) =>
          vendorsApi.update(r.vendorId, {
            unitPrice:        Number(r.dailyRate) || null,
            defaultMeal:      Number(r.meal)      || null,
            defaultTransport: Number(r.transport) || null,
          }).catch(() => {})
        )
      );

      // 3) 메모 탭에 "인건비" 태그로 자동 기록 (실패는 조용히 — 카톡 복사는 이미 성공)
      if (projectId) {
        await projectMemosApi.create(projectId, {
          tag: '인건비',
          content: text,
        }).catch((e) => {
          // eslint-disable-next-line no-console
          console.warn('메모 자동 기록 실패', e);
        });
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      alert('복사 실패: ' + (e?.message || ''));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-navy-800">인건비 정산</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            공종 선택 → 작업자 선택 → 일수·금액 입력 → 카톡 텍스트 복사. 일당·식비·교통비는 변경 시 자동 저장되어 다음 정산 시 그 값이 자동 채워집니다. <span className="text-amber-700">식비는 반장 1명이 일괄 수령 (식비/일 × 전체 일수 합).</span> <span className="text-violet-700">복사와 동시에 메모 탭에 "인건비" 태그로 자동 기록됩니다.</span>
          </p>
        </div>

        <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <div className="text-xs text-gray-500 mb-1">제목</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 4월 정산"
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">공종</div>
            <div className="flex flex-wrap gap-1.5">
              {categories.length === 0 ? (
                <span className="text-sm text-gray-400">
                  등록된 공종이 없습니다. 팀관리 → 협력업체 탭에서 먼저 등록해주세요.
                </span>
              ) : (
                categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`text-sm px-3 py-1 border rounded-full transition ${
                      category === c
                        ? 'bg-navy-700 text-white border-navy-700'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {c}
                  </button>
                ))
              )}
            </div>
          </div>

          {category && (
            <div>
              <div className="text-xs text-gray-500 mb-1">{category} 작업자 (선택하면 아래 표에 추가)</div>
              {loadingVendors ? (
                <div className="text-sm text-gray-400 py-2">로딩...</div>
              ) : vendors.length === 0 ? (
                <div className="text-sm text-gray-400 py-2">{category} 공종에 등록된 사람이 없습니다.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {vendors.map((v) => {
                    const checked = rows.some((r) => r.vendorId === v.id);
                    return (
                      <button
                        key={v.id}
                        onClick={() => toggleVendor(v)}
                        className={`text-sm px-3 py-1.5 border rounded-full transition ${
                          checked
                            ? 'bg-navy-700 text-white border-navy-700'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {checked ? '✓ ' : '+ '}{v.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {rows.length > 0 && (
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-center">반장</th>
                    <th className="px-3 py-2 text-left">이름 · 계좌</th>
                    <th className="px-3 py-2 text-right">일수</th>
                    <th className="px-3 py-2 text-right">일당</th>
                    <th className="px-3 py-2 text-right">식비/일</th>
                    <th className="px-3 py-2 text-right">교통/일</th>
                    <th className="px-3 py-2 text-right">소계</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.vendorId} className="border-t align-top">
                      <td className="px-3 py-2 text-center">
                        <input
                          type="radio"
                          name="leader"
                          checked={!!r.isLeader}
                          onChange={() => setLeader(i)}
                          title="반장 (식비 일괄 수령)"
                          className="h-4 w-4 accent-amber-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-800">
                          {r.name}
                          {r.isLeader && (
                            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 align-middle">반장</span>
                          )}
                        </div>
                        <div className="text-xs">
                          {r.bankAccount
                            ? <span className="text-gray-500">{r.bankAccount}</span>
                            : <span className="text-rose-500">계좌 미등록</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          value={r.days}
                          onChange={(e) => updateRow(i, { days: e.target.value })}
                          className="w-16 px-2 py-1 border rounded text-right tabular-nums"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <MoneyInput
                          value={Number(r.dailyRate) || 0}
                          onChange={(n) => updateRow(i, { dailyRate: n })}
                          className="w-24 px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-3 py-2">
                        {r.isLeader ? (
                          <div className="flex items-center justify-end gap-1">
                            <MoneyInput
                              value={Number(r.meal) || 0}
                              onChange={(n) => updateRow(i, { meal: n })}
                              className="w-20 px-2 py-1 border rounded"
                            />
                            {Number(r.meal || 0) > 0 && totalDays > 0 && (
                              <span className="text-[10px] text-amber-700 whitespace-nowrap">×{totalDays}일</span>
                            )}
                          </div>
                        ) : (
                          <div
                            className="text-right text-xs text-gray-300 tabular-nums"
                            title="반장이 일괄 수령 (위 행에서 입력)"
                          >
                            —
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <MoneyInput
                          value={Number(r.transport) || 0}
                          onChange={(n) => updateRow(i, { transport: n })}
                          className="w-20 px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium text-navy-800">
                        {rowTotal(r).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => removeRow(i)}
                          className="text-xs text-rose-500 hover:underline"
                        >
                          제거
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t font-bold">
                    <td colSpan={6} className="px-3 py-2 text-right text-gray-600">
                      합계 <span className="font-normal text-xs text-gray-400">(총 {totalDays}일)</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-navy-800">
                      {grandTotal.toLocaleString('ko-KR')}원
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {rows.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-1">미리보기 (카톡에 붙여넣을 텍스트)</div>
              <pre className="bg-gray-50 border rounded p-3 text-xs font-mono whitespace-pre-wrap text-gray-700">
{buildText()}
              </pre>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t bg-gray-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded">닫기</button>
          <button
            onClick={copyAndSave}
            disabled={busy || rows.length === 0}
            className={`px-4 py-2 text-sm rounded text-white disabled:opacity-50 ${
              copied ? 'bg-emerald-600' : 'bg-navy-700 hover:bg-navy-800'
            }`}
          >
            {busy ? '처리 중...' : copied ? '✓ 복사됨' : '📋 카톡 복사 + 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
