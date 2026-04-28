import { useState } from 'react';

const emptyForm = {
  name: '',
  customerName: '',
  customerPhone: '',
  siteAddress: '',
  contractAmount: '',
  contractVatRate: '', // '', '0', '10' — 부가세율 (별도/포함)
  area: '',
  startDate: '',
  expectedEndDate: '',
  status: 'PLANNED',
  doorPassword: '',
  siteNotes: '',
};

function toDateInput(iso) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

export default function ProjectForm({ initial, onSubmit, onCancel, submitLabel = '저장' }) {
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    ...(initial
      ? {
          name: initial.name || '',
          customerName: initial.customerName || '',
          customerPhone: initial.customerPhone || '',
          siteAddress: initial.siteAddress || '',
          contractAmount:
            initial.contractAmount != null ? String(initial.contractAmount) : '',
          contractVatRate:
            initial.contractVatRate != null ? String(initial.contractVatRate) : '',
          area: initial.area != null ? String(initial.area) : '',
          startDate: toDateInput(initial.startDate),
          expectedEndDate: toDateInput(initial.expectedEndDate),
          status: initial.status || 'PLANNED',
          doorPassword: initial.doorPassword || '',
          siteNotes: initial.siteNotes || '',
        }
      : {}),
  }));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (!form.name.trim() || !form.customerName.trim() || !form.siteAddress.trim()) {
      setErr('프로젝트명 / 고객명 / 현장 주소는 필수입니다.');
      return;
    }
    if (!form.startDate || !form.expectedEndDate) {
      setErr('시작일과 마감일을 모두 입력해주세요. (캘린더 표시 범위로 사용됩니다)');
      return;
    }
    if (form.startDate > form.expectedEndDate) {
      setErr('마감일은 시작일과 같거나 그 이후여야 합니다.');
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim() || null,
        siteAddress: form.siteAddress.trim(),
        contractAmount: form.contractAmount ? Number(form.contractAmount) : null,
        contractVatRate: form.contractVatRate !== '' ? Number(form.contractVatRate) : null,
        area: form.area ? Number(form.area) : null,
        startDate: form.startDate || null,
        expectedEndDate: form.expectedEndDate || null,
        ...(initial ? { status: form.status } : {}),
        doorPassword: form.doorPassword.trim() || null,
        siteNotes: form.siteNotes.trim() || null,
      });
    } catch (e) {
      setErr(e.response?.data?.error || '저장 실패');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="프로젝트명" required>
          <input
            value={form.name}
            onChange={update('name')}
            placeholder="예: 현진에버빌 3차"
            className="input"
          />
        </Field>
        <Field label="상태">
          <select
            value={form.status}
            onChange={update('status')}
            disabled={!initial}
            className="input disabled:bg-gray-100"
          >
            <option value="PLANNED">예정</option>
            <option value="IN_PROGRESS">진행중</option>
            <option value="ON_HOLD">보류</option>
            <option value="COMPLETED">완료</option>
            <option value="CANCELLED">취소</option>
          </select>
        </Field>
        <Field label="고객명" required>
          <input value={form.customerName} onChange={update('customerName')} className="input" />
        </Field>
        <Field label="고객 연락처">
          <input
            value={form.customerPhone}
            onChange={update('customerPhone')}
            placeholder="010-0000-0000"
            className="input"
          />
        </Field>
        <Field label="시작일" required hint="프로젝트 캘린더 시작 날짜 (착공 전 준비 작업도 이 날부터 기록 가능)">
          <input type="date" value={form.startDate} onChange={update('startDate')} className="input" required />
        </Field>
        <Field label="마감일" required hint="프로젝트 캘린더 마감 날짜">
          <input
            type="date"
            value={form.expectedEndDate}
            onChange={update('expectedEndDate')}
            className="input"
            required
          />
        </Field>
        <Field label="계약 금액 (원)">
          <div className="space-y-1">
            <div className="flex gap-1">
              <input
                type="number"
                value={form.contractAmount}
                onChange={update('contractAmount')}
                placeholder="50000000"
                className="input flex-1"
              />
              <select
                value={form.contractVatRate}
                onChange={update('contractVatRate')}
                title="부가세 처리 방식"
                className="input w-28 text-xs"
              >
                <option value="">부가세 별도</option>
                <option value="10">10% 포함</option>
              </select>
            </div>
            {form.contractAmount && Number(form.contractVatRate) > 0 && (() => {
              const total = Number(form.contractAmount);
              const rate = Number(form.contractVatRate) / 100;
              const supply = Math.round(total / (1 + rate));
              const vat = total - supply;
              return (
                <div className="text-xs text-gray-500 leading-relaxed">
                  공급가액 <span className="text-gray-700 tabular-nums">{supply.toLocaleString('ko-KR')}원</span>
                  {' · '}부가세 <span className="text-gray-700 tabular-nums">{vat.toLocaleString('ko-KR')}원</span>
                  {' '}(자동 분리 표시)
                </div>
              );
            })()}
          </div>
        </Field>
        <Field label="면적 (평)">
          <input
            type="number"
            step="0.01"
            value={form.area}
            onChange={update('area')}
            placeholder="34.0"
            className="input"
          />
        </Field>
        <Field label="출입번호">
          <input
            value={form.doorPassword}
            onChange={update('doorPassword')}
            placeholder="도어락 / 공동현관 비밀번호"
            className="input"
          />
        </Field>
      </div>

      <Field label="현장 주소" required>
        <input
          value={form.siteAddress}
          onChange={update('siteAddress')}
          placeholder="서울시 강남구 테헤란로 123"
          className="input"
        />
      </Field>

      <Field label="현장정보">
        <textarea
          value={form.siteNotes}
          onChange={update('siteNotes')}
          rows={4}
          placeholder={`주차 위치, 엘리베이터 사용시간, 주의사항 등\n예:\n주차: 건물 뒤편 공용주차장\n소음 주의: 오전 8시~오후 6시`}
          className="input resize-y"
        />
      </Field>

      {err && <div className="text-sm text-rose-600">{err}</div>}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50"
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={busy}
          className="px-5 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-50"
        >
          {busy ? '저장 중...' : submitLabel}
        </button>
      </div>

      <style>{`
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 14px;
          outline: none;
        }
        .input:focus {
          border-color: #1e3a66;
          box-shadow: 0 0 0 2px rgba(30, 58, 102, 0.15);
        }
      `}</style>
    </form>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-gray-500 mt-1">{hint}</span>}
    </label>
  );
}
