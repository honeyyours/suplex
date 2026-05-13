// AI 비서 — SSE 스트리밍 채팅 + 스레드 영구 저장
// 서버 응답 이벤트:
//   event: thread → { id, title }  (스트림 첫 이벤트 — 현재 활성 스레드 정보)
//   event: text   → { text }       (텍스트 델타)
//   event: tool   → { name, input, resultPreview }
//   event: done   → { stopReason, usage, model }
//   event: error  → { error }
import api from './client';

export const aiAssistantApi = {
  // 스레드 목록 (최근순 archived 제외)
  listThreads: () => api.get('/ai-assistant/threads').then((r) => r.data.threads),
  // 단일 스레드 + 메시지
  getThread: (id) => api.get(`/ai-assistant/threads/${id}`).then((r) => r.data.thread),
  // 이름 변경
  renameThread: (id, title) =>
    api.patch(`/ai-assistant/threads/${id}`, { title }).then((r) => r.data),
  // 삭제 (soft, archivedAt)
  deleteThread: (id) =>
    api.delete(`/ai-assistant/threads/${id}`).then((r) => r.data),

  // SSE 스트리밍 채팅. handlers: { onThread, onText, onTool, onDone, onError }
  // threadId 가 null/undefined 면 서버가 새 스레드 생성하고 thread 이벤트로 id 송신.
  chatStream: async ({ threadId, message }, handlers = {}, signal) => {
    const baseURL = import.meta.env.VITE_API_URL || '/api';
    const token = localStorage.getItem('suplex_token') || localStorage.getItem('splex_token');

    const response = await fetch(`${baseURL}/ai-assistant/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ threadId: threadId || null, message }),
      signal,
    });

    if (response.status === 401) {
      localStorage.removeItem('suplex_token');
      localStorage.removeItem('splex_token');
      window.location.href = '/login';
      throw new Error('인증 만료 — 다시 로그인해주세요');
    }
    if (!response.ok) {
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      // \n\n 단위 SSE 이벤트 파싱
      let idx;
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const raw = buf.slice(0, idx);
        buf = buf.slice(idx + 2);

        let eventName = 'message';
        let dataStr = '';
        for (const line of raw.split('\n')) {
          if (line.startsWith('event: ')) eventName = line.slice(7).trim();
          else if (line.startsWith('data: ')) dataStr += line.slice(6);
        }
        if (!dataStr) continue;

        let parsed;
        try { parsed = JSON.parse(dataStr); } catch { continue; }

        if (eventName === 'thread') handlers.onThread?.(parsed);
        else if (eventName === 'text') handlers.onText?.(parsed.text);
        else if (eventName === 'tool') handlers.onTool?.(parsed);
        else if (eventName === 'done') handlers.onDone?.(parsed);
        else if (eventName === 'error') handlers.onError?.(parsed);
      }
    }
  },
};
