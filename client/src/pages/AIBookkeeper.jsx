import { useEffect, useRef, useState } from 'react';
import { aiBookkeeperApi } from '../api/aiBookkeeper';

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

export default function AIBookkeeper() {
  const [messages, setMessages] = useState([]); // [{role, content, toolCalls?}]
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, busy]);

  async function send(textOverride) {
    const text = (textOverride ?? input).trim();
    if (!text || busy) return;

    const userMsg = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setBusy(true);

    try {
      // 백엔드에는 role/content만 전달 (toolCalls는 클라 표시용)
      const payload = next.map(({ role, content }) => ({ role, content }));
      const data = await aiBookkeeperApi.chat(payload);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || '(응답 없음)',
          toolCalls: data.toolCalls || [],
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ ' + (e.response?.data?.error || e.message || '응답 실패'),
          error: true,
        },
      ]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function reset() {
    if (messages.length === 0) return;
    if (!confirm('대화를 초기화할까요?')) return;
    setMessages([]);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] min-h-[500px] max-w-4xl mx-auto bg-white border rounded-xl overflow-hidden">
      {/* 헤더 */}
      <header className="px-5 py-3 border-b bg-navy-800 text-white flex items-center justify-between">
        <div>
          <div className="font-bold">🤖 AI 경리</div>
          <div className="text-xs text-navy-100">스플렉스 데이터 기반 회계·운영 질문 어시스턴트</div>
        </div>
        <button
          onClick={reset}
          disabled={messages.length === 0}
          className="text-xs px-3 py-1 border border-white/30 rounded hover:bg-white/10 disabled:opacity-30"
        >
          대화 초기화
        </button>
      </header>

      {/* 메시지 영역 */}
      <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">💬</div>
            <div className="text-navy-800 font-medium mb-1">무엇을 도와드릴까요?</div>
            <div className="text-xs text-gray-500 mb-6">
              스플렉스에 저장된 프로젝트·지출·마감재·견적 데이터를 검색해서 답해드려요.
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
          {busy && <ThinkingBubble />}
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
          AI 응답은 잘못될 수 있으니 중요한 결정 전에는 데이터를 직접 확인하세요.
        </div>
      </div>
    </div>
  );
}

function Bubble({ message }) {
  const isUser = message.role === 'user';
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
                ? 'bg-red-50 border border-red-200 text-red-700 rounded-bl-sm'
                : 'bg-white border rounded-bl-sm text-gray-800'
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex justify-start">
      <div className="bg-white border rounded-2xl rounded-bl-sm px-4 py-2.5 inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        <span className="text-xs text-gray-500 ml-2">데이터 조회 중...</span>
      </div>
    </div>
  );
}
