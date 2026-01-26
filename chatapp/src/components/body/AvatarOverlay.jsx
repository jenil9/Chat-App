export default function AvatarOverlay({ name, subtitle }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 text-white">
      <div className="w-24 h-24 rounded-full bg-neutral-700 flex items-center justify-center text-3xl">
        {name[0]}
      </div>
      <p className="mt-4 text-lg">{name}</p>
      {subtitle && <p className="text-sm text-white/70">{subtitle}</p>}
    </div>
  )
}
