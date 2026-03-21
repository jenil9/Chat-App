export default function AvatarOverlay({ name, subtitle }) {
  return (
    <div className="bg-[#0d1117]/95 absolute inset-0 flex flex-col items-center justify-center z-10 text-slate-50 animate-fade-in">
      <div className="w-24 h-24 rounded-full bg-[#2d333b] border border-white/[0.08] text-slate-100 text-3xl font-bold flex items-center justify-center">
        {name && name[0] ? name[0].toUpperCase() : '?'}
      </div>
      <p className="text-slate-400 text-sm mt-4">{name}</p>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
  )
}
