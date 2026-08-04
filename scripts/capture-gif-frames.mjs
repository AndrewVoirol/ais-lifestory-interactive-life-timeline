/**
 * Capture demo GIF frames for the LifeStory README.
 *
 * Choreography:
 *   Act 1: Landing page hero (1.5s)
 *   Act 2: Click "Start a Story" → contributor modal → fill name → join (3s)
 *   Act 3: Chat with biographer — type message → AI streams response → event appears (8s)
 *   Act 4: Show room with photo-rich timeline (pre-seeded, photo thumbnails visible) (2s)
 *   Act 5: Upload a photo via the Image Analyzer modal (2s)
 *   Act 6: Second contributor joins — presence updates (1.5s)
 *
 * Usage: node scripts/capture-gif-frames.mjs
 * Then:  ffmpeg -framerate 10 -i screenshots/frames/frame_%04d.png \
 *          -vf "scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" \
 *          -loop 0 screenshots/demo.gif
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const FRAMES_DIR = path.join(process.cwd(), 'screenshots', 'frames');
const PHOTO_ROOM = 'demo-gif-photos';

let frameIndex = 0;

async function captureFrame(page, label, holdFrames = 1) {
  for (let i = 0; i < holdFrames; i++) {
    frameIndex++;
    const framePath = path.join(FRAMES_DIR, `frame_${String(frameIndex).padStart(4, '0')}.png`);
    await page.screenshot({ path: framePath });
  }
  console.log(`  Frame ${frameIndex}: ${label}${holdFrames > 1 ? ` (held ${holdFrames}x)` : ''}`);
}

/** Read a demo photo and return a base64 data URL */
function photoToDataUrl(filename) {
  const filePath = path.join(process.cwd(), 'public', 'demo-photos', filename);
  const buf = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

/** Pre-seed a room with photo-rich events */
async function seedPhotoRoom() {
  const schoolPhotoData = photoToDataUrl('childhood-school-photo.jpg');
  const roadtripAlexData = photoToDataUrl('roadtrip-alex-selfie.jpg');
  const roadtripMarcoData = photoToDataUrl('roadtrip-marco-backseat.jpg');
  const partyAlexData = photoToDataUrl('party-alex-group.jpg');
  const partyMarcoData = photoToDataUrl('party-marco-aftermath.jpg');

  const events = [
    {
      id: 'gif-evt-1',
      title: 'Born in San Francisco',
      description: 'Born at UCSF Medical Center in the heart of the city.',
      date: '1992',
      contributedBy: 'Alex',
      contributorColor: '#3d85c6',
      contributorId: 'alex-gif',
    },
    {
      id: 'gif-evt-2',
      title: 'School Picture Day',
      description: '3rd grade picture day at Lincoln Elementary.',
      date: '1998',
      contributedBy: 'Alex',
      contributorColor: '#3d85c6',
      contributorId: 'alex-gif',
      photos: [
        {
          id: 'gif-photo-1',
          dataUrl: schoolPhotoData,
          uploadedBy: 'Alex',
          uploadedByColor: '#3d85c6',
          caption: 'School picture day',
          timestamp: Date.now() - 60000,
        },
      ],
    },
    {
      id: 'gif-evt-3',
      title: 'Road Trip to Yosemite',
      description: 'Drove up Highway 120 with Marco. Got lost twice. Best trip ever.',
      date: 'Summer 2015',
      contributedBy: 'Alex',
      contributorColor: '#3d85c6',
      contributorId: 'alex-gif',
      photos: [
        {
          id: 'gif-photo-2',
          dataUrl: roadtripAlexData,
          uploadedBy: 'Alex',
          uploadedByColor: '#3d85c6',
          caption: 'The Instagram version',
          timestamp: Date.now() - 50000,
        },
        {
          id: 'gif-photo-3',
          dataUrl: roadtripMarcoData,
          uploadedBy: 'Marco',
          uploadedByColor: '#e07a5f',
          caption: 'The reality version',
          timestamp: Date.now() - 40000,
        },
      ],
      comments: [
        {
          id: 'gif-cmt-1',
          contributorName: 'Marco',
          contributorColor: '#e07a5f',
          content: "You forgot about the 3 gas station burritos.",
          timestamp: Date.now() - 30000,
          isCorrection: true,
        },
      ],
    },
    {
      id: 'gif-evt-4',
      title: 'The Infamous House Party',
      description: "String lights, great playlist, and a kitchen that needed 4 hours of cleanup.",
      date: "New Year's 2019",
      contributedBy: 'Marco',
      contributorColor: '#e07a5f',
      contributorId: 'marco-gif',
      photos: [
        {
          id: 'gif-photo-4',
          dataUrl: partyAlexData,
          uploadedBy: 'Alex',
          uploadedByColor: '#3d85c6',
          caption: 'Everyone at their best',
          timestamp: Date.now() - 20000,
        },
        {
          id: 'gif-photo-5',
          dataUrl: partyMarcoData,
          uploadedBy: 'Marco',
          uploadedByColor: '#e07a5f',
          caption: 'The version Alex tried to delete',
          timestamp: Date.now() - 10000,
        },
      ],
    },
  ];

  for (const event of events) {
    await fetch(`${BASE_URL}/api/rooms/${PHOTO_ROOM}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'add', payload: event }),
    });
  }

  // Join Alex
  await fetch(`${BASE_URL}/api/rooms/${PHOTO_ROOM}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'join',
      payload: { id: 'alex-gif', name: 'Alex', color: '#3d85c6', isSubject: true, lastSeen: Date.now(), isOnline: true },
    }),
  });

  console.log(`Seeded photo room "${PHOTO_ROOM}" with ${events.length} events and photos.`);
}

async function main() {
  if (fs.existsSync(FRAMES_DIR)) {
    fs.rmSync(FRAMES_DIR, { recursive: true });
  }
  fs.mkdirSync(FRAMES_DIR, { recursive: true });

  // Seed the photo-rich room
  await seedPhotoRoom();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });

  // ════════════════════════════════════════
  // ACT 1: Landing page
  // ════════════════════════════════════════
  console.log('Act 1: Landing page');
  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await captureFrame(page, 'Landing page hero', 15);

  // ════════════════════════════════════════
  // ACT 2: Enter a room — contributor modal
  // ════════════════════════════════════════
  console.log('Act 2: Contributor modal');
  await page.click('button:has-text("Start a Story")');
  await page.waitForTimeout(1200);
  await captureFrame(page, 'Contributor modal opens', 8);

  // Fill in name
  await page.fill('input#name', 'Alex');
  await page.waitForTimeout(400);
  await captureFrame(page, 'Name filled', 5);

  // Check "I am the subject"
  await page.click('input#isSubject');
  await page.waitForTimeout(300);
  await captureFrame(page, 'Subject checked', 3);

  // Click Join
  await page.click('button:has-text("Join Timeline")');
  await page.waitForTimeout(1500);
  await captureFrame(page, 'Room loaded — biographer greeting', 10);

  // ════════════════════════════════════════
  // ACT 3: Chat with biographer
  // ════════════════════════════════════════
  console.log('Act 3: Chat interaction');
  const message = "I was born in San Francisco in 1992...";
  const chatInput = page.locator('input[placeholder*="share a memory"]').first();

  for (let i = 0; i < message.length; i++) {
    await chatInput.type(message[i], { delay: 0 });
    if (i % 10 === 9 || i === message.length - 1) {
      await captureFrame(page, `Typing: "${message.substring(0, i + 1)}"`, 1);
    }
  }
  await captureFrame(page, 'Message typed', 4);

  // Submit
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  await captureFrame(page, 'Message sent', 4);

  // Wait for AI streaming
  let responseStarted = false;
  for (let i = 0; i < 30; i++) {
    const botBubbles = await page.locator('[class*="bg-secondary"]').count();
    if (botBubbles > 0) {
      responseStarted = true;
      break;
    }
    await page.waitForTimeout(500);
  }

  if (responseStarted) {
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(800);
      await captureFrame(page, `AI streaming ${i + 1}`, 2);
    }
  }

  await page.waitForTimeout(3000);
  await captureFrame(page, 'AI response complete', 8);

  // ════════════════════════════════════════
  // ACT 4: Navigate to photo-rich room
  // ════════════════════════════════════════
  console.log('Act 4: Photo-rich room');
  // Navigate to the pre-seeded room with photos
  await page.addInitScript(() => {
    localStorage.setItem('contributor-id', 'alex-gif');
    localStorage.setItem('contributor-name', 'Alex');
    localStorage.setItem('contributor-color', '#3d85c6');
    localStorage.setItem('contributor-is-subject', 'true');
  });
  await page.goto(`${BASE_URL}/room/${PHOTO_ROOM}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await captureFrame(page, 'Room with photos on timeline', 12);

  // Scroll timeline down to show party event with 2 photos
  await page.evaluate(() => {
    const timeline = document.querySelector('[class*="overflow-y-auto"]');
    if (timeline) timeline.scrollTop = timeline.scrollHeight;
  });
  await page.waitForTimeout(800);
  await captureFrame(page, 'Timeline scrolled — party photos visible', 10);

  // ════════════════════════════════════════
  // ACT 5: Open Image Analyzer to show upload flow
  // ════════════════════════════════════════
  console.log('Act 5: Photo upload flow');
  // Click the image analyzer button (camera icon in the chat header area)
  const analyzerBtn = page.locator('button[aria-label*="image"], button:has(svg.lucide-image), button:has(svg.lucide-camera)').first();
  const analyzerBtnVisible = await analyzerBtn.isVisible().catch(() => false);
  
  if (analyzerBtnVisible) {
    await analyzerBtn.click();
    await page.waitForTimeout(800);
    await captureFrame(page, 'Image analyzer modal open', 10);
    // Close it
    const closeBtn = page.locator('button:has(svg.lucide-x)').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  } else {
    // Try the header icon button approach
    const headerBtns = page.locator('.flex.items-center.gap-2 button').all();
    console.log('  ⚠ Image analyzer button not found by aria-label, skipping upload modal');
    await captureFrame(page, 'Room with photos (no upload modal found)', 10);
  }

  // ════════════════════════════════════════
  // ACT 6: Marco joins
  // ════════════════════════════════════════
  console.log('Act 6: Second contributor joins');
  await fetch(`${BASE_URL}/api/rooms/${PHOTO_ROOM}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'join',
      payload: { id: 'marco-gif', name: 'Marco', color: '#e07a5f', isSubject: false, lastSeen: Date.now(), isOnline: true },
    }),
  });
  await page.waitForTimeout(1500);
  await captureFrame(page, 'Marco joined — 2 online', 12);

  // Final hold
  await captureFrame(page, 'Final state — complete room with photos', 12);

  await browser.close();

  console.log(`\n✓ Captured ${frameIndex} frames in ${FRAMES_DIR}`);
  console.log('\nTo assemble GIF:');
  console.log(`  ffmpeg -framerate 10 -i screenshots/frames/frame_%04d.png \\`);
  console.log(`    -vf "scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" \\`);
  console.log(`    -loop 0 screenshots/demo.gif`);
}

main().catch(console.error);
