import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { useNav } from '../nav'
import { deleteProfile, updateProfile, useApp } from '../lib/store'
import { fmt, playerStats } from '../lib/game'
import { ACHIEVEMENTS, AVATAR_PACKS, BURSTS, EFFECTS, FONTS, KEYPADS, REWARDS, SOUNDS, TITLES, unlockedFor } from '../lib/progression'
import { THEMES, THEME_ORDER } from '../lib/themes'
import { playEffect } from '../lib/effects'
import type { BurstId, EffectId, FontId, KeypadId, Profile, SoundId } from '../lib/types'
import { sfx } from '../lib/sound'
import { Burst } from '../components/Burst'
import { GenderPicker } from '../components/NewProfileForm'
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
  const [demo, setDemo] = useState<{ burst: BurstId; key: number } | null>(null)
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
              className="themed min-w-0 flex-1 rounded-2xl border border-line bg-field px-4 py-2 text-center text-xl font-bold text-ink outline-none focus:border-accent"
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

      <Section className="mt-4">
        <GenderPicker value={profile.gender} onChange={(g) => set({ gender: g })} />
      </Section>

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
          🗺️ Dobrodružstvo
        </Btn>
      </Section>

      <Section title="Avatar" className="mt-6">
        <div className="grid grid-cols-8 gap-1.5">
          {u.avatars.map((a) => (
            <motion.button
              key={a}
              whileTap={{ scale: 0.85 }}
              onClick={() => set({ avatar: a })}
              className={`themed grid aspect-square place-items-center rounded-xl text-2xl ${profile.avatar === a ? 'glow bg-surface-strong' : 'bg-surface'}`}
            >
              {a}
            </motion.button>
          ))}
          {lockedAvatarPacks.flatMap((k) =>
            AVATAR_PACKS[k].map((a) => (
              <div key={a} className="grid aspect-square place-items-center rounded-xl bg-surface text-sm text-muted" title={`Úroveň ${lockLevel('avatars', k)}`}>
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

      <div className="mt-8 px-5">
        <div className="text-lg font-bold">Počas tvojho ťahu</div>
        <div className="text-xs text-muted">Toto uvidia všetci pri stole, keď máš mobil v ruke ty.</div>
      </div>

      <Section title="Klávesnica" className="mt-3">
        <Choices
          options={(Object.keys(KEYPADS) as KeypadId[]).map((k) => ({
            id: k,
            name: KEYPADS[k].name,
            open: u.keypads.includes(k),
            lock: lockLevel('keypad', k),
            preview: (
              <div className="grid grid-cols-3 gap-1">
                {['1', '5', '0'].map((n) => (
                  <span key={n} className={`key key-${k} grid h-8 w-9 place-items-center text-sm font-bold`}>
                    {n}
                  </span>
                ))}
              </div>
            ),
          }))}
          selected={profile.keypadId}
          onSelect={(k) => {
            sfx.tap(profile.soundId)
            set({ keypadId: k })
          }}
        />
      </Section>

      <Section title="Animácia bodov" className="mt-5">
        <div className="themed glass relative mb-2 h-20 overflow-visible rounded-3xl">
          <div className="absolute inset-0 grid place-items-center text-xs text-muted">Ťukni na animáciu pre ukážku</div>
          <AnimatePresence>
            {demo && (
              <motion.div key={demo.key} className="absolute inset-0" exit={{ opacity: 0 }}>
                <Burst burst={demo.burst} points={500} onDone={() => setDemo(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Choices
          options={(Object.keys(BURSTS) as BurstId[]).map((b) => ({
            id: b,
            name: BURSTS[b].name,
            open: u.bursts.includes(b),
            lock: lockLevel('burst', b),
            preview: <span className="text-2xl">{BURSTS[b].icon}</span>,
          }))}
          selected={profile.burstId}
          onSelect={(b) => {
            set({ burstId: b })
            if (b === 'lightning') sfx.thunder()
            sfx.add(500, profile.soundId)
            setDemo({ burst: b, key: Date.now() })
          }}
        />
      </Section>

      <Section title="Písmo čísel" className="mt-5">
        <Choices
          options={(Object.keys(FONTS) as FontId[]).map((f) => ({
            id: f,
            name: FONTS[f].name,
            open: u.fonts.includes(f),
            lock: lockLevel('font', f),
            preview: <span className={`inline-block text-2xl font-black ${FONTS[f].className}`}>2 350</span>,
          }))}
          selected={profile.fontId}
          onSelect={(f) => set({ fontId: f })}
        />
      </Section>

      <Section title="Zvuky" className="mt-5">
        <Choices
          options={(Object.keys(SOUNDS) as SoundId[]).map((snd) => ({
            id: snd,
            name: SOUNDS[snd].name,
            open: u.sounds.includes(snd),
            lock: lockLevel('sound', snd),
            preview: <span className="text-2xl">{SOUNDS[snd].icon}</span>,
          }))}
          selected={profile.soundId}
          onSelect={(snd) => {
            set({ soundId: snd })
            sfx.add(750, snd)
          }}
        />
      </Section>

      <Section className="mt-3">
        {u.dice ? (
          <Toggle checked={profile.diceBackground} onChange={(v) => set({ diceBackground: v })} label="🎲 Kocky v pozadí" hint="Počas tvojho ťahu poletujú kocky" />
        ) : (
          <div className="glass rounded-2xl px-4 py-3 text-sm text-muted">🔒 Kocky v pozadí – úroveň {lockLevel('dice', 'dice')}</div>
        )}
      </Section>

      <Section title="Titul" className="mt-8">
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
                  playEffect(e, [v['--t-accent'], v['--t-accent2'], v['--t-accent3']])
                }}
              >
                <span className="text-2xl">{open ? EFFECTS[e].icon : '🔒'}</span>
                <span>{open ? EFFECTS[e].name : `úroveň ${lockLevel('effect', e)}`}</span>
              </Btn>
            )
          })}
        </div>
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

/** Mriežka volieb s ukážkou; zamknuté ukazujú úroveň, na ktorej sa odomknú. */
function Choices<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: { id: T; name: string; open: boolean; lock: number; preview: ReactNode }[]
  selected: T
  onSelect: (id: T) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => (
        <motion.button
          key={o.id}
          whileTap={o.open ? { scale: 0.95 } : undefined}
          disabled={!o.open}
          onClick={() => onSelect(o.id)}
          className={`themed relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl px-2 py-3 ${selected === o.id && o.open ? 'glass-strong glow' : 'glass'}`}
        >
          <div className={`flex h-9 w-full items-center justify-center ${o.open ? '' : 'opacity-25 blur-[1.5px] grayscale'}`}>{o.preview}</div>
          <div className="text-xs font-semibold">{o.open ? o.name : `🔒 úroveň ${o.lock}`}</div>
        </motion.button>
      ))}
    </div>
  )
}
