import { animate, motion, useMotionValue, useTransform, type HTMLMotionProps } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import { fmt } from '../lib/game'
import { levelProgress, TITLES, unlockedFor } from '../lib/progression'
import { sfx } from '../lib/sound'
import type { Profile } from '../lib/types'
import { useNav } from '../nav'

// ---------- Tlačidlo ----------

type BtnProps = HTMLMotionProps<'button'> & { variant?: 'accent' | 'glass' | 'ghost'; silent?: boolean }

export function Btn({ variant = 'glass', className = '', silent, onClick, children, ...rest }: BtnProps) {
  const base =
    variant === 'accent'
      ? 'btn-accent cta font-semibold'
      : variant === 'glass'
        ? 'glass text-ink'
        : 'text-muted'
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`themed rounded-2xl px-4 py-3 disabled:opacity-40 ${base} ${className}`}
      onClick={(e) => {
        if (!silent) sfx.tap()
        onClick?.(e)
      }}
      {...rest}
    >
      {children}
    </motion.button>
  )
}

// ---------- Hlavička obrazovky ----------

export function Header({ title, right, onBack }: { title: string; right?: ReactNode; onBack?: () => void }) {
  const nav = useNav()
  return (
    <div
      className="safe-top sticky top-0 z-20 flex items-center gap-2 px-4 pb-3"
      style={{ background: 'linear-gradient(to bottom, var(--t-sheet) 55%, transparent)' }}
    >
      <Btn variant="glass" className="!rounded-full !p-0 h-11 w-11 grid shrink-0 place-items-center" onClick={onBack ?? (() => nav.back())} aria-label="Späť">
        <HistoricArrow />
      </Btn>
      <h1 className="font-caps flex-1 truncate text-2xl tracking-wide">{title}</h1>
      {right}
    </div>
  )
}

/** Šíp ako zo stredovekého rukopisu: ostnatý hrot, tenké telo a perie. Kreslí sa farbou textu. */
export function HistoricArrow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 16" width="30" height="16" className={className} aria-hidden="true">
      {/* hrot s ostňami */}
      <path d="M1.5 8 L9 2.6 L7.4 8 L9 13.4 Z" fill="currentColor" />
      {/* telo šípu */}
      <line x1="7" y1="8" x2="27" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* perie */}
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none">
        <path d="M19 8 L22 3.6 M22 8 L25 3.6 M25 8 L28 3.6" />
        <path d="M19 8 L22 12.4 M22 8 L25 12.4 M25 8 L28 12.4" />
      </g>
    </svg>
  )
}

export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto flex min-h-full w-full max-w-md flex-col ${className}`}>{children}</div>
}

// ---------- Avatar ----------

export function Avatar({ profile, size = 48, glow }: { profile: Pick<Profile, 'avatar' | 'xp'>; size?: number; glow?: boolean }) {
  const frame = unlockedFor(profile as Profile).frame
  const inner = (
    <div
      className={`themed avatar-disc grid place-items-center rounded-full ${glow ? 'avatar-glow' : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.55, lineHeight: 1 }}
    >
      {profile.avatar}
    </div>
  )
  if (!frame) return inner
  return (
    <div className="relative grid place-items-center rounded-full" style={{ width: size + 6, height: size + 6 }}>
      <div className="gold-frame absolute inset-0 rounded-full" />
      <div className="relative rounded-full bg-black/60">{inner}</div>
    </div>
  )
}

export function PlayerName({ profile, className = '' }: { profile: Profile; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="truncate font-semibold">{profile.name}</div>
      {profile.titleId && <div className="truncate text-xs text-accent">{TITLES[profile.titleId]}</div>}
    </div>
  )
}

// ---------- Číslo, ktoré "dobehne" ----------

export function AnimatedNumber({ value, className = '', duration = 0.8, onTick }: { value: number; className?: string; duration?: number; onTick?: () => void }) {
  const mv = useMotionValue(value)
  const text = useTransform(mv, (v) => fmt(Math.round(v)))
  useEffect(() => {
    let last = Math.round(mv.get())
    const c = animate(mv, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        const r = Math.round(v / 50)
        if (onTick && r !== last) {
          last = r
          onTick()
        }
      },
    })
    return () => c.stop()
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  return <motion.span className={`tabular ${className}`}>{text}</motion.span>
}

// ---------- XP bar ----------

export function XpBar({ xp, className = '' }: { xp: number; className?: string }) {
  const p = levelProgress(xp)
  return (
    <div className={className}>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>Úroveň {p.level}</span>
        <span className="tabular">{p.needed ? `${fmt(p.current)} / ${fmt(p.needed)} XP` : 'MAX'}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-track">
        <motion.div
          className="bar-fill h-full rounded-full"
          initial={false}
          animate={{ width: `${Math.max(3, p.ratio * 100)}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        />
      </div>
    </div>
  )
}

// ---------- Prepínač ----------

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button
      type="button"
      className="themed glass flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left"
      onClick={() => {
        sfx.tap()
        onChange(!checked)
      }}
    >
      <div className="flex-1">
        <div className="font-medium">{label}</div>
        {hint && <div className="text-xs text-muted">{hint}</div>}
      </div>
      <div className={`relative h-7 w-12 rounded-full ${checked ? 'btn-accent' : 'bg-track'}`}>
        <motion.div
          className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
          animate={{ left: checked ? 24 : 4 }}
          transition={{ type: 'spring', stiffness: 600, damping: 32 }}
        />
      </div>
    </button>
  )
}

export function Section({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`px-4 ${className}`}>
      {title && <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted">{title}</h2>}
      {children}
    </section>
  )
}

export const listItem = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, type: 'spring' as const, stiffness: 260, damping: 24 } }),
}
