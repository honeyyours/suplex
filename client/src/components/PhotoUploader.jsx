import { useState, useRef } from 'react';

export default function PhotoUploader({ value = [], onChange, max = 10 }) {
  const inputRef = useRef(null);
  const [previews, setPreviews] = useState([]);

  function pick() {
    inputRef.current?.click();
  }

  function onFiles(e) {
    const files = Array.from(e.target.files || []);
    const remaining = max - value.length;
    const next = files.slice(0, remaining);
    const all = [...value, ...next];
    onChange(all);

    const urls = all.map((f) => (f instanceof File ? URL.createObjectURL(f) : f));
    setPreviews(urls);
    e.target.value = '';
  }

  function removeAt(i) {
    const next = value.filter((_, idx) => idx !== i);
    onChange(next);
    setPreviews(next.map((f) => (f instanceof File ? URL.createObjectURL(f) : f)));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((file, i) => (
          <div key={i} className="relative w-20 h-20 rounded border overflow-hidden bg-gray-100">
            <img
              src={previews[i] || (file instanceof File ? URL.createObjectURL(file) : file)}
              alt=""
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-0.5 right-0.5 bg-black/60 text-white text-xs w-5 h-5 rounded-full leading-none"
            >×</button>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={pick}
            className="w-20 h-20 border-2 border-dashed rounded flex flex-col items-center justify-center text-xs text-gray-400 hover:border-navy-500 hover:text-navy-600"
          >
            <span className="text-xl leading-none mb-0.5">+</span>
            <span>사진 추가</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={onFiles}
        className="hidden"
      />
      <div className="text-xs text-gray-400 mt-1.5">
        최대 {max}장 · 개당 10MB까지
      </div>
    </div>
  );
}
