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

## Štruktúra

- `src/lib/game.ts`: odvodenie stavu hry z poľa ťahov (súčty, hráč na ťahu, posledné kolo, víťaz). Undo = odobratie posledného ťahu.
- `src/lib/progression.ts`: XP krivka, úrovne, odmeny (témy, avatary, tituly, efekty) a achievementy. **Tu sa upravujú odmeny.**
- `src/lib/store.ts`: stav v localStorage + akcie (profily, hra, uzavretie hry a rozdanie XP).
- `src/lib/themes.ts`: farebné témy stola.
- `src/screens/*`: obrazovky (Domov, Nová hra, Hra, Výhra, Profily, Profil, Kockový pas, Štatistiky).

## Poznámka k nástrojom

Projekt používa Vite 7. Vite 8 (Rolldown) na tomto firemnom počítači blokuje Application Control politika.
