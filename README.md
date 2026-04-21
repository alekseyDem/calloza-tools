# Phone Word Converter

Convert between words and phone keypad numbers. Find vanity numbers instantly.

**[Try it live]([https://calloza.github.io/phone-word-converter/](https://alekseydem.github.io/calloza-tools/))**

## What it does

**Word to Number** — Type a word like `FLOWERS` and get `356-9377`. Useful for creating memorable vanity phone numbers.

**Number to Words** — Type digits like `228` and find all matching English words (`ACT`, `BAT`, `CAT`). Useful for discovering what words your existing number can spell.

## How phone keypad mapping works

```
1        2 (ABC)  3 (DEF)
4 (GHI)  5 (JKL)  6 (MNO)
7 (PQRS) 8 (TUV)  9 (WXYZ)
*        0 (+)    #
```

Standard ITU E.161 / ISO 9995-8 mapping used on all phone keypads worldwide.

## Examples

| Word       | Number       |
|------------|--------------|
| FLOWERS    | 356-9377     |
| CALL ME    | 2255 63      |
| HELP       | 4357         |
| TAXI       | 8294         |
| PIZZA      | 74992        |
| 1-800-COOL | 1-800-2665   |

## Use cases

- **Businesses** — Find a memorable vanity number for your company
- **Marketing** — Check what words your phone number already spells
- **Developers** — Reference for phone keypad mapping (ITU E.161)
- **Curious minds** — Explore what words hide in phone numbers

## Run locally

No build tools, no dependencies. Just open the file:

```bash
open index.html
```

Or serve with any static file server:

```bash
npx serve .
```

## Project structure

```
index.html              Single-page app
css/style.css           Minimal responsive styles
js/converter.js         Core conversion logic (pure functions)
js/dictionary.js        Curated English word list (~3000 words)
js/app.js               UI event handling
```

## Contributing

Contributions welcome! Some ideas:

- Add more words to the dictionary
- Add support for other languages
- Improve mobile experience
- Add copy-to-clipboard button

## License

MIT

## Acknowledgments

Built by [Calloza](https://calloza.com) — make international calls directly from your browser.
