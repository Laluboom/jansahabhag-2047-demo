import { expect, test } from '@playwright/test';

test('About page credits founder and technical builder accurately', async ({ page }) => {
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
  await expect(page.getByText('Single-browser simulation')).toBeVisible();

  for (const name of ['Nazim M. Sandh', 'Visesh Akbari']) {
    const portrait = page.getByRole('img', { name: `Portrait of ${name}` });
    await expect(portrait).toBeVisible();
    await expect.poll(() => portrait.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  }

  await expect(page.getByText(/Visesh.*founder|Visesh.*initiated|Visesh.*idea/i)).toHaveCount(0);
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
  await expect(page.getByRole('link', { name: 'nazimsandhbehappy@gmail.com' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)).toBe(true);
});
