// 인앱 이미지 뷰어 — 새 창 대신 사용
// props:
//   photos: [{url, thumbnailUrl, caption?}]  또는 단일 객체
//   index: 시작 인덱스
//   onClose: 닫기 콜백
//   onIndexChange?: 인덱스 변경 콜백 (선택)
import { useEffect, useState } from 'react';

export default function ImageLightbox({ photos, index = 0, onClose, onIndexChange }) {
  const list = Array.isArray(photos) ? photos : [photos];
  const [i, setI] = useState(index);
  const total = list.length;

  useEffect(() => setI(index), [index]);

  function go(delta) {
    const next = (i + delta + total) % total;
    setI(next);
    onIndexChange?.(next);
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
      else if (e.key === 'ArrowLeft' && total > 1) go(-1);
      else if (e.key === 'ArrowRight' && total > 1) go(1);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    /* eslint-disable-next-line */
  }, [i, total]);

  if (total === 0) return null;
  const cur = list[i];

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 닫기 */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose?.(); }}
        className="absolute top-4 right-4 text-white text-2xl bg-black/40 hover:bg-black/60 rounded-full w-10 h-10 flex items-center justify-center"
        title="닫기 (ESC)"
      >
        ✕
      </button>

      {/* 카운터 + 캡션 */}
      <div className="absolute top-4 left-4 text-white text-sm bg-black/40 rounded px-3 py-1.5">
        {total > 1 && <span className="mr-2">{i + 1} / {total}</span>}
        {cur.caption && <span className="opacity-90">{cur.caption}</span>}
      </div>

      {/* 좌측 화살표 */}
      {total > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); go(-1); }}
          className="absolute left-4 text-white text-3xl bg-black/40 hover:bg-black/60 rounded-full w-12 h-12 flex items-center justify-center"
          title="이전 (←)"
        >
          ‹
        </button>
      )}

      {/* 이미지 */}
      <img
        src={cur.url}
        alt=""
        className="max-w-[92vw] max-h-[88vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* 우측 화살표 */}
      {total > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); go(1); }}
          className="absolute right-4 text-white text-3xl bg-black/40 hover:bg-black/60 rounded-full w-12 h-12 flex items-center justify-center"
          title="다음 (→)"
        >
          ›
        </button>
      )}

      {/* 다운로드 (해당 사진만) */}
      <a
        href={cur.url}
        download
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-4 right-4 text-white text-xs bg-black/40 hover:bg-black/60 rounded px-3 py-2"
      >
        ⬇ 새 창 열기
      </a>
    </div>
  );
}
