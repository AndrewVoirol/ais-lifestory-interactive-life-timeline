/**
 * Capture screenshots for the LifeStory README.
 * 
 * Usage: node scripts/capture-screenshots.mjs
 * 
 * Produces:
 *   screenshots/landing-page.png      — above-the-fold hero
 *   screenshots/landing-narrative.png  — "How It Works" section with demo photos
 *   screenshots/contributor-modal.png  — room page with identity modal open
 *   screenshots/room-chat.png          — room with pre-seeded events and chat
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots');
const ROOM_ID = 'demo-screenshots';

// Pre-seed room events via the API
async function seedRoom() {
  const events = [
    {
      id: 'evt-birth',
      title: 'Birth',
      description: 'Born in San Francisco.',
      date: '1992',
      contributedBy: 'Alex',
      contributorColor: '#3d85c6',
      contributorId: 'alex-001',
    },
    {
      id: 'evt-fog',
      title: 'Watching Fog Over Golden Gate Bridge',
      description: 'Earliest memory of watching the fog roll in over the Golden Gate Bridge from the kitchen window.',
      date: 'Early Childhood',
      contributedBy: 'Alex',
      contributorColor: '#3d85c6',
      contributorId: 'alex-001',
    },
    {
      id: 'evt-giants',
      title: 'Giants Games at Candlestick Park with Dad',
      description: "Alex's dad would take them to watch the Giants play at Candlestick Park in the summer, creating some of Alex's favorite childhood memories.",
      date: '1998',
      contributedBy: 'Alex',
      contributorColor: '#3d85c6',
      contributorId: 'alex-001',
      comments: [
        {
          id: 'cmt-1',
          contributorName: 'Marco',
          contributorColor: '#e07a5f',
          content: "Dude, that was 1997 — I have the ticket stub. We sat in the nosebleeds.",
          timestamp: Date.now() - 60000,
          isCorrection: true,
        },
      ],
      corrections: [
        {
          contributorName: 'Marco',
          contributorColor: '#e07a5f',
          field: 'date',
          oldValue: '1998',
          newValue: '1997',
          timestamp: Date.now() - 60000,
        },
      ],
    },
  ];

  // Seed each event
  for (const event of events) {
    await fetch(`${BASE_URL}/api/rooms/${ROOM_ID}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'add', payload: event }),
    });
  }

  // Join contributors for presence
  const contributors = [
    { id: 'alex-001', name: 'Alex', color: '#3d85c6', isSubject: true, lastSeen: Date.now(), isOnline: true },
    { id: 'marco-001', name: 'Marco', color: '#e07a5f', isSubject: false, lastSeen: Date.now(), isOnline: true },
    { id: 'sarah-001', name: 'Sarah', color: '#81b29a', isSubject: false, lastSeen: Date.now(), isOnline: true },
  ];

  for (const c of contributors) {
    await fetch(`${BASE_URL}/api/rooms/${ROOM_ID}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'join', payload: c }),
    });
  }

  console.log(`Seeded room "${ROOM_ID}" with ${events.length} events and ${contributors.length} contributors.`);
}

async function main() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  // Seed the demo room
  await seedRoom();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });

  // ── Screenshot 1: Landing page (hero) ──
  console.log('Capturing landing page hero...');
  const landingPage = await context.newPage();
  await landingPage.goto(BASE_URL, { waitUntil: 'networkidle' });
  await landingPage.waitForTimeout(1500);
  await landingPage.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'landing-page.png'),
  });
  console.log('  ✓ landing-page.png');

  // ── Screenshot 2: Narrative section (scroll down) ──
  console.log('Capturing narrative section...');
  // Scroll to the "How It Works" section to trigger whileInView animations
  await landingPage.evaluate(() => {
    const sections = document.querySelectorAll('section');
    // The narrative section is the second <section> (after the hero)
    if (sections.length >= 2) {
      sections[1].scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  });
  await landingPage.waitForTimeout(1500); // Wait for whileInView animations to play
  // Wait for images to load
  await landingPage.waitForFunction(() => {
    const imgs = document.querySelectorAll('img');
    return Array.from(imgs).every(img => img.complete && img.naturalWidth > 0);
  }, { timeout: 5000 }).catch(() => console.log('  ⚠ Some images may not have loaded'));
  await landingPage.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'landing-narrative.png'),
  });
  console.log('  ✓ landing-narrative.png');
  await landingPage.close();

  // ── Screenshot 3: Contributor modal ──
  console.log('Capturing contributor modal...');
  const modalPage = await context.newPage();
  await modalPage.goto(`${BASE_URL}/room/${ROOM_ID}`, { waitUntil: 'networkidle' });
  await modalPage.waitForTimeout(1000);
  await modalPage.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'contributor-modal.png'),
  });
  console.log('  ✓ contributor-modal.png');
  await modalPage.close();

  // ── Screenshot 4: Room with chat ──
  console.log('Capturing room with chat...');
  const roomPage = await context.newPage();
  await roomPage.addInitScript(() => {
    localStorage.setItem('contributor-id', 'alex-001');
    localStorage.setItem('contributor-name', 'Alex');
    localStorage.setItem('contributor-color', '#3d85c6');
    localStorage.setItem('contributor-is-subject', 'true');
  });
  await roomPage.goto(`${BASE_URL}/room/${ROOM_ID}`, { waitUntil: 'networkidle' });
  await roomPage.waitForTimeout(2500);
  await roomPage.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'room-chat.png'),
  });
  console.log('  ✓ room-chat.png');
  await roomPage.close();

  await browser.close();
  console.log('\nAll screenshots captured successfully.');
}

main().catch(console.error);
