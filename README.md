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

Predvolený vzhľad je stredoveký iluminovaný rukopis: pergamen, gotické iniciály, zlato a rumelka. Body sa „zapisujú do kroniky“.

- Písma: UnifrakturMaguntia (iniciály, logo, „Kolo“), IM Fell English a IM Fell English SC. Tieto písma nemajú slovenské znaky (č, š, ž, ť, ľ…), preto ich dopĺňa EB Garamond.
- Rímske číslo kola je v IM Fell, lebo v gotickom písme sa I a J nedajú rozlíšiť.
- Rozloženie Domova a Hry je spoločné pre všetky témy. Témy menia farby, písma a dekor (tokeny v `src/lib/themes.ts`).
- Citát nad hodnotou („A Sofi hodila kockami a padlo jej…“) berie tvar slovies z profilu hráča. Ak rod nie je zadaný, použije sa neutrálne „Sofi hádže…“.

## Kockový pas – čo sa odomyká

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

## Štruktúra

- `src/lib/game.ts`: odvodenie stavu hry z poľa ťahov (súčty, hráč na ťahu, posledné kolo, víťaz). Undo = odobratie posledného ťahu.
- `src/lib/progression.ts`: XP krivka, úrovne, odmeny (témy, avatary, tituly, efekty) a achievementy. **Tu sa upravujú odmeny.**
- `src/lib/store.ts`: stav v localStorage + akcie (profily, hra, uzavretie hry a rozdanie XP).
- `src/lib/themes.ts`: farebné témy stola.
- `src/screens/*`: obrazovky (Domov, Nová hra, Hra, Výhra, Profily, Profil, Kockový pas, Štatistiky).

## Poznámka k nástrojom

Projekt používa Vite 7. Vite 8 (Rolldown) na tomto firemnom počítači blokuje Application Control politika.
