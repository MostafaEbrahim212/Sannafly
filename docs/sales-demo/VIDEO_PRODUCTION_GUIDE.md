# Automated Video Production Guide

An automated Playwright screen-recording script is provided at `scripts/record-tutorials.mjs`.

## Prerequisites
Playwright video rendering requires its `ffmpeg` binary:
```sh
npx playwright install ffmpeg
```

## Recording Commands
1. Start the local server:
   ```sh
   php artisan serve --host=127.0.0.1 --port=8099
   ```
2. Record all configured recipes (`vid-01`, `vid-02`, `vid-04`, `vid-10`, `vid-11`, `vid-19`):
   ```sh
   node scripts/record-tutorials.mjs
   ```
3. Or record a single tutorial by ID:
   ```sh
   node scripts/record-tutorials.mjs vid-01
   ```

## Output Location
- Videos are saved as `.webm` (`1280×720`) into `public/docs/videos/`.
- Once recorded, update the corresponding entry in `resources/js/data/videoTutorials.ts` to `status: 'recorded'` and add `videoUrl: '/docs/videos/<filename>.webm'` so the `<video>` player activates in `/admin/help/videos`.
