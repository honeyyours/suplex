// 견적상담 — 공정별 참조 메모 + 기본 메모.
// 좌측: 공정 체크박스 (견적서 NewQuoteWithPhasesModal 패턴)
// 우측: 기본 메모(항상) + 체크된 공정의 메모 카드. textarea blur 자동저장.
// 마지막 수정자 이름·직책·시각 자동 표시.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { STANDARD_PHASES } from '../utils/phases';
import { usePhaseLabels } from '../contexts/PhaseLabelsContext';
import { phaseNotesApi, GENERAL_PHASE, ROLE_LABEL } from '../api/phaseNotes';
import { projectsApi } from '../api/projects';

const SELECTABLE_PHASES = STANDARD_PHASES.filter((p) => p.key !== 'OTHER');

export default function ProjectQuoteConsultations() {
  const { project } = useOutletContext();
  const projectId = project?.id;
  const { displayPhase } = usePhaseLabels();

  const [notesByPhase, setNotesByPhase] = useState({}); // { [phase]: note }
  const [loading, setLoading] = useState(true);
  // 좌측 체크 — 메모 있는 공정 자동 ON. 사용자가 추가로 체크/해제 가능.
  // 메모가 비면 자동으로 false 되도록 reload 시 sync.
  const [checked, setChecked] = useState({});

  async function reload() {
    setLoading(true);
    try {
      const { notes } = await phaseNotesApi.list(projectId);
      const map = {};
      const ck = {};
      for (const n of notes) {
        map[n.phase] = n;
        if (n.phase !== GENERAL_PHASE) ck[n.phase] = true;
      }
      setNotesByPhase(map);
      // 사용자가 펼쳐둔 체크 상태는 유지하되, 메모 있는 건 강제 ON
      setChecked((prev) => ({ ...prev, ...ck }));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (projectId) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  function toggleCheck(label) {
    setChecked((prev) => {
      const wasChecked = !!prev[label];
      const hasNote = !!(notesByPhase[label]?.body?.trim());
      if (wasChecked && hasNote) {
        // 체크 해제하려는데 메모가 있음 — confirm
        if (!confirm(`'${displayPhase(label)}' 메모를 삭제할까요?`)) return prev;
        phaseNotesApi.remove(projectId, label).then(() => {
          setNotesByPhase((m) => {
            const { [label]: _, ...rest } = m;
            return rest;
          });
        }).catch(() => {});
      }
      return { ...prev, [label]: !wasChecked };
    });
  }

  // 메모 저장 (blur 또는 외부 호출). body가 빈 문자열이면 서버에서 자동 삭제.
  async function saveNote(phase, body) {
    const data = await phaseNotesApi.upsert(projectId, phase, body);
    if (data.deleted) {
      setNotesByPhase((m) => {
        const { [phase]: _, ...rest } = m;
        return rest;
      });
      if (phase !== GENERAL_PHASE) {
        setChecked((c) => ({ ...c, [phase]: false }));
      }
    } else if (data.note) {
      setNotesByPhase((m) => ({ ...m, [phase]: data.note }));
    }
  }

  // 우측에 표시할 공정 = 체크된 + 메모 있는
  const visiblePhases = useMemo(() => {
    return SELECTABLE_PHASES.filter((p) => checked[p.label] || notesByPhase[p.label]);
  }, [checked, notesByPhase]);

  return (
    <div className="space-y-4">
      <ConsultationAttendeeBar project={project} />
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
      {/* 좌측 — 공정 체크박스 (견적서 모달 패턴) */}
      <aside className="md:border-r md:pr-4">
        <div className="text-xs font-medium text-gray-700 mb-1">공정 선택</div>
        <div className="text-[11px] text-gray-500 mb-3">
          체크하면 우측에 메모 입력란이 추가됩니다.
        </div>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-1">
          {SELECTABLE_PHASES.map((p) => {
            const isChecked = !!checked[p.label] || !!notesByPhase[p.label];
            const hasContent = !!(notesByPhase[p.label]?.body?.trim());
            return (
              <button
                key={p.key}
                onClick={() => toggleCheck(p.label)}
                className={`text-left text-sm px-2.5 py-1.5 rounded border transition flex items-center gap-2 ${
                  isChecked
                    ? 'border-navy-700 bg-navy-50 text-navy-800'
                    : 'border-gray-200 hover:border-navy-400 hover:bg-gray-50'
                }`}
                title={p.hint || ''}
              >
                <span
                  className={`inline-flex items-center justify-center w-4 h-4 rounded text-[10px] font-bold flex-shrink-0 ${
                    isChecked ? 'bg-navy-700 text-white' : 'border border-gray-300'
                  }`}
                >
                  {isChecked ? '✓' : ''}
                </span>
                <span className="truncate flex-1">{displayPhase(p.label)}</span>
                {hasContent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="메모 있음" />
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* 우측 — 메모 카드들 */}
      <main className="space-y-3">
        {/* 기본 메모 (항상 표시) */}
        <NoteCard
          phase={GENERAL_PHASE}
          phaseLabel="🗂️ 기본 메모"
          subtitle="공정과 무관한 정보 — 가족 구성·할머니 동거·예산·주의사항 등"
          note={notesByPhase[GENERAL_PHASE]}
          onSave={(body) => saveNote(GENERAL_PHASE, body)}
          isGeneral
        />

        {loading ? (
          <div className="text-sm text-gray-400 py-8 text-center">불러오는 중...</div>
        ) : visiblePhases.length === 0 ? (
          <div className="bg-gray-50 border border-dashed rounded-xl p-8 text-center text-sm text-gray-500">
            좌측에서 공정을 체크하면 메모 입력란이 여기에 나타납니다.
          </div>
        ) : (
          visiblePhases.map((p) => (
            <NoteCard
              key={p.key}
              phase={p.label}
              phaseLabel={displayPhase(p.label)}
              note={notesByPhase[p.label]}
              onSave={(body) => saveNote(p.label, body)}
            />
          ))
        )}
      </main>
      </div>
    </div>
  );
}

// ============================================
// 응대 고객 바 — 페이지 상단. blur 자동저장
// ============================================
function ConsultationAttendeeBar({ project }) {
  const [value, setValue] = useState(project?.consultationAttendee || '');
  const [savedValue, setSavedValue] = useState(project?.consultationAttendee || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(project?.consultationAttendee || '');
    setSavedValue(project?.consultationAttendee || '');
  }, [project?.id, project?.consultationAttendee]);

  async function commit() {
    if (saving) return;
    if (value === savedValue) return;
    setSaving(true);
    try {
      await projectsApi.update(project.id, { consultationAttendee: value.trim() || null });
      setSavedValue(value);
    } catch (e) {
      setValue(savedValue);
      alert('저장 실패: ' + (e?.response?.data?.error || e?.message));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">👤 응대 고객</span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
        placeholder="예: 부인 박OO / 할머니 김OO / 대리인"
        className="flex-1 min-w-[200px] px-3 py-1.5 text-sm border rounded focus:border-navy-700 outline-none"
      />
      {saving && <span className="text-xs text-navy-600">저장 중…</span>}
      {!saving && value !== savedValue && <span className="text-xs text-amber-600">미저장</span>}
    </div>
  );
}

// ============================================
// 메모 카드 — textarea + blur 자동저장 + 마지막 수정자 표시
// ============================================
function NoteCard({ phase, phaseLabel, subtitle, note, onSave, isGeneral }) {
  const initialBody = note?.body || '';
  const [body, setBody] = useState(initialBody);
  const [savedBody, setSavedBody] = useState(initialBody);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const taRef = useRef(null);

  // 외부에서 note 갱신되면 (다른 사용자 편집·optimistic 등) 동기화 — 단, 사용자가 편집 중이면 보존
  useEffect(() => {
    const incoming = note?.body || '';
    if (incoming !== savedBody && document.activeElement !== taRef.current) {
      setBody(incoming);
      setSavedBody(incoming);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.body, note?.updatedAt]);

  async function commit() {
    if (saving) return;
    if (body === savedBody) return; // 변경 없음
    setSaving(true);
    setErr('');
    try {
      await onSave(body);
      setSavedBody(body);
    } catch (e) {
      setErr(e?.response?.data?.error || '저장 실패');
      setBody(savedBody); // 롤백
    } finally {
      setSaving(false);
    }
  }

  const updatedBy = note?.updatedBy;
  const updatedAt = note?.updatedAt;

  return (
    <div className={`bg-white border rounded-xl p-4 ${isGeneral ? 'border-amber-200 bg-amber-50/30' : ''}`}>
      <div className="flex items-baseline justify-between gap-2 mb-2 flex-wrap">
        <div>
          <div className="font-semibold text-navy-800 text-sm">{phaseLabel}</div>
          {subtitle && <div className="text-[11px] text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
        <div className="text-[11px] text-gray-400 flex items-center gap-2 flex-wrap">
          {saving && <span className="text-navy-600">저장 중…</span>}
          {!saving && body !== savedBody && <span className="text-amber-600">미저장</span>}
          {updatedBy && updatedAt && (
            <span>
              {updatedBy.name}
              {updatedBy.role && (
                <span className="ml-1 text-gray-400">({ROLE_LABEL[updatedBy.role] || updatedBy.role})</span>
              )}
              <span className="mx-1">·</span>
              {formatRelative(updatedAt)}
            </span>
          )}
        </div>
      </div>

      <textarea
        ref={taRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onBlur={commit}
        rows={isGeneral ? 4 : 3}
        placeholder={isGeneral
          ? '예: 30평 / 부부+자녀1 + 할머니 동거 / 모던톤 선호 / 6월 시공 / 예산 6,000만원'
          : '대화 중 나온 내용을 적어두세요. 견적 작성 시 이 메모를 보고 입력합니다.'}
        className="w-full px-3 py-2 text-sm border rounded focus:border-navy-700 outline-none resize-y leading-relaxed"
      />
      {err && <div className="text-xs text-rose-600 mt-1">{err}</div>}
    </div>
  );
}

function formatRelative(value) {
  if (!value) return '';
  const d = new Date(value);
  const now = new Date();
  const diffMs = now - d;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return '방금';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  const m = d.getMonth() + 1;
  const dd = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${m}/${dd} ${hh}:${mm}`;
}
