import { Link } from 'react-router-dom';

// 법적 문서 공용 레이아웃. 가입 흐름 외부에서도 접근 가능하도록 ProtectedRoute 밖.
export default function LegalDoc({ title, lastUpdated, children }) {
  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow p-6 sm:p-10">
        <div className="flex items-center justify-between mb-6 pb-4 border-b dark:border-gray-700">
          <Link to="/" className="text-sm text-navy-700 dark:text-navy-300 hover:underline">
            ← 처음으로
          </Link>
          <span className="text-xs text-gray-400">최종 갱신 {lastUpdated}</span>
        </div>
        <h1 className="text-2xl font-bold text-navy-800 dark:text-white mb-6">{title}</h1>
        <div className="legal-doc text-sm text-gray-700 dark:text-gray-200 leading-relaxed space-y-3">
          {children}
        </div>
        <div className="mt-10 pt-4 border-t dark:border-gray-700 text-xs text-gray-400">
          문의: support@suplex.kr
        </div>
      </div>
    </div>
  );
}
