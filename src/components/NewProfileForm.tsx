import { motion } from 'framer-motion'
import { useState } from 'react'
import { BASE_AVATARS } from '../lib/progression'
import { createProfile } from '../lib/store'
import type { Profile } from '../lib/types'
import { Btn } from './ui'

export function NewProfileForm({ onCreated, onCancel }: { onCreated: (p: Profile) => void; onCancel?: () => void }) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(BASE_AVATARS[Math.floor(Math.random() * BASE_AVATARS.length)])
  const ok = name.trim().length > 0

  const submit = () => {
    if (!ok) return
    onCreated(createProfile(name, avatar))
    setName('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="themed glass-strong mt-3 flex flex-col gap-3 rounded-3xl p-4">
        <input
          autoFocus
          value={name}
          maxLength={18}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Meno hráča"
          className="themed rounded-2xl border border-line bg-black/25 px-4 py-3 text-lg text-ink outline-none placeholder:text-muted focus:border-accent"
        />
        <div className="grid grid-cols-8 gap-1.5">
          {BASE_AVATARS.map((a) => (
            <motion.button
              key={a}
              whileTap={{ scale: 0.85 }}
              onClick={() => setAvatar(a)}
              className={`themed grid aspect-square place-items-center rounded-xl text-2xl ${avatar === a ? 'glow bg-surface-strong' : 'bg-black/20'}`}
            >
              {a}
            </motion.button>
          ))}
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Btn variant="ghost" className="flex-1" onClick={onCancel}>
              Zrušiť
            </Btn>
          )}
          <Btn variant="accent" className="flex-[2]" disabled={!ok} onClick={submit}>
            Pridať hráča
          </Btn>
        </div>
      </div>
    </motion.div>
  )
}
