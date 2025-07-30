export default function Avatar({ userId, username, online }) {
  const colors = [
    "w-7 h-7 rounded-full flex items-center justify-center bg-red-200 border border-red-300",
    "w-7 h-7 rounded-full flex items-center justify-center bg-blue-200 border border-blue-300",
    "w-7 h-7 rounded-full flex items-center justify-center bg-green-200 border border-green-300",
    "w-7 h-7 rounded-full flex items-center justify-center bg-yellow-200 border border-yellow-300",
    "w-7 h-7 rounded-full flex items-center justify-center bg-purple-200 border border-purple-300",
    "w-7 h-7 rounded-full flex items-center justify-center bg-pink-200 border border-pink-300",
    "w-7 h-7 rounded-full flex items-center justify-center bg-teal-200 border border-teal-300",
  ];

  if (!userId || !username) {
    return (
      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-200 border border-slate-300 relative">
        <div className="text-center w-full font-medium text-xs text-slate-700 font-serif">?</div>
        <div className="absolute w-2.5 h-2.5 bg-slate-400 bottom-0 right-0 rounded-full border border-white"></div>
      </div>
    );
  }

  const lastChar = userId.slice(-1);
  const colorIndex = parseInt(lastChar, 16) % colors.length;
  const colorClass = colors[colorIndex];

  return (
    <div className={`${colorClass} relative`}>
      <div className="text-center w-full font-medium text-xs text-slate-700 font-serif">
        {username[0].toUpperCase()}
      </div>
      {online && (
        <div className="absolute w-2.5 h-2.5 bg-emerald-500 bottom-0 right-0 rounded-full border border-white"></div>
      )}
      {!online && (
        <div className="absolute w-2.5 h-2.5 bg-slate-400 bottom-0 right-0 rounded-full border border-white"></div>
      )}
    </div>
  );
}