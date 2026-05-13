// AI비서 채팅 — Claude API + Tool Use (manual agentic loop)
const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const env = require('../config/env');
const { authRequired } = require('../middlewares/auth');
const { getToolSchemas, executeTool } = require('../services/aiTools');

// SDK CJS interop
const AnthropicMod = require('@anthropic-ai/sdk');
const Anthropic = AnthropicMod.default || AnthropicMod;

const router = express.Router();
router.use(authRequired);

// 모델은 .env의 ANTHROPIC_MODEL로 오버라이드 가능. 기본 Sonnet 4.6 (균형)
// 옵션: claude-haiku-4-5 (가장 쌈) / claude-sonnet-4-6 (중간) / claude-opus-4-7 (최고)
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
const MAX_ITERATIONS = 8;          // tool-use loop 안전 가드
const MAX_TOKENS = 4096;

const SYSTEM_PROMPT = `너는 한국 인테리어 업체용 SaaS "수플렉스(Suplex)"의 AI 비서야.
사용자(인테리어 업체 대표/직원)의 질문에 답하기 위해 제공된 도구로 회사 데이터를 조회해. 지출·발주·마감재·일정·견적·메모 등 회사 운영 전반을 자연어로 검색·분석해줘.

지침:
- 항상 한국어로 답해.
- **도구를 호출하기 직전에, 무엇을 찾고 있는지 한 문장으로 짧게 안내해.** 예: "네, 이번 달 자재비를 조회해 볼게요." / "잠시만요, 미확정 마감재가 있는 현장을 찾아보겠습니다." 사용자가 대기 동안 응답이 즉시 보여야 하니 안내 → 도구 호출 → 결과 답변 순서를 지켜. (안내 문장 ≤ 1줄, 인사말·중복 금지)
- 도구 결과를 받은 뒤의 최종 답변에서는 다시 안내 문장을 반복하지 마. 바로 결과로 시작.
- 사용자가 프로젝트(현장) 이름을 언급하면 가장 먼저 search_projects로 ID를 찾아.
- 금액은 천 단위 콤마와 "원"으로 표기 (예: "1,234,500원").
- 날짜는 한국식 (예: "2026년 3월 15일" 또는 "3/15").
- 데이터 없음/접근 불가일 때는 "데이터가 없거나 접근 권한이 없습니다"라고 솔직히 말해.
- 추측하지 말 것. 도구로 확인할 수 있는 것만 답해.
- 답변은 간결하게. 표나 목록이 도움될 때만 사용. 불필요한 인사말·요약·반복 X.
- "이번 달", "작년", "올해" 같은 상대 시간은 오늘 날짜 기준으로 ISO 형식(YYYY-MM-DD)으로 변환해서 도구에 전달.
- 여러 정보가 필요하면 여러 도구를 순차/병렬로 호출.`;

// 신 스키마 — 단일 사용자 입력 + 기존 thread 참조
// threadId 없으면 새 thread 생성. 단일 message 만 받고 히스토리는 서버가 DB에서 슬라이드.
const chatSchema = z.object({
  threadId: z.string().nullish(),
  message: z.string().min(1).max(8000),
});

// 슬라이딩 윈도우 크기 — 최근 N개 user/assistant pair (= 2N messages)
// 토큰 비용 절감 핵심: DB엔 무한 보존, Claude API엔 최근 3턴만 전달.
const CONTEXT_WINDOW_TURNS = 3;

function getClient() {
  if (!env.anthropic.apiKey) return null;
  return new Anthropic({ apiKey: env.anthropic.apiKey });
}

function autoTitle(text) {
  const t = String(text || '').trim().replace(/\s+/g, ' ');
  if (t.length <= 30) return t || '(제목 없음)';
  return t.slice(0, 30) + '…';
}

// ============================================
// Thread CRUD
// ============================================

// GET /api/ai-assistant/threads — 최근 활성 스레드 목록
router.get('/threads', async (req, res, next) => {
  try {
    const threads = await prisma.aiChatThread.findMany({
      where: {
        companyId: req.user.companyId,
        userId: req.user.id,
        archivedAt: null,
      },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      select: { id: true, title: true, updatedAt: true, createdAt: true },
    });
    res.json({ threads });
  } catch (e) { next(e); }
});

// GET /api/ai-assistant/threads/:id — 단일 스레드 + 메시지
router.get('/threads/:id', async (req, res, next) => {
  try {
    const thread = await prisma.aiChatThread.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId, userId: req.user.id, archivedAt: null },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!thread) return res.status(404).json({ error: '대화를 찾을 수 없습니다' });
    res.json({ thread });
  } catch (e) { next(e); }
});

// PATCH /api/ai-assistant/threads/:id — 이름 변경
router.patch('/threads/:id', async (req, res, next) => {
  try {
    const title = String(req.body?.title || '').trim().slice(0, 100);
    if (!title) return res.status(400).json({ error: '제목이 비어있습니다' });
    const t = await prisma.aiChatThread.updateMany({
      where: { id: req.params.id, companyId: req.user.companyId, userId: req.user.id, archivedAt: null },
      data: { title },
    });
    if (t.count === 0) return res.status(404).json({ error: '대화를 찾을 수 없습니다' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// DELETE /api/ai-assistant/threads/:id — soft delete (archivedAt)
router.delete('/threads/:id', async (req, res, next) => {
  try {
    const t = await prisma.aiChatThread.updateMany({
      where: { id: req.params.id, companyId: req.user.companyId, userId: req.user.id, archivedAt: null },
      data: { archivedAt: new Date() },
    });
    if (t.count === 0) return res.status(404).json({ error: '대화를 찾을 수 없습니다' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/ai-assistant/chat — SSE 스트리밍 + DB 저장 + 슬라이딩 윈도우
// 본문: { threadId?, message }
// threadId 없거나 못 찾으면 새 스레드 생성. 첫 sse 이벤트로 thread {id,title} 송신.
// 이벤트: thread {id,title}, text {text}, tool {name,input,resultPreview}, done {stopReason,usage,model}, error {error}
router.post('/chat', async (req, res, next) => {
  // 검증·셋업 단계 에러는 200 이전이므로 그냥 JSON 응답
  let data;
  try {
    data = chatSchema.parse(req.body);
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    return next(e);
  }
  const client = getClient();
  if (!client) {
    return res.status(503).json({
      error: 'Anthropic API 키가 설정되지 않았습니다 (.env의 ANTHROPIC_API_KEY)',
    });
  }

  const company = await prisma.company.findUnique({
    where: { id: req.user.companyId },
    select: { hideExpenses: true },
  });
  const hideExpenses = !!company?.hideExpenses;

  const role = req.user.role;
  const ctx = {
    companyId: req.user.companyId,
    userId: req.user.id,
    role,
    hideExpenses,
  };
  const tools = getToolSchemas({ hideExpenses, role });

  const todayKR = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const todayISO = new Date().toISOString().slice(0, 10);

  const roleNote = role === 'OWNER'
    ? '사용자 역할: OWNER (대표) — 모든 도구 사용 가능.'
    : `사용자 역할: ${role} — 지출·매출·회계·계정과목·프로젝트 손익(PnL) 도구는 이 사용자에게 제공되지 않았어. 사용자가 그쪽 질문을 하면 "회계 정보는 대표(OWNER) 권한 사용자만 조회할 수 있어요"라고 정중히 안내하고, 가능한 마감재·일정·체크리스트·발주·견적·프로젝트 기본 정보 쪽 질문으로 안내해.`;

  const system = `${SYSTEM_PROMPT}\n\n오늘 날짜: ${todayKR} (ISO: ${todayISO})\n${roleNote}`;

  // ===== Thread 결정 (없으면 생성) + 슬라이딩 윈도우 히스토리 로드 =====
  let thread = null;
  if (data.threadId) {
    thread = await prisma.aiChatThread.findFirst({
      where: { id: data.threadId, companyId: req.user.companyId, userId: req.user.id, archivedAt: null },
      select: { id: true, title: true },
    });
  }
  if (!thread) {
    thread = await prisma.aiChatThread.create({
      data: {
        companyId: req.user.companyId,
        userId: req.user.id,
        title: autoTitle(data.message),
      },
      select: { id: true, title: true },
    });
  }

  // 새 사용자 메시지 저장 (DB는 무한 보존)
  await prisma.aiChatMessage.create({
    data: { threadId: thread.id, role: 'user', content: data.message },
  });

  // 슬라이딩 윈도우: 최근 CONTEXT_WINDOW_TURNS 턴(= user+assistant 쌍) 만 Claude 로 전달.
  // 새로 추가된 현재 user 메시지 포함해 최근 2N + 1 정도를 잡으면 충분 (시간순 take).
  const historyRows = await prisma.aiChatMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: 'desc' },
    take: CONTEXT_WINDOW_TURNS * 2 + 1,
  });
  // 시간순으로 뒤집고 role 순서 정리. DB엔 tool_result/tool_use 블록 X — 단순 text 만 보냄.
  const messages = historyRows
    .slice()
    .reverse()
    .map((m) => ({
      role: m.role,
      content: [{ type: 'text', text: m.content }],
    }));

  // SSE 헤더
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  // nginx/프록시 buffering 끔 — 토큰 단위 즉시 전달
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  function sendEvent(event, payload) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
  }

  // 첫 이벤트: 클라이언트가 threadId 알 수 있게 thread 정보 송신
  sendEvent('thread', { id: thread.id, title: thread.title });

  // 어시스턴트 최종 텍스트 + 도구 호출 미리보기 누적 (DB 저장용)
  const assistantTextChunks = [];
  const assistantToolCalls = [];

  // 클라이언트 abort 시 루프 빨리 종료
  let aborted = false;
  req.on('close', () => { aborted = true; });

  // 모델별 옵션: Haiku는 effort/thinking 미지원
  const isPremium = MODEL.startsWith('claude-opus') || MODEL.startsWith('claude-sonnet');
  const extraOpts = isPremium
    ? { thinking: { type: 'adaptive' }, output_config: { effort: 'high' } }
    : {};

  try {
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      if (aborted) return;

      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        ...extraOpts,
        system,
        tools,
        messages,
      });

      // 텍스트 델타 즉시 송신 + DB 저장용 누적
      stream.on('text', (delta) => {
        if (aborted) return;
        assistantTextChunks.push(delta);
        sendEvent('text', { text: delta });
      });

      const finalMessage = await stream.finalMessage();
      if (aborted) return;

      messages.push({ role: 'assistant', content: finalMessage.content });

      const toolUseBlocks = finalMessage.content.filter((b) => b.type === 'tool_use');

      if (finalMessage.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
        // ===== 종료 — DB 저장 + done 이벤트 =====
        const finalText = assistantTextChunks.join('');
        await prisma.aiChatMessage.create({
          data: {
            threadId: thread.id,
            role: 'assistant',
            content: finalText,
            toolCalls: assistantToolCalls.length ? assistantToolCalls : undefined,
          },
        });
        // updatedAt 자동 갱신 (스레드 최근 사용 시각)
        await prisma.aiChatThread.update({
          where: { id: thread.id },
          data: { updatedAt: new Date() },
        });
        sendEvent('done', {
          stopReason: finalMessage.stop_reason,
          usage: finalMessage.usage,
          model: MODEL,
        });
        return res.end();
      }

      if (finalMessage.stop_reason === 'pause_turn') continue;

      // 다음 모델 턴 전에 줄바꿈 1회 (안내 문장과 결과가 붙어보이지 않게)
      assistantTextChunks.push('\n\n');
      sendEvent('text', { text: '\n\n' });

      // 각 tool_use 실행 → 즉시 SSE로 알리고 tool_result 모음
      const toolResults = [];
      for (const block of toolUseBlocks) {
        if (aborted) return;
        const result = await executeTool(block.name, block.input, ctx);
        const preview = summarize(result);
        const toolMeta = { name: block.name, input: block.input, resultPreview: preview };
        assistantToolCalls.push(toolMeta);
        sendEvent('tool', toolMeta);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
      messages.push({ role: 'user', content: toolResults });
    }

    // 루프 한도 — 부분 결과라도 DB 저장 (사용자가 새로고침해도 잃지 않도록)
    const partialText = assistantTextChunks.join('') ||
      '⚠️ 도구 호출이 너무 많아서 중단했습니다. 질문을 좀 더 구체적으로 다시 해주세요.';
    await prisma.aiChatMessage.create({
      data: {
        threadId: thread.id,
        role: 'assistant',
        content: partialText,
        toolCalls: assistantToolCalls.length ? assistantToolCalls : undefined,
      },
    });
    await prisma.aiChatThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date() },
    });
    sendEvent('done', { stopReason: 'max_iterations' });
    res.end();
  } catch (e) {
    console.error('[aiAssistant] stream error', e?.status, e?.message);
    const msg = e?.status === 401
      ? 'Anthropic API 키가 잘못되었거나 만료됨'
      : (e?.status ? `Claude API 에러 (${e.status}): ${e.message}` : (e.message || '응답 실패'));
    // 부분 텍스트가 있으면 그것까지는 보존 (없으면 사용자 질문만 DB에 남음)
    if (assistantTextChunks.length > 0) {
      try {
        await prisma.aiChatMessage.create({
          data: {
            threadId: thread.id,
            role: 'assistant',
            content: assistantTextChunks.join('') + `\n\n⚠️ ${msg}`,
            toolCalls: assistantToolCalls.length ? assistantToolCalls : undefined,
          },
        });
      } catch { /* 저장 실패는 무시 */ }
    }
    try { sendEvent('error', { error: msg }); } catch {}
    res.end();
  }
});

function summarize(result) {
  if (Array.isArray(result)) return `(${result.length}건)`;
  if (result && typeof result === 'object') {
    if (result.error) return `에러: ${result.error}`;
    if ('total' in result && 'count' in result) return `총 ${Math.round(Number(result.total)).toLocaleString('ko-KR')}원 / ${result.count}건`;
    return `(객체)`;
  }
  return String(result);
}

module.exports = router;
