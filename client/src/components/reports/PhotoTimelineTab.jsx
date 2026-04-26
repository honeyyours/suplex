import { useEffect, useMemo, useState } from 'react';
import { photosApi, PHOTO_SOURCE_META } from '../../api/reports';
import { relativeTime, formatDateDisplay } from '../../utils/date';
import ImageLightbox from '../ImageLightbox';

export default function PhotoTimelineTab({ projectId }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('');
  const [lightboxIdx, setLightboxIdx] = useState(null); // 평탄 인덱스 (전체 photos 기준)

  async function reload() {
    setLoading(true);
    try {
      const { photos } = await photosApi.list(projectId, source ? { source } : {});
      setPhotos(photos);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, [projectId, source]);

  // 날짜별 그룹핑
  const byDate = useMemo(() => {
    const m = new Map();
    photos.forEach((p) => {
      const d = p.createdAt.slice(0, 10);
      if (!m.has(d)) m.set(d, []);
      m.get(d).push(p);
    });
    return Array.from(m.entries()); // [[date, photos]]
  }, [photos]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="text-sm text-gray-600">총 {photos.length}장</div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { k: '', l: '전체' },
            { k: 'REPORT', l: '작업 보고' },
            { k: 'MATERIAL_REQUEST', l: '자재 요청' },
            { k: 'CHECKLIST', l: '체크리스트' },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setSource(t.k)}
              className={`text-xs px-3 py-1.5 rounded ${
                source === t.k ? 'bg-navy-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="text-sm text-gray-400">불러오는 중...</div>}
      {!loading && photos.length === 0 && (
        <div className="text-center py-16 text-sm text-gray-400">
          아직 업로드된 사진이 없습니다
        </div>
      )}

      <div className="space-y-6">
        {byDate.map(([date, ps]) => (
          <div key={date}>
            <div className="text-sm font-semibold text-navy-800 mb-2">
              {formatDateDisplay(date)} <span className="text-xs text-gray-400 font-normal">· {ps.length}장</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {ps.map((p) => {
                const src = PHOTO_SOURCE_META[p.source] || { label: p.source, color: 'bg-gray-100' };
                const flatIdx = photos.findIndex((x) => x.id === p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setLightboxIdx(flatIdx)}
                    className="relative block aspect-square rounded-lg overflow-hidden border bg-gray-100 group text-left"
                    title={p.sourceLabel || ''}
                  >
                    <img src={p.thumbnailUrl || p.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                    <div className="absolute top-1 left-1 flex flex-col gap-0.5 items-start max-w-[90%]">
                      <span className={`text-[11px] sm:text-[10px] px-1.5 py-0.5 rounded ${src.color}`}>{src.label}</span>
                      {p.sourceLabel && (
                        <span className="text-[11px] sm:text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white truncate max-w-full">
                          {p.sourceLabel}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-1 right-1 text-[11px] sm:text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                      {p.uploadedBy?.name} · {relativeTime(p.createdAt)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {lightboxIdx !== null && (
        <ImageLightbox
          photos={photos}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </div>
  );
}
