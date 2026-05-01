import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';

const REASON_LABEL = {
  spam: '스팸',
  abuse: '비방·명예훼손',
  client_info: '클라이언트 정보',
  malicious_code: '악성 코드 의심',
  other: '기타',
};

function relTime(date) {
  if (!date) return '—';
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}일 전`;
  return d.toLocaleDateString('ko-KR');
}

export default function AdminLoungeTab() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'lounge', 'reports', statusFilter],
    queryFn: () => adminApi.loungeReports(statusFilter),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, action, note }) => adminApi.loungeResolveReport(id, action, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'lounge', 'reports'] }),
  });
  const pinMutation = useMutation({
    mutationFn: (postId) => adminApi.loungePinHome(postId),
    onSuccess: () => alert('홈 카드 큐레이션 완료'),
  });
  const unhideMutation = useMutation({
    mutationFn: (postId) => adminApi.loungeUnhidePost(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'lounge', 'reports'] }),
  });
  const suspendMutation = useMutation({
    mutationFn: ({ userId, note }) => adminApi.loungeSuspend(userId, note),
    onSuccess: () => {
      alert('멤버십이 정지되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'lounge', 'reports'] });
    },
  });
  const backfillMutation = useMutation({
    mutationFn: () => adminApi.loungeBackfill(),
    onSuccess: (data) => alert(`보강 완료 — 스캔 ${data.scanned}, 신규 부여 ${data.granted}`),
  });

  const reports = data?.reports || [];

  function resolveHide(r) {
    const note = prompt('처리 메모 (선택)');
    resolveMutation.mutate({ id: r.id, action: 'hide', note: note || null });
  }
  function resolveDismiss(r) {
    const note = prompt('기각 사유 (선택)');
    resolveMutation.mutate({ id: r.id, action: 'dismiss', note: note || null });
  }
  function suspendUser(userId, name) {
    const note = prompt(`${name}님의 라운지 멤버십을 정지합니다.\n사유 (선택):`);
    if (note === null) return;
    suspendMutation.mutate({ userId, note: note || null });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">💬 라운지 모더레이션</h2>
          <p className="text-xs text-gray-500 mt-1">
            신고는 즉시 큐에 쌓이고, 24시간 내 처리가 SLA입니다. 정책 위반 시 글 숨김 + 멤버십 정지.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => backfillMutation.mutate()}
            disabled={backfillMutation.isPending}
            className="text-xs px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            title="모든 APPROVED 회사 멤버에게 라운지 멤버십 부여 (멱등)"
          >
            {backfillMutation.isPending ? '실행 중...' : '🔄 멤버십 보강'}
          </button>
        </div>
      </div>

      <div className="flex gap-1 text-xs">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-1.5 rounded border ${statusFilter === 'pending' ? 'bg-navy-700 text-white border-navy-700' : 'border-gray-300 dark:border-gray-700'}`}
        >
          처리 대기
        </button>
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded border ${statusFilter === 'all' ? 'bg-navy-700 text-white border-navy-700' : 'border-gray-300 dark:border-gray-700'}`}
        >
          전체
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-500 py-6 text-center">불러오는 중...</div>
      ) : reports.length === 0 ? (
        <div className="text-sm text-gray-500 py-6 text-center border border-dashed rounded">
          {statusFilter === 'pending' ? '대기 중인 신고가 없습니다.' : '신고 내역이 없습니다.'}
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <div
              key={r.id}
              className="border border-gray-200 dark:border-gray-800 rounded p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-medium">
                    {REASON_LABEL[r.reason] || r.reason}
                  </span>
                  <span className="text-gray-500">{r.targetType === 'post' ? '글' : '댓글'}</span>
                  <span className="text-gray-400">· {relTime(r.createdAt)}</span>
                  <span className="text-gray-400">· 신고자: {r.reporter?.name}</span>
                  {r.status !== 'pending' && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${r.status === 'resolved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-gray-200 dark:bg-gray-800 text-gray-600'}`}>
                      {r.status === 'resolved' ? '숨김' : '기각'}
                    </span>
                  )}
                </div>
              </div>

              {r.detail && (
                <div className="text-xs bg-gray-50 dark:bg-gray-900 px-2 py-1.5 rounded">
                  {r.detail}
                </div>
              )}

              {r.target ? (
                <div className="text-sm border-l-2 border-gray-300 dark:border-gray-700 pl-3 space-y-1">
                  {r.targetType === 'post' && (
                    <>
                      <div className="font-medium">{r.target.title}</div>
                      <div className="text-xs text-gray-500">
                        {r.target.author?.name} ({r.target.author?.email}) · {r.target.category} · 상태 {r.target.status}
                      </div>
                    </>
                  )}
                  {r.targetType === 'comment' && (
                    <div className="text-xs text-gray-500">
                      {r.target.author?.name} · 댓글 상태 {r.target.status}
                    </div>
                  )}
                  <div className="text-xs whitespace-pre-wrap line-clamp-3">
                    {r.target.body}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-400">대상이 삭제되었습니다.</div>
              )}

              {r.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => resolveHide(r)}
                    disabled={resolveMutation.isPending}
                    className="text-xs px-3 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    숨김 처리
                  </button>
                  <button
                    onClick={() => resolveDismiss(r)}
                    disabled={resolveMutation.isPending}
                    className="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    기각
                  </button>
                  {r.targetType === 'post' && r.target?.id && (
                    <button
                      onClick={() => {
                        if (confirm('이 글을 홈 "오늘의 팁"으로 큐레이션할까요?')) {
                          pinMutation.mutate(r.target.id);
                        }
                      }}
                      className="text-xs px-3 py-1 rounded border border-amber-300 dark:border-amber-800 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                    >
                      📌 홈 큐레이션
                    </button>
                  )}
                  {r.target?.authorId && (
                    <button
                      onClick={() => suspendUser(r.target.authorId, r.target.author?.name || '사용자')}
                      className="text-xs px-3 py-1 rounded border border-rose-300 dark:border-rose-800 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 ml-auto"
                    >
                      ⚠ 멤버십 정지
                    </button>
                  )}
                </div>
              )}
              {r.status !== 'pending' && r.status === 'resolved' && r.target?.status === 'hidden' && r.targetType === 'post' && (
                <button
                  onClick={() => unhideMutation.mutate(r.target.id)}
                  className="text-xs text-gray-500 hover:underline"
                >
                  복원
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
