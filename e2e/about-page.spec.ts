import { expect, test } from '@playwright/test';

test('About page credits founder, technical builder, and managing partner accurately', async ({ page }) => {
  await page.goto('/about');

  await expect(page.getByRole('heading', { level: 1, name: 'Connecting education with citizenship.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nazim M. Sandh' })).toBeVisible();
  await expect(page.getByText('Founder and Initiator', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'nazimsandhbehappy@gmail.com' })).toHaveAttribute(
    'href',
    'mailto:nazimsandhbehappy@gmail.com'
  );
  await expect(page.getByRole('heading', { name: 'Visesh Akbari' })).toBeVisible();
  await expect(page.getByText('Developer', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/laluboom');
  await expect(page.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/viseshakbari/');

  await expect(page.getByRole('heading', { name: 'Yashvi Dalsaniya' })).toBeVisible();
  await expect(page.getByText('Managing Partner', { exact: true })).toBeVisible();
  await expect(page.getByText(/microbiology student/i)).toBeVisible();
  await expect(page.getByText(/organisational development/i)).toBeVisible();
  await expect(page.getByText(/developed-country vision/i)).toBeVisible();

  await expect(page.getByText('Single-browser simulation')).toBeVisible();

  for (const name of ['Nazim M. Sandh', 'Visesh Akbari', 'Yashvi Dalsaniya']) {
    const portrait = page.getByRole('img', { name: `Portrait of ${name}` });
    await expect(portrait).toBeVisible();
    await expect.poll(() => portrait.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  }

  const nazimCard = page.locator('article').filter({ hasText: 'Nazim M. Sandh' });
  const viseshCard = page.locator('article').filter({ hasText: 'Visesh Akbari' });
  await expect(viseshCard.getByText(/founder|initiated|idea/i)).toHaveCount(0);

  const yashviCard = page.locator('article').filter({ hasText: 'Yashvi Dalsaniya' });
  await expect(yashviCard.getByText(/founder|developed the site|founded the idea/i)).toHaveCount(0);

  // Desktop layout assertions: no horizontal overflow, Nazim & Visesh side-by-side, Yashvi below them with portrait & bio side-by-side
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)).toBe(true);

  const nazimBox = await nazimCard.boundingBox();
  const viseshBox = await viseshCard.boundingBox();
  const yashviBox = await yashviCard.boundingBox();
  expect(nazimBox).not.toBeNull();
  expect(viseshBox).not.toBeNull();
  expect(yashviBox).not.toBeNull();

  if (nazimBox && viseshBox && yashviBox) {
    // Nazim and Visesh are in the same top row
    expect(Math.abs(nazimBox.y - viseshBox.y)).toBeLessThan(15);
    expect(viseshBox.x).toBeGreaterThan(nazimBox.x);
    // Yashvi is in a separate row below them
    expect(yashviBox.y).toBeGreaterThan(nazimBox.y + nazimBox.height - 15);
  }

  // Yashvi's 16:9 portrait and biography are beside each other on desktop
  const yashviPortrait = page.getByRole('img', { name: 'Portrait of Yashvi Dalsaniya' });
  const yashviPortraitBox = await yashviPortrait.boundingBox();
  const yashviBio = yashviCard.getByText(/microbiology student/i);
  const yashviBioBox = await yashviBio.boundingBox();
  expect(yashviPortraitBox).not.toBeNull();
  expect(yashviBioBox).not.toBeNull();

  if (yashviPortraitBox && yashviBioBox) {
    expect(yashviBioBox.x).toBeGreaterThan(yashviPortraitBox.x);
    // 16:9 landscape aspect ratio (approximately 16/9 = 1.777)
    const ratio = yashviPortraitBox.width / yashviPortraitBox.height;
    expect(ratio).toBeGreaterThan(1.7);
    expect(ratio).toBeLessThan(1.85);
  }

  // With gratitude section
  await expect(page.getByRole('heading', { name: 'With gratitude' })).toBeVisible();
  await expect(page.getByText('Shri Dadubhai Sandhar')).toBeVisible();
  await expect(
    page.locator('section[aria-labelledby="gratitude-heading"]').getByText('Visesh Akbari')
  ).toBeVisible();
  await expect(page.getByText('Demo institution, not an official partnership')).toBeVisible();
});

test('About page is reachable from welcome and the utilities navigation', async ({ page }) => {
  await page.goto('/welcome');
  await page.getByRole('link', { name: /About the people behind JanSahabhag/i }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('navigation', { name: 'Utilities Navigation' }).getByRole('link', { name: 'About Us' })).toBeVisible();
});

test('About page portraits and content fit a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'Visesh Akbari' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Yashvi Dalsaniya' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'nazimsandhbehappy@gmail.com' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'With gratitude' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)).toBe(true);

  // Whole portrait visible and loaded on phone
  for (const name of ['Nazim M. Sandh', 'Visesh Akbari', 'Yashvi Dalsaniya']) {
    const portrait = page.getByRole('img', { name: `Portrait of ${name}` });
    await expect(portrait).toBeVisible();
    await expect.poll(() => portrait.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  }

  // On phone screen, Yashvi's portrait and biography are stacked vertically
  const yashviCard = page.locator('article').filter({ hasText: 'Yashvi Dalsaniya' });
  const yashviPortrait = page.getByRole('img', { name: 'Portrait of Yashvi Dalsaniya' });
  const yashviPortraitBox = await yashviPortrait.boundingBox();
  const yashviBio = yashviCard.getByText(/microbiology student/i);
  const yashviBioBox = await yashviBio.boundingBox();
  expect(yashviPortraitBox).not.toBeNull();
  expect(yashviBioBox).not.toBeNull();

  if (yashviPortraitBox && yashviBioBox) {
    expect(yashviBioBox.y).toBeGreaterThan(yashviPortraitBox.y + yashviPortraitBox.height - 5);
  }
});
