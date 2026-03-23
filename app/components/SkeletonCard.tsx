export default function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-2xl p-5 space-y-3 animate-pulse">
      <div className="h-3.5 bg-gray-100 rounded-full w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-gray-100 rounded-full" style={{ width: `${90 - i * 10}%` }} />
      ))}
    </div>
  );
}
