// 프로젝트 메모 — Google Keep / 스티커 메모 느낌의 자유 노트.
// 카톡 폭(약 420px)에 맞춰 textarea를 두어 적은 글이 카톡에서도 비슷하게 줄바꿈 됨.
// 발주 항목 등을 여기에 붙여넣고 편집한 뒤 다시 복사해 카톡 발송하는 흐름 지원.
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectsApi } from '../api/projects';

const SAVE_DELAY = 1000;

export default function ProjectMemo() {
  const { id: projectId } = useParams();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef(null);
  const pendingRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      const { project } = await projectsApi.get(projectId);
      setText(project.memo || '');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    /* eslint-disable-next-line */
  }, [projectId]);

  // 언마운트 시 잔여 저장 플러시
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (pendingRef.current != null) {
      projectsApi.update(projectId, { memo: pendingRef.current }).catch(() => {});
    }
    /* eslint-disable-next-line */
  }, []);

  function handleChange(v) {
    setText(v);
    pendingRef.current = v;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, SAVE_DELAY);
  }
  async function flush() {
    const v = pendingRef.current;
    if (v == null) return;
    pendingRef.current = null;
    setSaving(true);
    try {
      await projectsApi.update(projectId, { memo: v });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(text);
      alert('전체 메모를 복사했습니다.');
    } catch (e) {
      alert('복사 실패: ' + e.message);
    }
  }

  if (loading) return <div className="text-sm text-gray-400">불러오는 중...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs text-gray-500">
          자유 메모장 — 카톡 폭에 맞춰져 있어 적은 그대로 발송 시 비슷하게 줄바꿈 됩니다.
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {saving ? '저장 중...' : '자동 저장됨'}
          </span>
          <button
            onClick={copyAll}
            disabled={!text}
            className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-40"
          >
            전체 복사
          </button>
        </div>
      </div>

      {/* 카톡 메시지 풍선 폭(약 420px)에 맞춘 노란 메모지 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm p-4 max-w-[420px]">
        <textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          rows={22}
          placeholder={`자유롭게 적어주세요.

예시:
[목공 추가 발주]
- 각재 30단
- 합판 5장 (B등급)

[현장 메모]
- 안방 천장 누수 흔적 — 도배 전 보강
- 화장실 천장 환풍기 이전 위치 확인 필요`}
          className="w-full bg-transparent resize-none outline-none text-sm leading-relaxed text-gray-800 placeholder:text-yellow-800/40"
          style={{ minHeight: '400px' }}
        />
      </div>
    </div>
  );
}
