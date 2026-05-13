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

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).min(1),
});

function getClient() {
  if (!env.anthropic.apiKey) return null;
  return new Anthropic({ apiKey: env.anthropic.apiKey });
}

// POST /api/ai-assistant/chat — SSE 스트리밍
// 이벤트: text {text}, tool {name,input,resultPreview}, done {stopReason,usage,model}, error {error}
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

  const messages = data.messages.map((m) => ({
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

      // 텍스트 델타 즉시 송신 (사용자에게 안내 문장이 빠르게 보이도록)
      stream.on('text', (delta) => {
        if (aborted) return;
        sendEvent('text', { text: delta });
      });

      const finalMessage = await stream.finalMessage();
      if (aborted) return;

      messages.push({ role: 'assistant', content: finalMessage.content });

      const toolUseBlocks = finalMessage.content.filter((b) => b.type === 'tool_use');

      if (finalMessage.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
        sendEvent('done', {
          stopReason: finalMessage.stop_reason,
          usage: finalMessage.usage,
          model: MODEL,
        });
        return res.end();
      }

      if (finalMessage.stop_reason === 'pause_turn') continue;

      // 다음 모델 턴 전에 줄바꿈 1회 (안내 문장과 결과가 붙어보이지 않게)
      sendEvent('text', { text: '\n\n' });

      // 각 tool_use 실행 → 즉시 SSE로 알리고 tool_result 모음
      const toolResults = [];
      for (const block of toolUseBlocks) {
        if (aborted) return;
        const result = await executeTool(block.name, block.input, ctx);
        sendEvent('tool', {
          name: block.name,
          input: block.input,
          resultPreview: summarize(result),
        });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
      messages.push({ role: 'user', content: toolResults });
    }

    sendEvent('done', { stopReason: 'max_iterations', reply: '⚠️ 도구 호출이 너무 많아서 중단했습니다. 질문을 좀 더 구체적으로 다시 해주세요.' });
    res.end();
  } catch (e) {
    console.error('[aiAssistant] stream error', e?.status, e?.message);
    const msg = e?.status === 401
      ? 'Anthropic API 키가 잘못되었거나 만료됨'
      : (e?.status ? `Claude API 에러 (${e.status}): ${e.message}` : (e.message || '응답 실패'));
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
