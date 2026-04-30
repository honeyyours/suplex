const isProd = process.env.NODE_ENV === 'production';

function notFound(req, res, next) {
  res.status(404).json({ error: '요청한 경로를 찾을 수 없습니다', path: req.originalUrl });
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const isServerError = status >= 500;

  // 5xx는 prod에서 메시지 마스킹 (DB 컬럼명·스택 등 내부 정보 노출 차단).
  // 4xx는 사용자 입력 검증·권한 등 의미 있는 한국어 메시지가 들어있어 그대로 노출.
  const message = isServerError && isProd
    ? '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    : (err.message || '서버 오류가 발생했습니다.');

  const payload = { error: message };
  if (err.details && !isServerError) payload.details = err.details;
  if (!isProd && isServerError) payload.stack = err.stack;
  if (isServerError) console.error('[error]', err);

  res.status(status).json(payload);
}

module.exports = { notFound, errorHandler };
