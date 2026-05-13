import { useEffect, useRef, useState } from 'react';
import { aiAssistantApi } from '../api/aiAssistant';
import { formatDateDot } from '../utils/date';

const TOOL_LABELS = {
  search_projects:      '🔍 프로젝트 검색',
  get_project_summary:  '📊 프로젝트 요약',
  list_schedules:       '📅 공정 일정 조회',
  list_checklists:      '✅ 체크리스트 조회',
  list_expenses:        '💸 지출 조회',
  sum_expenses:         '🧮 지출 합계',
  list_materials:       '🪵 마감재 조회',
  list_purchase_orders: '📦 발주예정 조회',
  list_quotes:          '📄 견적 조회',
  get_pnl_summary:      '💰 전체 손익',
};

const SUGGESTED = [
  '이번 달 자재비 총합은?',
  '수익률이 가장 낮은 현장 알려줘',
  '미확정 마감재가 있는 현장은?',
  '최근 발주예정 중 대기중인 항목 정리해줘',
];

export default function AIAssistant() {
  const [threads, setThreads] = useState([]);             // [{id, title, updatedAt}]
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);           // [{role, content, toolCalls?, streaming?}]
  const [loadingThread, setLoadingThread] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollerRef = useRef(null);
  const inputRef = useRef(null);

  // 마운트 시 스레드 목록 로드 + 최근 스레드 자동 복원
  useEffect(() => {
    (async () => {
      try {
        const list = await aiAssistantApi.listThreads();
        setThreads(list);
        if (list.length > 0) {
          await openThread(list[0].id);
        }
      } catch (e) {
        // 빈 상태로 두기 — 새 질문하면 자동으로 새 스레드 생김
        console.warn('[AIAssistant] thread list load failed', e?.message);
      }
    })();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, busy]);

  async function openThread(id) {
    if (id === activeThreadId) return;
    setLoadingThread(true);
    setActiveThreadId(id);
    setMessages([]);
    try {
      const t = await aiAssistantApi.getThread(id);
      const msgs = (t.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls || [],
      }));
      setMessages(msgs);
    } catch (e) {
      console.warn('[AIAssistant] thread load failed', e?.message);
      setMessages([{
        role: 'assistant',
        content: '⚠️ 대화를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.',
        error: true,
      }]);
    } finally {
      setLoadingThread(false);
      inputRef.current?.focus();
    }
  }

  function newThread() {
    setActiveThreadId(null);
    setMessages([]);
    inputRef.current?.focus();
  }

  async function deleteThread(id) {
    if (!confirm('이 대화를 삭제할까요? (복구 X)')) return;
    try {
      await aiAssistantApi.deleteThread(id);
      setThreads((prev) => prev.filter((t) => t.id !== id));
      if (id === activeThreadId) {
        setActiveThreadId(null);
        setMessages([]);
      }
    } catch (e) {
      alert('삭제 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  async function send(textOverride) {
    const text = (textOverride ?? input).trim();
    if (!text || busy) return;

    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setBusy(true);

    // 스트리밍 응답을 채워 넣을 빈 어시스턴트 버블
    setMessages((prev) => [...prev, {
      role: 'assistant', content: '', toolCalls: [], streaming: true,
    }]);

    function updateLast(patch) {
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const copy = prev.slice();
        copy[copy.length - 1] = { ...copy[copy.length - 1], ...patch };
        return copy;
      });
    }

    let newThreadInfo = null;
    try {
      await aiAssistantApi.chatStream({ threadId: activeThreadId, message: text }, {
        onThread: (t) => {
          newThreadInfo = t;
          setActiveThreadId(t.id);
        },
        onText: (delta) => {
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const copy = prev.slice();
            const last = copy[copy.length - 1];
            copy[copy.length - 1] = { ...last, content: (last.content || '') + delta };
            return copy;
          });
        },
        onTool: (tc) => {
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const copy = prev.slice();
            const last = copy[copy.length - 1];
            copy[copy.length - 1] = { ...last, toolCalls: [...(last.toolCalls || []), tc] };
            return copy;
          });
        },
        onDone: () => {
          updateLast({ streaming: false });
        },
        onError: (err) => {
          updateLast({
            content: '⚠️ ' + (err.error || '응답 실패'),
            error: true,
            streaming: false,
          });
        },
      });
    } catch (e) {
      updateLast({
        content: '⚠️ ' + (e.message || '응답 실패'),
        error: true,
        streaming: false,
      });
    } finally {
      setBusy(false);
      inputRef.current?.focus();
      // 스레드 목록 갱신 — 새로 만든 스레드면 위로 올라오게
      if (newThreadInfo) {
        setThreads((prev) => {
          const existing = prev.find((t) => t.id === newThreadInfo.id);
          if (existing) {
            return [
              { ...existing, updatedAt: new Date().toISOString() },
              ...prev.filter((t) => t.id !== newThreadInfo.id),
            ];
          }
          return [
            { id: newThreadInfo.id, title: newThreadInfo.title, updatedAt: new Date().toISOString() },
            ...prev,
          ];
        });
      }
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[500px] max-w-6xl mx-auto bg-white border rounded-xl overflow-hidden">
      {/* 좌측 — 스레드 사이드바 */}
      <aside className="hidden sm:flex flex-col w-56 border-r bg-gray-50/60">
        <div className="px-3 py-3 border-b bg-white">
          <button
            onClick={newThread}
            className="w-full text-sm px-3 py-2 bg-navy-700 hover:bg-navy-800 text-white rounded font-medium"
          >
            + 새 대화
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {threads.length === 0 ? (
            <div className="text-xs text-gray-400 px-3 py-4 text-center">
              아직 대화가 없습니다.
            </div>
          ) : (
            threads.map((t) => {
              const active = t.id === activeThreadId;
              return (
                <div
                  key={t.id}
                  className={`group px-3 py-2 cursor-pointer border-l-2 ${
                    active
                      ? 'border-navy-700 bg-navy-50/70 text-navy-800'
                      : 'border-transparent hover:bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => openThread(t.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm truncate flex-1" title={t.title}>
                      {t.title || '(제목 없음)'}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteThread(t.id); }}
                      title="대화 삭제"
                      className="text-gray-300 hover:text-rose-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >✕</button>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {formatDateDot(t.updatedAt)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* 우측 — 대화 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 헤더 */}
        <header className="px-5 py-3 border-b bg-navy-800 text-white flex items-center justify-between">
          <div className="min-w-0">
            <div className="font-bold">🤖 AI 비서</div>
            <div className="text-xs text-navy-100 truncate">
              수플렉스 데이터 기반 운영 질문 어시스턴트
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 모바일용 새 대화 — 사이드바 없는 화면에서 노출 */}
            <button
              onClick={newThread}
              className="sm:hidden text-xs px-3 py-1 border border-white/30 rounded hover:bg-white/10"
            >
              + 새 대화
            </button>
          </div>
        </header>

        {/* 메시지 영역 */}
        <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {loadingThread && (
            <div className="text-center text-xs text-gray-400 py-4">대화를 불러오는 중...</div>
          )}

          {!loadingThread && messages.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">💬</div>
              <div className="text-navy-800 font-medium mb-1">무엇을 도와드릴까요?</div>
              <div className="text-xs text-gray-500 mb-6">
                수플렉스에 저장된 프로젝트·지출·마감재·발주·견적·일정 데이터를 검색해서 답해드려요.
                <br />대화 내용은 자동 저장됩니다 (직접 삭제 가능).
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="block w-full text-sm px-4 py-2.5 bg-white border rounded-lg hover:border-navy-500 hover:bg-navy-50/50 text-left text-gray-700"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {messages.map((m, i) => <Bubble key={i} message={m} />)}
          </div>
        </div>

        {/* 입력 영역 */}
        <div className="border-t p-3 bg-white">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={busy}
              rows={1}
              placeholder="질문을 입력하세요. (Shift+Enter 줄바꿈)"
              className="flex-1 resize-none border rounded-lg px-3 py-2 text-sm focus:border-navy-700 outline-none max-h-32 disabled:bg-gray-100"
              style={{ minHeight: '40px' }}
            />
            <button
              onClick={() => send()}
              disabled={busy || !input.trim()}
              className="bg-navy-700 hover:bg-navy-800 text-white text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-40 whitespace-nowrap"
            >
              {busy ? '...' : '보내기'}
            </button>
          </div>
          <div className="text-xs sm:text-[10px] text-gray-400 mt-1.5 px-1">
            AI 응답은 잘못될 수 있으니 중요한 결정 전에는 데이터를 직접 확인하세요. ·
            비용 절감을 위해 최근 3턴만 컨텍스트로 사용됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ message }) {
  const isUser = message.role === 'user';
  // 스트리밍 중 + 본문 비어있을 때만 점 3개 (첫 토큰 대기). 한 글자라도 오면 본문 + 깜빡이는 커서.
  const awaitingFirstToken = message.streaming && !message.content;
  const showCursor = message.streaming && !!message.content;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : ''}`}>
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {message.toolCalls.map((tc, j) => (
              <span
                key={j}
                title={JSON.stringify(tc.input)}
                className="text-xs sm:text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full"
              >
                {TOOL_LABELS[tc.name] || tc.name}
                {tc.resultPreview && <span className="ml-1 text-emerald-600/70">· {tc.resultPreview}</span>}
              </span>
            ))}
          </div>
        )}
        <div
          className={`inline-block px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-navy-700 text-white rounded-br-sm'
              : message.error
                ? 'bg-rose-50 border border-rose-200 text-rose-700 rounded-bl-sm'
                : 'bg-white border rounded-bl-sm text-gray-800'
          }`}
        >
          {awaitingFirstToken ? (
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          ) : (
            <>
              {message.content}
              {showCursor && (
                <span className="inline-block w-[2px] h-3 bg-gray-500 ml-0.5 align-baseline animate-pulse" />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
