# Kockovník 🎲

Zapisovač bodov pri kockách (napr. „10 000“) s úrovňami, odmenami a odznakmi.
Jeden mobil, ktorý si hráči posúvajú pri stole.

## Spustenie

```bash
npm install
npm run dev
```

Vite vypíše aj adresu typu `http://192.168.x.x:5173`. Tú otvor na mobile v rovnakej Wi-Fi.

## Build

```bash
npm run build
```

Výstup je v `dist/` (statické súbory, dajú sa nahrať na ľubovoľný hosting).
Ako PWA (ikona na ploche, offline režim) appka funguje naplno až cez HTTPS.

## Vzhľad „Rukopis“

Predvolený vzhľad je stredoveký iluminovaný rukopis: pergamen, iniciály v rumelkových rámčekoch, zlato a rumelka. Body sa „zapisujú do kroniky“.

- Písma: IM Fell English (text, iniciály, logo) a IM Fell English SC (kapitálky). Nemajú slovenské znaky (č, š, ž, ť, ľ…), preto ich dopĺňa EB Garamond.
- Gotické písmo (UnifrakturMaguntia) z pôvodného návrhu sa nepoužíva, lebo bolo zle čitateľné.
- Rozloženie Domova a Hry je spoločné pre všetky témy. Témy menia farby, písma a dekor (tokeny v `src/lib/themes.ts`).
- Zvuky sú predvolene **stredoveké**: loutna (fyzikálny model struny Karplus-Strong), zvon, bubon, fanfára trúbok, harfa, škrabnutie brka, šuchot pergamenu a hrkot kociek. Všetko sa skladá v kóde cez Web Audio, žiadne zvukové súbory.
- Citát nad hodnotou („A Sofi hodila kockami a padlo jej…“) berie tvar slovies z profilu hráča. Ak rod nie je zadaný, použije sa neutrálne „Sofi hádže…“.

## Dobrodružstvo – čo sa odomyká

Hrá sa na jednom mobile, takže väčšina odmien sa ukazuje **počas ťahu hráča**: keď má mobil v ruke Sofi, všetci vidia jej tému stola, klávesnicu, animáciu bodov, písmo aj zvuky. Nová odmena sa po odomknutí zapne sama (okrem tém stola, tie si hráč vyberie v profile), v profile sa dá všetko zmeniť.

| Úroveň | Odmena |
|---|---|
| 1 | Témy Rukopis a Tmavé drevo |
| 2 | Nové avatary |
| 3 | Téma Kasíno |
| 4 | Klávesnica: Kockové klávesy, titul Kockový šľachtic |
| 5 | Efekt výhry: Ohňostroj |
| 6 | Animácia bodov: Explózia |
| 7 | Téma Neón |
| 8 | Kocky v pozadí |
| 9 | Písmo čísel: Krieda |
| 10 | Téma Vesmír, titul Pán kociek |
| 11 | Zvuky: 8-bit |
| 12 | Klávesnica: Neónová |
| 13 | Nové avatary |
| 14 | Animácia bodov: Blesk |
| 15 | Zlatý rámik, titul Kockový mág |
| 16 | Písmo čísel: Digitálne |
| 17 | Efekt výhry: Zlatý dážď |
| 18 | Klávesnica: Zlatá, titul Legenda stola |
| 19 | Nové avatary, zvuky Kasíno |
| 20 | Téma Drak, animácia bodov Dračí oheň |

XP: účasť +20, výhra +100, najvyšší ťah hry +15, comeback +30, každý nový odznak +25.

## Klenotnica – vzácne kocky

Po každej dohratej hre otvorí každý hráč truhlicu s náhodnou kockou (24 kociek v 5 stupňoch vzácnosti, `src/lib/dice.ts`).

| Truhlica | Kedy | Bežná | Vzácna | Epická | Legendárna | Mýtická |
|---|---|---|---|---|---|---|
| Drevená | účasť | 60 % | 25 % | 11 % | 3,5 % | 0,5 % |
| Železná | výhra | 45 % | 32 % | 17 % | 5 % | 1 % |
| Zlatá | ťah 1 000+, comeback alebo nový odznak | 25 % | 35 % | 27 % | 10 % | 3 % |

- Každá truhlica dá aj pár mincí (2 / 5 / 10). Duplikát sa premení na mince podľa vzácnosti (5 / 15 / 40 / 100 / 250).
- Za mince sa dá vykovať chýbajúca kocka (30 / 90 / 240 / 600 / 1 500).
- Obľúbená kocka sa točí vedľa zapisovanej hodnoty počas ťahu hráča.
- **Sady:** 24 kociek je rozdelených do 6 sád po 4 (`DICE_SETS` v `src/lib/dice.ts`). Dokončená sada odomkne titul a pridá mince (50 až 500).

## Virtuálne kocky

V hre pod hodnotou je „Hodiť virtuálnymi kockami“. Hráč hodí 6 kockami, odloží bodujúce, môže hodiť zvyšné alebo zapísať. Keď nič nebodujúce nepadne, prepadol. Keď odloží všetkých šesť, hádže znova všetkými („horúce kocky“). Ako kocky sa použije obľúbená kocka hráča z Klenotnice.

Bodovanie (`src/lib/scoring.ts`): jednotka 100, päťka 50, tri rovnaké = číslo × 100 (tri jednotky 1 000), každá ďalšia rovnaká kocka zdvojnásobí, postupka 1–6 = 1 500.

Pri odvete a pri novej hre s rovnakou partiou začína ďalší hráč v poradí.

## Štruktúra

- `src/lib/game.ts`: odvodenie stavu hry z poľa ťahov (súčty, hráč na ťahu, posledné kolo, víťaz). Undo = odobratie posledného ťahu.
- `src/lib/progression.ts`: XP krivka, úrovne, odmeny (témy, avatary, tituly, efekty) a achievementy. **Tu sa upravujú odmeny.**
- `src/lib/store.ts`: stav v localStorage + akcie (profily, hra, uzavretie hry a rozdanie XP).
- `src/lib/themes.ts`: farebné témy stola.
- `src/screens/*`: obrazovky (Domov, Nová hra, Hra, Výhra, Profily, Profil, Dobrodružstvo, Štatistiky).

## Poznámka k nástrojom

Projekt používa Vite 7. Vite 8 (Rolldown) na tomto firemnom počítači blokuje Application Control politika.
