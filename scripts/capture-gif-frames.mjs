/**
 * Capture demo GIF frames for the LifeStory README.
 *
 * Choreography:
 *   1. Landing page hero
 *   2. Click "Start a Story" → room loads with contributor modal
 *   3. Fill in name "Alex", pick color, check "I am the subject", join
 *   4. Room view — biographer greeting visible
 *   5. Type a memory into the chat
 *   6. Wait for AI to stream a response + event extraction
 *   7. Timeline event appears
 *   8. Pause — then show second tab (Marco joins, photo uploaded)
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
const ROOM_ID = 'demo-gif-room';

let frameIndex = 0;

async function captureFrame(page, label, holdFrames = 1) {
  for (let i = 0; i < holdFrames; i++) {
    frameIndex++;
    const framePath = path.join(FRAMES_DIR, `frame_${String(frameIndex).padStart(4, '0')}.png`);
    await page.screenshot({ path: framePath });
  }
  console.log(`  Frame ${frameIndex}: ${label}${holdFrames > 1 ? ` (held ${holdFrames}x)` : ''}`);
}

// Pre-seed events so the GIF shows a populated room
async function seedRoom() {
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
      title: 'First Day at Lincoln Elementary',
      description: 'Walked to school with Dad. Made friends with Marco on the playground — he shared his fruit snacks.',
      date: '1998',
      contributedBy: 'Alex',
      contributorColor: '#3d85c6',
      contributorId: 'alex-gif',
    },
    {
      id: 'gif-evt-3',
      title: 'Road Trip to Yosemite',
      description: 'Drove up Highway 120 with Marco. Alex took the Instagram-worthy selfie. Marco documented the snack debris.',
      date: 'Summer 2015',
      contributedBy: 'Marco',
      contributorColor: '#e07a5f',
      contributorId: 'marco-gif',
      comments: [
        {
          id: 'gif-cmt-1',
          contributorName: 'Marco',
          contributorColor: '#e07a5f',
          content: "You forgot to mention the 3 gas station burritos. I have photographic evidence.",
          timestamp: Date.now() - 30000,
        },
      ],
    },
  ];

  for (const event of events) {
    await fetch(`${BASE_URL}/api/rooms/${ROOM_ID}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'add', payload: event }),
    });
  }
}

async function main() {
  // Clean and create frames dir
  if (fs.existsSync(FRAMES_DIR)) {
    fs.rmSync(FRAMES_DIR, { recursive: true });
  }
  fs.mkdirSync(FRAMES_DIR, { recursive: true });

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
  await captureFrame(page, 'Landing page hero', 15); // Hold 1.5s at 10fps

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
  await captureFrame(page, 'Name filled in', 5);

  // Check "I am the subject"
  await page.click('input#isSubject');
  await page.waitForTimeout(300);
  await captureFrame(page, 'Subject checked', 3);

  // Click Join
  await page.click('button:has-text("Join Timeline")');
  await page.waitForTimeout(1500);
  await captureFrame(page, 'Room loaded — biographer greeting', 12);

  // ════════════════════════════════════════
  // ACT 3: Interact with the biographer
  // ════════════════════════════════════════
  console.log('Act 3: Chat interaction');
  // Type a message character by character for visual effect
  const message = "I was born in San Francisco in 1992...";
  const chatInput = page.locator('input[placeholder*="share a memory"]').first();
  
  // Type slowly (capture every few chars)
  for (let i = 0; i < message.length; i++) {
    await chatInput.type(message[i], { delay: 0 });
    if (i % 8 === 7 || i === message.length - 1) {
      await captureFrame(page, `Typing: "${message.substring(0, i + 1)}"`, 1);
    }
  }
  await captureFrame(page, 'Message typed', 5);

  // Submit the message
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  await captureFrame(page, 'Message sent — waiting for AI', 5);

  // Wait for AI response to start streaming
  // Poll for bot message bubble to appear
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
    // Capture several frames while streaming
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(800);
      await captureFrame(page, `AI streaming response ${i + 1}`, 2);
    }
  }

  // Wait for response to finish
  await page.waitForTimeout(3000);
  await captureFrame(page, 'AI response complete', 10);

  // ════════════════════════════════════════
  // ACT 4: Switch to timeline view
  // ════════════════════════════════════════
  console.log('Act 4: Timeline view');
  // Click on Timeline tab (desktop)
  const timelineTab = page.locator('button:has-text("Timeline")').first();
  if (await timelineTab.isVisible()) {
    // Already in split view on desktop — timeline should be visible
    await captureFrame(page, 'Split view — chat + timeline', 10);
  }

  // ════════════════════════════════════════
  // ACT 5: Second contributor joins (simulated via pre-seeded room)
  // ════════════════════════════════════════
  console.log('Act 5: Simulating second contributor');
  // Open a new page as Marco
  const marcoPage = await context.newPage();
  await marcoPage.addInitScript(() => {
    localStorage.setItem('contributor-id', 'marco-gif');
    localStorage.setItem('contributor-name', 'Marco');
    localStorage.setItem('contributor-color', '#e07a5f');
    localStorage.setItem('contributor-is-subject', 'false');
  });

  // Get the room URL from the current page
  const currentUrl = page.url();
  await marcoPage.goto(currentUrl, { waitUntil: 'networkidle' });
  await marcoPage.waitForTimeout(2000);

  // Switch back to Alex's page to show updated presence
  await page.bringToFront();
  await page.waitForTimeout(1000);
  await captureFrame(page, 'Marco joined — 2 online', 12);

  // Clean up Marco's page
  await marcoPage.close();

  // Final hold on the complete state
  await captureFrame(page, 'Final state — complete room', 15);

  await browser.close();

  console.log(`\n✓ Captured ${frameIndex} frames in ${FRAMES_DIR}`);
  console.log('\nTo assemble GIF:');
  console.log(`  ffmpeg -framerate 10 -i screenshots/frames/frame_%04d.png \\`);
  console.log(`    -vf "scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" \\`);
  console.log(`    -loop 0 screenshots/demo.gif`);
}

main().catch(console.error);
