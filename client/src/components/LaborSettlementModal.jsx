// 인건비 정산 모달 — 편의기능 탭 카드에서 트리거
// 흐름: 공종 필터 → 작업자 선택 → 행마다 일수·일당·식비·교통비 입력 → 카톡 텍스트 복사
// 저장 정책: 카톡 복사 시 변경된 행은 Vendor.unitPrice/defaultMeal/defaultTransport 자동 갱신
// 지출 격리 정책: 지출 탭으로의 push 없음. 카톡 텍스트만 산출.
import { useEffect, useMemo, useState } from 'react';
import { vendorsApi } from '../api/vendors';
import { projectMemosApi } from '../api/projectMemos';
import { useEscape } from '../hooks/useEscape';

export default function LaborSettlementModal({ project, projectId, onClose }) {
  useEscape(true, onClose);
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
        defaults: { dailyRate, meal, transport },
      },
    ]);
  }

  function updateRow(idx, patch) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function removeRow(idx) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function rowTotal(r) {
    const days = Number(r.days || 0);
    return days * (Number(r.dailyRate || 0) + Number(r.meal || 0) + Number(r.transport || 0));
  }

  const grandTotal = useMemo(() => rows.reduce((s, r) => s + rowTotal(r), 0), [rows]);

  function buildText() {
    const head = project ? `[${project.name}] ${title}` : title;
    const lines = [head, '───────────────'];
    rows.forEach((r) => {
      lines.push(`${r.name} ${r.category} (${r.days}일)`);
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
      const text = buildText();

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
            공종 선택 → 작업자 선택 → 일수·금액 입력 → 카톡 텍스트 복사. 일당·식비·교통비는 변경 시 자동 저장되어 다음 정산 시 그 값이 자동 채워집니다. <span className="text-violet-700">복사와 동시에 메모 탭에 "인건비" 태그로 자동 기록됩니다.</span>
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
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-800">{r.name}</div>
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
                        <input
                          type="number"
                          min="0"
                          value={r.dailyRate}
                          onChange={(e) => updateRow(i, { dailyRate: e.target.value })}
                          className="w-24 px-2 py-1 border rounded text-right tabular-nums"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          value={r.meal}
                          onChange={(e) => updateRow(i, { meal: e.target.value })}
                          className="w-20 px-2 py-1 border rounded text-right tabular-nums"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          value={r.transport}
                          onChange={(e) => updateRow(i, { transport: e.target.value })}
                          className="w-20 px-2 py-1 border rounded text-right tabular-nums"
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
                    <td colSpan={5} className="px-3 py-2 text-right text-gray-600">합계</td>
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
