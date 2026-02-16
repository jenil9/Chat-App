export default function AvatarOverlay({ name, subtitle }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-lg bg-black/40 z-10 text-slate-50 animate-fade-in">
      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl shadow-cyan-500/50">
        {name && name[0] ? name[0].toUpperCase() : '?'}
      </div>
      <p className="mt-6 text-xl font-semibold">{name}</p>
      {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
    </div>
  )
}
