import { motion } from "framer-motion"

export default function CallingOverlay({ name }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center backdrop-blur-lg bg-black/40 z-10 animate-fade-in">
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="text-slate-50 text-2xl font-bold text-center"
      >
        <p className="mb-2">Calling...</p>
        <p className="text-lg text-cyan-400">{name}</p>
      </motion.div>
    </div>
  )
}
