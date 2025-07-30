import Avatar from './Avatar';

export default function Contact({ id, selected, username, onClick, online }) {
    return (
        <div onClick={() => onClick(id)} key={id}
        className={
            "border-b border-emerald-200 py-2 flex items-stretch cursor-pointer hover:bg-emerald-50 transition-colors duration-200" +
            (selected ? " bg-emerald-100" : "")
        }>
        {selected && (
            <div className="w-1 bg-emerald-500 h-10 rounded-r-lg"></div>
        )}
        <div className="flex items-center gap-2 pl-4">
            <Avatar online={online} username={username} userId={id} />
            <span className="text-slate-800 font-serif">{username}</span>
        </div>
    </div>
    );
}