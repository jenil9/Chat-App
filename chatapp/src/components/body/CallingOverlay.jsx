import { motion } from "framer-motion"

export default function CallingOverlay({ name }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="text-white text-xl font-medium"
      >
        {name}
      </motion.div>
    </div>
  )
}
