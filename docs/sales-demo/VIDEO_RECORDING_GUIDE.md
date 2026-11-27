# Manual Video Recording Guide

## Preparation
1. Open the app at `1280×720` or `1440×900` (100% browser zoom).
2. Use OBS Studio, Loom, or ScreenPal with a clean microphone.
3. Open `/admin/help/videos` on a second monitor or print the narration script & storyboard for the lesson you are recording.
4. Enable **Demo Mode** if recording public sales videos so no real customer data appears.

## Recording Tips
- Speak naturally at a steady pace matching the 2–3.5 minute target.
- Pause 1 second after clicking major navigation transitions so viewers can follow the screen.
- Export as `.mp4` or `.webm` into `public/docs/videos/` matching the filename in `scripts/record-tutorials.mjs`, then set `status: 'recorded'` and `videoUrl` in `resources/js/data/videoTutorials.ts`.
