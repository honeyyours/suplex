// AI경리 채팅 — Claude API + Tool Use (manual agentic loop)
const express = require('express');
const { z } = require('zod');
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

const SYSTEM_PROMPT = `너는 한국 인테리어 업체용 SaaS "슈플렉스(Suplex)"의 AI 경리 어시스턴트야.
사용자(인테리어 업체 대표/직원)의 질문에 답하기 위해 제공된 도구로 회사 데이터를 조회해.

지침:
- 항상 한국어로 답해.
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

// POST /api/ai-bookkeeper/chat
router.post('/chat', async (req, res, next) => {
  try {
    const data = chatSchema.parse(req.body);
    const client = getClient();
    if (!client) {
      return res.status(503).json({
        error: 'Anthropic API 키가 설정되지 않았습니다 (.env의 ANTHROPIC_API_KEY)',
      });
    }

    const ctx = { companyId: req.user.companyId, userId: req.user.id };
    const tools = getToolSchemas();

    // 시스템에 오늘 날짜 동적 주입 (시간 변환 도움)
    const todayKR = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
    const todayISO = new Date().toISOString().slice(0, 10);
    const system = `${SYSTEM_PROMPT}\n\n오늘 날짜: ${todayKR} (ISO: ${todayISO})`;

    // 메시지 변환 (text 단일 블록)
    const messages = data.messages.map((m) => ({
      role: m.role,
      content: [{ type: 'text', text: m.content }],
    }));

    const toolCalls = []; // 최종 응답에 메타로 첨부

    // 모델별 옵션: Haiku는 effort/thinking 미지원 → 추가 안 함
    //              Sonnet/Opus는 adaptive thinking + effort 추가
    const isPremium = MODEL.startsWith('claude-opus') || MODEL.startsWith('claude-sonnet');
    const extraOpts = isPremium
      ? { thinking: { type: 'adaptive' }, output_config: { effort: 'high' } }
      : {};

    // Manual agentic loop
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        ...extraOpts,
        system,
        tools,
        messages,
      });

      // 응답을 history에 추가
      messages.push({ role: 'assistant', content: response.content });

      // tool_use 블록 모으기
      const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');

      if (response.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
        // 끝 — 텍스트 추출해서 반환
        const textBlocks = response.content.filter((b) => b.type === 'text');
        const reply = textBlocks.map((b) => b.text).join('\n');
        return res.json({
          reply,
          toolCalls,
          stopReason: response.stop_reason,
          usage: response.usage,
          model: MODEL,
        });
      }

      if (response.stop_reason === 'pause_turn') {
        // Server-side tool 일시정지 — 그대로 다음 iteration
        continue;
      }

      // 각 tool_use 실행 → tool_result 메시지로 회신
      const toolResults = [];
      for (const block of toolUseBlocks) {
        const result = await executeTool(block.name, block.input, ctx);
        toolCalls.push({
          name: block.name,
          input: block.input,
          // 결과 미리보기만 (전체 결과는 응답에 포함 안 함 — 너무 큼)
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

    // 루프 한도 도달
    return res.status(200).json({
      reply: '⚠️ 도구 호출이 너무 많아서 중단했습니다. 질문을 좀 더 구체적으로 다시 해주세요.',
      toolCalls,
      stopReason: 'max_iterations',
    });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    // Anthropic SDK 에러 처리
    if (e?.status) {
      console.error('[aiBookkeeper] API error', e.status, e.message);
      const status = e.status === 401 ? 503 : (e.status >= 500 ? 502 : e.status);
      return res.status(status).json({
        error: e.status === 401
          ? 'Anthropic API 키가 잘못되었거나 만료됨'
          : `Claude API 에러 (${e.status}): ${e.message}`,
      });
    }
    next(e);
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
