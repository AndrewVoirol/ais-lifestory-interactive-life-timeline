/**
 * Capture screenshots for the LifeStory README.
 *
 * Usage: node scripts/capture-screenshots.mjs
 *
 * Produces:
 *   screenshots/landing-page.png      — above-the-fold hero
 *   screenshots/landing-narrative.png  — "How It Works" section with demo photos
 *   screenshots/contributor-modal.png  — room page with identity modal open
 *   screenshots/room-with-photos.png   — room with events that have photos attached
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots');
const ROOM_ID = 'demo-screenshots';

/** Read a demo photo and return a base64 data URL */
function photoToDataUrl(filename) {
  const filePath = path.join(process.cwd(), 'public', 'demo-photos', filename);
  const buf = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function seedRoom() {
  // Read actual demo photos as base64
  const schoolPhotoData = photoToDataUrl('childhood-school-photo.jpg');
  const birthdayData = photoToDataUrl('childhood-birthday.jpg');
  const roadtripAlexData = photoToDataUrl('roadtrip-alex-selfie.jpg');
  const roadtripMarcoData = photoToDataUrl('roadtrip-marco-backseat.jpg');
  const partyAlexData = photoToDataUrl('party-alex-group.jpg');
  const partyMarcoData = photoToDataUrl('party-marco-aftermath.jpg');

  const events = [
    {
      id: 'evt-birth',
      title: 'Born in San Francisco',
      description: 'Born at UCSF Medical Center in the heart of the city.',
      date: '1992',
      contributedBy: 'Alex',
      contributorColor: '#3d85c6',
      contributorId: 'alex-001',
    },
    {
      id: 'evt-school',
      title: 'School Picture Day',
      description: '3rd grade picture day at Lincoln Elementary. Mom picked out the blue polo.',
      date: '1998',
      contributedBy: 'Alex',
      contributorColor: '#3d85c6',
      contributorId: 'alex-001',
      photos: [
        {
          id: 'photo-school',
          dataUrl: schoolPhotoData,
          uploadedBy: 'Alex',
          uploadedByColor: '#3d85c6',
          caption: 'School picture day — 3rd grade',
          timestamp: Date.now() - 120000,
        },
      ],
    },
    {
      id: 'evt-birthday',
      title: 'Birthday Party at Home',
      description: "Alex's 6th birthday party in the backyard. Mom got a disposable camera for the occasion.",
      date: '1998',
      contributedBy: 'Sarah',
      contributorColor: '#81b29a',
      contributorId: 'sarah-001',
      photos: [
        {
          id: 'photo-bday',
          dataUrl: birthdayData,
          uploadedBy: 'Sarah',
          uploadedByColor: '#81b29a',
          caption: 'Birthday party — disposable camera',
          timestamp: Date.now() - 110000,
        },
      ],
      comments: [
        {
          id: 'cmt-bday',
          contributorName: 'Alex',
          contributorColor: '#3d85c6',
          content: "I completely forgot about this party! Mom still has that camera somewhere.",
          timestamp: Date.now() - 100000,
        },
      ],
    },
    {
      id: 'evt-roadtrip',
      title: 'Road Trip to Yosemite',
      description: 'Drove up Highway 120 with Marco. Stopped at every gas station. Got lost twice.',
      date: 'Summer 2015',
      contributedBy: 'Alex',
      contributorColor: '#3d85c6',
      contributorId: 'alex-001',
      photos: [
        {
          id: 'photo-road-alex',
          dataUrl: roadtripAlexData,
          uploadedBy: 'Alex',
          uploadedByColor: '#3d85c6',
          caption: 'The Instagram-worthy version',
          timestamp: Date.now() - 80000,
        },
        {
          id: 'photo-road-marco',
          dataUrl: roadtripMarcoData,
          uploadedBy: 'Marco',
          uploadedByColor: '#e07a5f',
          caption: 'The actual road trip experience',
          timestamp: Date.now() - 70000,
        },
      ],
      comments: [
        {
          id: 'cmt-road',
          contributorName: 'Marco',
          contributorColor: '#e07a5f',
          content: "You forgot to mention the 3 gas station burritos. I have photographic evidence.",
          timestamp: Date.now() - 60000,
          isCorrection: true,
        },
      ],
      corrections: [
        {
          contributorName: 'Marco',
          contributorColor: '#e07a5f',
          field: 'date',
          oldValue: 'Summer 2016',
          newValue: 'Summer 2015',
          timestamp: Date.now() - 60000,
        },
      ],
    },
    {
      id: 'evt-party',
      title: 'The Infamous House Party',
      description: "Alex remembers string lights and a great playlist. Marco remembers cleaning the kitchen until 4am.",
      date: 'New Year\'s 2019',
      contributedBy: 'Alex',
      contributorColor: '#3d85c6',
      contributorId: 'alex-001',
      photos: [
        {
          id: 'photo-party-alex',
          dataUrl: partyAlexData,
          uploadedBy: 'Alex',
          uploadedByColor: '#3d85c6',
          caption: 'Everyone at their best',
          timestamp: Date.now() - 40000,
        },
        {
          id: 'photo-party-marco',
          dataUrl: partyMarcoData,
          uploadedBy: 'Marco',
          uploadedByColor: '#e07a5f',
          caption: 'The version Alex tried to delete',
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

  console.log(`Seeded room "${ROOM_ID}" with ${events.length} events (with photos) and ${contributors.length} contributors.`);
}

async function main() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

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
  await landingPage.evaluate(() => {
    const sections = document.querySelectorAll('section');
    if (sections.length >= 2) {
      sections[1].scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  });
  await landingPage.waitForTimeout(1500);
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

  // ── Screenshot 4: Room with photos on timeline ──
  console.log('Capturing room with photos...');
  const roomPage = await context.newPage();
  await roomPage.addInitScript(() => {
    localStorage.setItem('contributor-id', 'alex-001');
    localStorage.setItem('contributor-name', 'Alex');
    localStorage.setItem('contributor-color', '#3d85c6');
    localStorage.setItem('contributor-is-subject', 'true');
  });
  await roomPage.goto(`${BASE_URL}/room/${ROOM_ID}`, { waitUntil: 'networkidle' });
  await roomPage.waitForTimeout(3000);

  // Click on Timeline tab to show it's populated with photos
  const timelineTab = roomPage.locator('button:has-text("Timeline")').first();
  if (await timelineTab.isVisible()) {
    // Desktop: already split view — both chat and timeline visible
  }

  // Wait for photo thumbnails to render (base64 images)
  await roomPage.waitForTimeout(1000);
  await roomPage.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'room-with-photos.png'),
  });
  console.log('  ✓ room-with-photos.png');
  await roomPage.close();

  await browser.close();
  console.log('\nAll screenshots captured successfully.');
}

main().catch(console.error);
