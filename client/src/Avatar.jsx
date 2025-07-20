export default function Avatar({ userId, username,online }) {
  const colors = [
    "w-7 h-7 rounded-full flex items-center justify-center bg-red-200",
    "w-7 h-7 rounded-full flex items-center justify-center bg-blue-200",
    "w-7 h-7 rounded-full flex items-center justify-center bg-green-200",
    "w-7 h-7 rounded-full flex items-center justify-center bg-yellow-200",
    "w-7 h-7 rounded-full flex items-center justify-center bg-purple-200",
    "w-7 h-7 rounded-full flex items-center justify-center bg-pink-200",
    "w-7 h-7 rounded-full flex items-center justify-center bg-teal-200",
  ];
  const lastChar = userId.slice(-1);
  const colorIndex = parseInt(lastChar, 16) % colors.length;
  const colorClass = colors[colorIndex];

  return (
    <div className={`${colorClass} relative`}>
      <div className="text-center w-full font-medium text-xs text-gray-700">
        {username[0].toUpperCase()}</div>
      {online && (
        <div className="absolute w-2.5 h-2.5 bg-green-500 bottom-0 right-0 rounded-full border border-white" ></div>
      )}
      {!online && (
        <div className="absolute w-2.5 h-2.5 bg-gray-400 bottom-0 right-0 rounded-full border border-white" ></div>
      )}
    </div>
  );
}