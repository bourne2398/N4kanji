# N4 Kanji Flashcards

A beautiful, mobile-first JLPT N4 Kanji flashcard web app optimized for phones (especially Techno Camon 30 5G).

## Features

- **Big Kanji** – Extra large, clear Japanese characters
- **Tap to flip** – Front: Kanji → Back: 音読み / 訓読み / English meaning
- **Swipe gestures** that follow your finger
  - Swipe **right** → Knew (saved to Knew tab)
  - Swipe **left** → Don't Know (saved to Don't Know tab)
- **Tabs**
  - Study (main deck)
  - Knew
  - Don't Know
- **Progress tracking** with localStorage (survives browser refresh)
- **Landscape mode** – Full screen, only the flashcard (no buttons/UI)
- Works offline after first load

## How to use

1. Open `index.html` on your phone (or host it)
2. Tap the card to flip and see readings + meaning
3. Swipe right if you know it, left if you don’t
4. Check the **Knew** and **Don't Know** tabs anytime
5. Tap any kanji in the lists to move it back to the study deck
6. Use the ↺ button to fully reset progress

## Live / Hosting

You can open the files directly or deploy to:
- GitHub Pages
- Netlify
- Vercel
- Any static host

## Tech

- Pure HTML + CSS + Vanilla JS
- No frameworks, no build step
- LocalStorage for progress
- Touch + mouse support

---

Made for JLPT N4 preparation.
