// AI 비서 — SSE 스트리밍 채팅
// 서버 응답 이벤트:
//   event: text   → { text }  (텍스트 델타)
//   event: tool   → { name, input, resultPreview }
//   event: done   → { stopReason, usage, model }
//   event: error  → { error }
export const aiAssistantApi = {
  // handlers: { onText, onTool, onDone, onError }
  // returns: Promise<void> — 스트림이 끝나면 resolve
  chatStream: async (messages, handlers = {}, signal) => {
    const baseURL = import.meta.env.VITE_API_URL || '/api';
    const token = localStorage.getItem('suplex_token') || localStorage.getItem('splex_token');

    const response = await fetch(`${baseURL}/ai-assistant/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages }),
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

        if (eventName === 'text') handlers.onText?.(parsed.text);
        else if (eventName === 'tool') handlers.onTool?.(parsed);
        else if (eventName === 'done') handlers.onDone?.(parsed);
        else if (eventName === 'error') handlers.onError?.(parsed);
      }
    }
  },
};
