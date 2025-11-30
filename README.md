# Portfolio A. ko.

Minimalistický, plne statický web v slovenčine. Všetky texty, odkazy na video, fotografie aj poézia sa načítavajú z jedného súboru `content-config.json`, ktorý vie upravovať aj neprogramátor.

## Ako spustiť web lokálne

Pretože prehliadač blokuje `fetch` pri otváraní súborov priamo z disku, spustite jednoduchý statický server v koreňovej zložke projektu:

```bash
# Python 3
python -m http.server 4173
```

Potom otvorte `http://localhost:4173` v prehliadači.

Alternatívy: `npx serve`, `npx http-server`, alebo akýkoľvek iný statický hosting (GitHub Pages, Netlify...). Stačí skopírovať celý adresár na hosting, nič netreba buildovať.

## Úprava obsahu

1. Otvorte `content-config.json`.
2. Dávajte pozor na úvodzovky a čiarky – súbor musí zostať platný JSON.
3. Polia:
   - `bio`: krátky text na úvodnej strane.
   - `mainPhoto`: cesta k portrétu (napr. `/assets/artist/vertical.jpg`).
   - `videos`: zoznam objektov s kľúčmi `url`, `title`, `annotation`.
   - `photos`: zoznam fotografií s kľúčmi `src`, `title`, `annotation`.
   - `poems`: zoznam básní s `file` (cesta k `.txt` alebo `.md`), `title`, `annotation`, voliteľne `audio` (cesta k `.mp3` alebo `.wav`).
4. Uložte súbor. Pri ďalšom načítaní stránky sa nový obsah zobrazí automaticky.

## Pridanie nových podkladov

- **Fotografie**: vložte súbory do `assets/photos/` (ideálne optimalizované `.jpg`/`.webp`). Do konfigurácie pridajte novú položku `photos` so správnou cestou.
- **Portréty**: väčší obrázok umiestnite do `assets/artist/` a aktualizujte `mainPhoto`.
- **Básne**: vytvorte textový súbor (`.txt` alebo `.md`) v `assets/poems/`. Do konfigurácie pridajte položku s cestou k súboru. Ak máte audio nahrávku, vložte ju do `assets/audio/` a uveďte cestu v `audio`.
- **Video odkazy**: stačí uviesť platné YouTube alebo Vimeo URL.

## Štruktúra projektu

```
index.html          # HTML šablóna
styles.css          # Vizuálna vrstva
main.js             # Načítanie configu, galéria, modaly
content-config.json # Jediný konfiguračný súbor
assets/             # Obrázky, poézia, audio
```

Stačí upravovať konfiguráciu a nahrádzať súbory v `assets/`; HTML/CSS/JS nie je potrebné meniť, pokiaľ nemeníte dizajn alebo funkcionalitu.
