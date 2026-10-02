import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import type { ReactNode } from 'react'

/** Spodný panel – zavrie sa ťuknutím mimo alebo potiahnutím nadol. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const drag = useDragControls()
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div
            drag="y"
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 500) onClose()
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="themed glass-strong safe-bottom relative w-full max-w-md rounded-t-[2rem] px-4 pt-3"
            style={{ background: 'var(--t-sheet)' }}
          >
            <div className="touch-none cursor-grab" onPointerDown={(e) => drag.start(e)}>
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-faint" />
              {title && <div className="font-caps pb-3 text-xl tracking-wide">{title}</div>}
            </div>
            <div className="pb-2">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
