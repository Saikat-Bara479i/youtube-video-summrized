# YouTube Video Summarizer (Gemini + Chrome Extension)

A Chrome extension that adds an **“AI Summary”** button to YouTube.  
It automatically opens the video transcript, sends it to **Google Gemini**, and shows a **structured markdown summary** in a beautiful popup.

---

## ✨ Features

- 🧠 One-click **AI summary** for any YouTube video with captions  
- 📑 Uses the **full transcript**, not just the title/description  
- 🧾 Well-structured output:
  - Quick Summary (2–3 sentences)
  - Detailed Summary (key points, arguments, conclusions)
  - Trust Signals (channel credibility + fact-check notes)
- 🖼️ Clean, modern popup UI with animations  
- 🔁 Works with YouTube’s **SPA navigation** (no page reload needed)

---

## 📦 Folder Setup

1. **Download or clone** this repository.
2. Make sure **all files** from the repo are in a **single folder** (do not split them across directories).
3. You’ll use this folder as the **unpacked extension** in Chrome.

---

## 🔑 Gemini API Key Setup

You need a **free Gemini API key** from Google:

1. Go to the Gemini API page and create/get your API key.
2. Open `background.js` in this project folder.
3. Find the line where the API key is set (something like):

   ```js
   const GEMINI_API_KEY = "YOUR_API_KEY_HERE";

