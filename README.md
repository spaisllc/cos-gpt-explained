# COS-GPT — What It Is, and What It Is Not

A single-page explainer site for [COS-GPT](https://ask.springsaisolutions.com/),
the civic-record search tool for Colorado Springs & Manitou Springs.

**The concept:** the page floats over a dark archive of buried documents. A
searchlight follows your cursor (or finger — or wanders on its own when idle)
and brings whatever it touches into the light. Transparency, rendered literally.

## Run it

No build step, no dependencies:

```bash
open index.html            # or: python3 -m http.server 8000
```

## Structure

```
index.html          — all content; [data-beam="..."] sets the light's mood per section
css/styles.css      — dark-archive + dossier aesthetic (paper citation card, mono labels)
js/searchlight.js   — the light engine: document sprites, beam falloff, dust motes, idle wander
```

## Beam moods (`js/searchlight.js` → `MOODS`)

| Section | Mood | Feel |
|---|---|---|
| hero / problem | `cold` | blue-white searching light |
| how / citations | `found` | warm — the discovery |
| what-it's-not | `guard` | amber, watchful |
| builder | `clear` | green-gold daylight |

The site `--accent` color follows the beam mood, so chrome and light always match.

## Content accuracy

All product claims (203k+ records, 7 indexes, coverage windows, citation card
behavior, privacy practices) were drawn from the `cos-gpt` repository and the
live product, including the verbatim on-site disclaimer. If the product changes,
update the copy here to match.

Accessibility: `prefers-reduced-motion` renders one static lit frame, no animation.
