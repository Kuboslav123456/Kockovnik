import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNav } from '../nav'
import { forgeDie, updateProfile, useApp } from '../lib/store'
import { DICE, DICE_SETS, DIE_MAP, RARITIES, RARITY_ORDER, setDone, type DieDef } from '../lib/dice'
import { sfx } from '../lib/sound'
import { fmt } from '../lib/game'
import { Avatar, Btn, Header, Screen, Section } from '../components/ui'
import { Sheet } from '../components/Sheet'
import { Die3D, DieSilhouette } from '../components/Die3D'

export function Treasury({ initialId }: { initialId?: string }) {
  const nav = useNav()
  const app = useApp()
  const [id, setId] = useState(initialId ?? [...app.profiles].sort((a, b) => b.xp - a.xp)[0]?.id)
  const [detail, setDetail] = useState<DieDef | null>(null)
  const profile = app.profiles.find((p) => p.id === id)

  if (!profile) {
    return (
      <Screen>
        <Header title="Klenotnica" />
        <div className="px-6 py-16 text-center text-muted">
          Najprv si založ hráča. Kocky sa získavajú z truhlíc po každej hre.
          <Btn variant="accent" className="mt-4 w-full" onClick={() => nav.go({ name: 'profiles' })}>
            Založiť hráča
          </Btn>
        </div>
      </Screen>
    )
  }

  const owned = DICE.filter((d) => (profile.dice[d.id] ?? 0) > 0).length
  const fav = profile.favoriteDie ? DIE_MAP[profile.favoriteDie] : null

  return (
    <Screen className="safe-bottom pb-8">
      <Header title="Klenotnica" />

      {app.profiles.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
          {app.profiles.map((p) => (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                sfx.tap()
                setId(p.id)
              }}
              className={`themed flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3 ${p.id === id ? 'glass-strong glow' : 'glass opacity-70'}`}
            >
              <Avatar profile={p} size={30} />
              <span className="text-sm">{p.name}</span>
            </motion.button>
          ))}
        </div>
      )}

      <Section>
        <div className="themed glass flex items-center gap-4 p-4">
          <div className="grid h-24 w-24 shrink-0 place-items-center">
            {fav ? <Die3D die={fav} size={64} idle interactive /> : <DieSilhouette size={64} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted">Obľúbená kocka</div>
            <div className="truncate text-xl">{fav ? fav.name : 'zatiaľ žiadna'}</div>
            <div className="mt-2 flex gap-4 text-sm">
              <span>
                <b className="text-accent">{owned}</b> / {DICE.length} kociek
              </span>
              <span>🪙 {fmt(profile.coins)} mincí</span>
            </div>
          </div>
        </div>
        <p className="mt-2 px-1 text-xs italic text-muted">
          Po každej hre dostaneš truhlicu: drevenú za účasť, železnú za výhru, zlatú za ťah nad 1 000, comeback alebo nový odznak. Duplikáty
          sa menia na mince, za mince sa dá vykovať kocka, ktorá ti chýba.
        </p>
      </Section>

      <Section title="Sady" className="mt-6">
        <div className="flex flex-col gap-2">
          {DICE_SETS.map((set) => {
            const have = set.dice.filter((id) => (profile.dice[id] ?? 0) > 0).length
            const done = setDone(profile.dice, set)
            return (
              <div key={set.id} className={`themed glass flex items-center gap-3 px-3 py-2.5 ${done ? 'glow' : ''}`}>
                <span className="text-2xl">{set.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate">{set.name}</span>
                    <span className={`shrink-0 text-xs ${done ? 'text-accent' : 'text-muted'}`}>{done ? '✓ dokončená' : `${have} / 4`}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    {set.dice.map((id) => (
                      <div key={id} className="grid h-7 w-7 place-items-center">
                        {(profile.dice[id] ?? 0) > 0 ? <Die3D die={DIE_MAP[id]} size={20} /> : <DieSilhouette size={20} />}
                      </div>
                    ))}
                    <span className="ml-1 truncate text-[11px] italic text-muted">
                      titul „{set.titleName}“ + {set.coins} 🪙
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {RARITY_ORDER.map((r) => {
        const list = DICE.filter((d) => d.rarity === r)
        const have = list.filter((d) => (profile.dice[d.id] ?? 0) > 0).length
        return (
          <Section key={r} className="mt-6">
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h2 className="font-caps text-lg" style={{ color: RARITIES[r].color }}>
                {RARITIES[r].name}
              </h2>
              <span className="text-xs text-muted">
                {have} / {list.length}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {list.map((d, i) => {
                const count = profile.dice[d.id] ?? 0
                return (
                  <motion.button
                    key={d.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      sfx.tap()
                      setDetail(d)
                    }}
                    className={`themed glass relative flex flex-col items-center gap-1.5 px-1 pb-2 pt-3 ${profile.favoriteDie === d.id ? 'glow' : ''}`}
                  >
                    <div className="grid h-14 w-14 place-items-center">{count > 0 ? <Die3D die={d} size={38} /> : <DieSilhouette size={38} />}</div>
                    <span className="w-full truncate text-center text-[11px] leading-tight">{count > 0 ? d.name : '???'}</span>
                    {count > 1 && <span className="absolute right-1 top-1 text-[10px] text-muted">×{count}</span>}
                  </motion.button>
                )
              })}
            </div>
          </Section>
        )
      })}

      <Sheet open={!!detail} onClose={() => setDetail(null)} title={detail ? (profile.dice[detail.id] ? detail.name : 'Neznáma kocka') : ''}>
        {detail && <DieDetail die={detail} profileId={profile.id} onDone={() => setDetail(null)} />}
      </Sheet>
    </Screen>
  )
}

function DieDetail({ die, profileId, onDone }: { die: DieDef; profileId: string; onDone: () => void }) {
  const app = useApp()
  const profile = app.profiles.find((p) => p.id === profileId)!
  const count = profile.dice[die.id] ?? 0
  const cost = RARITIES[die.rarity].forge
  const isFav = profile.favoriteDie === die.id
  const [completed, setCompleted] = useState<string[]>([])

  return (
    <div className="flex flex-col items-center pb-2 text-center">
      <div className="grid h-40 place-items-center" style={{ filter: count ? undefined : 'grayscale(1) brightness(0.55)' }}>
        <Die3D die={die} size={96} idle interactive />
      </div>
      <div className="font-caps text-sm" style={{ color: RARITIES[die.rarity].color }}>
        {RARITIES[die.rarity].name}
      </div>
      {count > 0 ? (
        <>
          <p className="mt-2 italic text-muted">{die.desc}</p>
          <div className="mt-1 text-sm">V zbierke: {count} ks</div>
          <Btn
            variant={isFav ? 'glass' : 'accent'}
            className="mt-4 w-full"
            disabled={isFav}
            onClick={() => {
              updateProfile(profileId, { favoriteDie: die.id })
              onDone()
            }}
          >
            {isFav ? '★ Toto je tvoja obľúbená' : '★ Nastaviť ako obľúbenú'}
          </Btn>
          <p className="mt-2 text-xs text-muted">Obľúbenú kocku uvidia všetci počas tvojho ťahu.</p>
          {completed.map((id) => {
            const set = DICE_SETS.find((s) => s.id === id)!
            return (
              <motion.div
                key={id}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                className="themed glass-strong glow mt-3 w-full px-3 py-2"
              >
                {set.icon} Sada „{set.name}“ dokončená! Titul „{set.titleName}“ a +{set.coins} 🪙
              </motion.div>
            )
          })}
        </>
      ) : (
        <>
          <p className="mt-2 italic text-muted">Túto kocku ešte nemáš. Môže padnúť z truhlice alebo ju dáš vykovať.</p>
          <Btn
            variant="accent"
            className="mt-4 w-full"
            disabled={profile.coins < cost}
            onClick={() => {
              const done = forgeDie(profileId, die.id)
              if (done) {
                sfx.seal()
                sfx.levelUp()
                setCompleted(done)
              }
            }}
          >
            ⚒ Vykovať za {fmt(cost)} 🪙
          </Btn>
          <p className="mt-2 text-xs text-muted">
            {profile.coins < cost ? `Chýba ti ${fmt(cost - profile.coins)} mincí.` : `Máš ${fmt(profile.coins)} mincí.`}
          </p>
        </>
      )}
    </div>
  )
}
