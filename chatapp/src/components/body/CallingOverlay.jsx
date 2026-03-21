export default function CallingOverlay({ name }) {
  return (
    <div className="bg-[#0d1117] absolute inset-0 flex flex-col items-center justify-center z-10 animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-[#2d333b] border-2 border-white/[0.08] flex items-center justify-center text-slate-200 text-2xl font-semibold mb-6">
        {name && name[0] ? name[0].toUpperCase() : '?'}
      </div>
      <p className="text-slate-200 text-base font-medium mb-1">Calling...</p>
      <p className="text-slate-500 text-sm">{name}</p>
      <div className="flex gap-1.5 mt-5">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0ms]" />
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:150ms]" />
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  )
}
