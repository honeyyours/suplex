export default function ComingSoon({ icon, title, description, items }) {
  return (
    <div className="text-center py-16 px-6">
      <div className="text-5xl mb-4">{icon}</div>
      <h2 className="text-xl font-semibold text-navy-800 mb-2">{title}</h2>
      <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">{description}</p>

      {items && items.length > 0 && (
        <div className="max-w-md mx-auto text-left bg-gray-50 rounded-lg border p-4">
          <div className="text-xs font-semibold text-gray-500 mb-2">예정 기능</div>
          <ul className="space-y-1.5">
            {items.map((t, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-gray-400">·</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-xs text-gray-400 mt-6">곧 구현 예정</div>
    </div>
  );
}
