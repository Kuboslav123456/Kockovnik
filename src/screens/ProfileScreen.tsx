import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNav } from '../nav'
import { deleteProfile, updateProfile, useApp } from '../lib/store'
import { fmt, playerStats } from '../lib/game'
import { ACHIEVEMENTS, AVATAR_PACKS, EFFECTS, REWARDS, TITLES, unlockedFor } from '../lib/progression'
import { THEMES, THEME_ORDER } from '../lib/themes'
import { playEffect } from '../lib/effects'
import type { EffectId, Profile } from '../lib/types'
import { Avatar, Btn, Header, Screen, Section, Toggle, XpBar } from '../components/ui'

export function ProfileScreen({ id }: { id: string }) {
  const nav = useNav()
  const app = useApp()
  const profile = app.profiles.find((p) => p.id === id)

  useEffect(() => {
    if (!profile) nav.back()
  }, [profile]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!profile) return null
  return <ProfileView profile={profile} />
}

const lockLevel = (kind: string, rid: string) => REWARDS.find((r) => r.kind === kind && r.id === rid)?.level ?? 0

function ProfileView({ profile }: { profile: Profile }) {
  const nav = useNav()
  const app = useApp()
  const u = unlockedFor(profile)
  const s = playerStats(app.history, profile.id)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile.name)
  const set = (patch: Partial<Profile>) => updateProfile(profile.id, patch)
  const inGame = app.activeGame?.playerIds.includes(profile.id)

  const lockedAvatarPacks = Object.keys(AVATAR_PACKS).filter((k) => !u.avatars.includes(AVATAR_PACKS[k][0]))

  return (
    <Screen className="safe-bottom pb-8">
      <Header title="Profil" />

      <div className="flex flex-col items-center px-4 text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
          <Avatar profile={profile} size={104} glow />
        </motion.div>
        {editing ? (
          <div className="mt-4 flex w-full gap-2">
            <input
              autoFocus
              value={name}
              maxLength={18}
              onChange={(e) => setName(e.target.value)}
              className="themed min-w-0 flex-1 rounded-2xl border border-line bg-black/25 px-4 py-2 text-center text-xl font-bold text-ink outline-none focus:border-accent"
            />
            <Btn
              variant="accent"
              onClick={() => {
                if (name.trim()) set({ name: name.trim() })
                setEditing(false)
              }}
            >
              ✓
            </Btn>
          </div>
        ) : (
          <button className="mt-4 text-3xl font-black" onClick={() => setEditing(true)}>
            {profile.name} <span className="text-base opacity-50">✏️</span>
          </button>
        )}
        {profile.titleId && <div className="text-accent">{TITLES[profile.titleId]}</div>}
        <div className="mt-1 text-sm text-muted">⭐ {s.wins} {s.wins === 1 ? 'hviezda' : s.wins >= 2 && s.wins <= 4 ? 'hviezdy' : 'hviezd'}</div>
        <XpBar xp={profile.xp} className="mt-4 w-full" />
      </div>

      <Section className="mt-5">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            ['Hry', s.games],
            ['Výhry', s.wins],
            ['Úspešnosť', `${Math.round(s.winRate * 100)} %`],
            ['Max ťah', fmt(s.bestTurn)],
          ].map(([l, v]) => (
            <div key={l} className="themed glass rounded-2xl px-1 py-3">
              <div className="tabular font-bold">{v}</div>
              <div className="text-[10px] text-muted">{l}</div>
            </div>
          ))}
        </div>
        <Btn className="mt-2 w-full" onClick={() => nav.go({ name: 'pass', id: profile.id })}>
          🗺️ Kockový pas
        </Btn>
      </Section>

      <Section title="Avatar" className="mt-6">
        <div className="grid grid-cols-8 gap-1.5">
          {u.avatars.map((a) => (
            <motion.button
              key={a}
              whileTap={{ scale: 0.85 }}
              onClick={() => set({ avatar: a })}
              className={`themed grid aspect-square place-items-center rounded-xl text-2xl ${profile.avatar === a ? 'glow bg-surface-strong' : 'bg-black/20'}`}
            >
              {a}
            </motion.button>
          ))}
          {lockedAvatarPacks.flatMap((k) =>
            AVATAR_PACKS[k].map((a) => (
              <div key={a} className="grid aspect-square place-items-center rounded-xl bg-black/20 text-sm text-muted" title={`Úroveň ${lockLevel('avatars', k)}`}>
                🔒
              </div>
            )),
          )}
        </div>
      </Section>

      <Section title="Téma stola" className="mt-6">
        <div className="grid grid-cols-2 gap-2">
          {THEME_ORDER.map((t) => {
            const open = u.themes.includes(t)
            const th = THEMES[t]
            return (
              <motion.button
                key={t}
                whileTap={open ? { scale: 0.95 } : undefined}
                disabled={!open}
                onClick={() => set({ themeId: t })}
                className={`relative h-20 overflow-hidden rounded-2xl border text-left ${profile.themeId === t ? 'glow border-transparent' : 'border-line'}`}
                style={{ background: th.background }}
              >
                <div className={`absolute inset-0 flex flex-col justify-end p-3 ${open ? '' : 'bg-black/60 backdrop-blur-[2px]'}`}>
                  <div className="font-semibold" style={{ color: th.vars['--t-text'] }}>
                    {open ? th.emoji : '🔒'} {open ? th.name : '???'}
                  </div>
                  {!open && <div className="text-[11px] text-white/60">úroveň {lockLevel('theme', t)}</div>}
                </div>
                <span className="absolute right-3 top-3 h-4 w-4 rounded-full" style={{ background: th.vars['--t-accent'], boxShadow: `0 0 12px ${th.vars['--t-glow']}` }} />
              </motion.button>
            )
          })}
        </div>
      </Section>

      <Section title="Titul" className="mt-6">
        <div className="flex flex-wrap gap-2">
          <Btn className={`!rounded-full !py-2 text-sm ${!profile.titleId ? 'glow' : ''}`} onClick={() => set({ titleId: null })}>
            Bez titulu
          </Btn>
          {Object.keys(TITLES).map((t) =>
            u.titles.includes(t) ? (
              <Btn key={t} className={`!rounded-full !py-2 text-sm ${profile.titleId === t ? 'glow' : ''}`} onClick={() => set({ titleId: t })}>
                {TITLES[t]}
              </Btn>
            ) : (
              <span key={t} className="glass rounded-full px-4 py-2 text-sm text-muted">
                🔒 úroveň {lockLevel('title', t)}
              </span>
            ),
          )}
        </div>
      </Section>

      <Section title="Efekt víťazstva" className="mt-6">
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(EFFECTS) as EffectId[]).map((e) => {
            const open = u.effects.includes(e)
            return (
              <Btn
                key={e}
                disabled={!open}
                className={`flex flex-col items-center !px-1 text-sm ${profile.effectId === e ? 'glow' : ''}`}
                onClick={() => {
                  set({ effectId: e })
                  const v = THEMES[profile.themeId].vars
                  playEffect(e, [v['--t-accent'], v['--t-accent2'], '#ffffff'])
                }}
              >
                <span className="text-2xl">{open ? EFFECTS[e].icon : '🔒'}</span>
                <span>{open ? EFFECTS[e].name : `úroveň ${lockLevel('effect', e)}`}</span>
              </Btn>
            )
          })}
        </div>
      </Section>

      <Section className="mt-3">
        {u.dice ? (
          <Toggle checked={profile.diceBackground} onChange={(v) => set({ diceBackground: v })} label="🎲 Kocky v pozadí" hint="Počas tvojho ťahu poletujú kocky" />
        ) : (
          <div className="glass rounded-2xl px-4 py-3 text-sm text-muted">🔒 Kocky v pozadí – úroveň 8</div>
        )}
      </Section>

      <Section title={`Odznaky · ${profile.achievements.length}/${ACHIEVEMENTS.length}`} className="mt-6">
        <div className="grid grid-cols-3 gap-2">
          {ACHIEVEMENTS.map((a, i) => {
            const got = profile.achievements.includes(a.id)
            const secret = a.hidden && !got
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`themed flex flex-col items-center gap-1 rounded-2xl p-3 text-center ${got ? 'glass-strong glow' : 'glass'}`}
              >
                <span className={`text-3xl ${got ? '' : 'opacity-30 grayscale'}`}>{secret ? '❓' : a.icon}</span>
                <span className="text-xs font-semibold leading-tight">{secret ? 'Skrytý odznak' : a.name}</span>
                <span className="text-[10px] leading-tight text-muted">{secret ? 'Objav, čo ho odomkne' : a.desc}</span>
              </motion.div>
            )
          })}
        </div>
      </Section>

      <Section className="mt-8">
        <Btn
          variant="ghost"
          className="w-full !text-accent2"
          disabled={inGame}
          onClick={() => {
            if (confirm(`Naozaj zmazať profil ${profile.name}? Úrovne a odznaky sa stratia.`)) deleteProfile(profile.id)
          }}
        >
          {inGame ? 'Hráč je v rozohranej hre' : 'Zmazať profil'}
        </Btn>
      </Section>
    </Screen>
  )
}
