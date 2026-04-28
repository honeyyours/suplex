// 회사별 공정 라벨 alias — display only.
// 표준 25개 phase의 표시명을 회사가 커스터마이즈할 수 있게 한다.
// 매칭/그룹핑은 표준 라벨 기준 그대로 유지 (백엔드 normalizePhase 변경 X) — 이 컨텍스트는 화면 표시만 바꾼다.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';
import { STANDARD_PHASES, isOther } from '../utils/phases';

const PhaseLabelsContext = createContext(null);

const STANDARD_LABEL_SET = new Set(STANDARD_PHASES.map((p) => p.label));

export function PhaseLabelsProvider({ children }) {
  const { auth } = useAuth();
  const [phaseLabels, setPhaseLabels] = useState({}); // { KEY: customLabel }

  useEffect(() => {
    if (!auth?.token) {
      setPhaseLabels({});
      return;
    }
    let alive = true;
    api.get('/phases/labels')
      .then((r) => { if (alive) setPhaseLabels(r.data?.phaseLabels || {}); })
      .catch(() => { /* 미인증/네트워크 오류는 표준 라벨로 fallback */ });
    return () => { alive = false; };
  }, [auth?.token, auth?.company?.id]);

  // 표준라벨 → 표시라벨 (alias 없으면 표준 그대로)
  const labelMap = useMemo(() => {
    const out = {};
    for (const p of STANDARD_PHASES) {
      const custom = phaseLabels?.[p.key];
      out[p.label] = (typeof custom === 'string' && custom.trim()) ? custom.trim() : p.label;
    }
    return out;
  }, [phaseLabels]);

  // 표시 함수 — 표준 라벨이면 alias 적용, 그 외(자유 텍스트·OTHER 원문)는 그대로 통과
  const displayPhase = useCallback((label) => {
    if (!label) return label;
    if (isOther(label)) return label;
    if (STANDARD_LABEL_SET.has(label)) return labelMap[label] || label;
    return label; // 표준이 아니면 원문 (자유 텍스트)
  }, [labelMap]);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/phases/labels');
      setPhaseLabels(data?.phaseLabels || {});
    } catch {/* noop */}
  }, []);

  const save = useCallback(async (next) => {
    const { data } = await api.patch('/phases/labels', { phaseLabels: next });
    setPhaseLabels(data?.phaseLabels || {});
    return data?.phaseLabels || {};
  }, []);

  const value = useMemo(() => ({
    phaseLabels, labelMap, displayPhase, refresh, save,
  }), [phaseLabels, labelMap, displayPhase, refresh, save]);

  return (
    <PhaseLabelsContext.Provider value={value}>{children}</PhaseLabelsContext.Provider>
  );
}

export function usePhaseLabels() {
  const ctx = useContext(PhaseLabelsContext);
  if (!ctx) {
    // 컨텍스트 외부에서도 안전하게 — 표준 라벨 그대로 통과
    return {
      phaseLabels: {},
      labelMap: {},
      displayPhase: (l) => l,
      refresh: async () => {},
      save: async () => ({}),
    };
  }
  return ctx;
}
