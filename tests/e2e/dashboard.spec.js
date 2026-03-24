import { test, expect } from '@playwright/test';
import { join } from 'path';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SAMPLE_NDJSON = [
  { user_login: 'alice', day: '2025-01-01', code_generation_activity_count: 50, code_acceptance_activity_count: 30, loc_added_sum: 300, loc_deleted_sum: 50, active_time_minutes: 60, totals_by_ide: [{ ide: 'vscode', code_generation_activity_count: 50 }], totals_by_feature: [{ feature: 'code_completion', code_generation_activity_count: 50 }], totals_by_language_feature: [{ language: 'python', code_generation_activity_count: 50 }], totals_by_language_model: [], totals_by_model_feature: [], model: 'gpt-4' },
  { user_login: 'bob',   day: '2025-01-01', code_generation_activity_count: 20, code_acceptance_activity_count: 10, loc_added_sum: 100, loc_deleted_sum: 20, active_time_minutes: 30, totals_by_ide: [{ ide: 'jetbrains', code_generation_activity_count: 20 }], totals_by_feature: [{ feature: 'agent', code_generation_activity_count: 20 }], totals_by_language_feature: [{ language: 'typescript', code_generation_activity_count: 20 }], totals_by_language_model: [], totals_by_model_feature: [], model: 'gpt-4' },
  { user_login: 'alice', day: '2025-01-02', code_generation_activity_count: 80, code_acceptance_activity_count: 60, loc_added_sum: 500, loc_deleted_sum: 100, active_time_minutes: 90, totals_by_ide: [{ ide: 'vscode', code_generation_activity_count: 80 }], totals_by_feature: [{ feature: 'code_completion', code_generation_activity_count: 80 }], totals_by_language_feature: [{ language: 'python', code_generation_activity_count: 80 }], totals_by_language_model: [], totals_by_model_feature: [], model: 'gpt-4' }
].map(r => JSON.stringify(r)).join('\n');

async function uploadSampleData(page) {
  const fileInput = page.locator('#fileInput');
  const blob = new Blob([SAMPLE_NDJSON], { type: 'application/x-ndjson' });
  await fileInput.setInputFiles({
    name: 'sample.ndjson',
    mimeType: 'application/x-ndjson',
    buffer: Buffer.from(SAMPLE_NDJSON)
  });
}

// ── Upload & Dashboard ────────────────────────────────────────────────────────

test.describe('Upload screen', () => {
  test('shows upload zone on initial load', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.upload-zone')).toBeVisible();
    await expect(page.locator('#dashboard')).toHaveClass(/hidden/);
  });

  test('upload zone accepts file and shows dashboard', async ({ page }) => {
    await page.goto('/');
    await uploadSampleData(page);
    await expect(page.locator('#dashboard')).not.toHaveClass(/hidden/, { timeout: 10_000 });
  });
});

// ── KPIs ──────────────────────────────────────────────────────────────────────

test.describe('KPI cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await uploadSampleData(page);
    await expect(page.locator('#dashboard')).not.toHaveClass(/hidden/, { timeout: 10_000 });
  });

  test('shows Total Users KPI', async ({ page }) => {
    await expect(page.locator('#kpisContainer')).toContainText('2');
  });

  test('KPI section labels are visible', async ({ page }) => {
    await expect(page.locator('#kpisContainer')).toContainText('Copilot Activity');
    await expect(page.locator('#kpisContainer')).toContainText('Lines of Code');
    await expect(page.locator('#kpisContainer')).toContainText('Feature Adoption');
  });
});

// ── Filters ───────────────────────────────────────────────────────────────────

test.describe('Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await uploadSampleData(page);
    await expect(page.locator('#dashboard')).not.toHaveClass(/hidden/, { timeout: 10_000 });
  });

  test('user filter dropdown is populated', async ({ page }) => {
    const options = await page.locator('#userFilter option').allTextContents();
    expect(options).toContain('alice');
    expect(options).toContain('bob');
  });

  test('IDE filter dropdown is populated', async ({ page }) => {
    const options = await page.locator('#ideFilter option').allTextContents();
    expect(options).toContain('vscode');
    expect(options).toContain('jetbrains');
  });

  test('filtering by user updates KPI display', async ({ page }) => {
    await page.selectOption('#userFilter', 'alice');
    await page.click('button:has-text("Apply")');
    // After filter, only alice's data shows — bob's data excluded
    await expect(page.locator('#kpisContainer')).toContainText('1');
  });
});

// ── Insights ──────────────────────────────────────────────────────────────────

test.describe('Insights panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await uploadSampleData(page);
    await expect(page.locator('#dashboard')).not.toHaveClass(/hidden/, { timeout: 10_000 });
  });

  test('insights panel is visible', async ({ page }) => {
    await expect(page.locator('#insightsPanel')).toBeVisible();
  });

  test('insights panel has export buttons', async ({ page }) => {
    const panel = page.locator('#insightsPanel');
    await expect(panel.locator('button:has-text("CSV")')).toBeVisible();
    await expect(panel.locator('button:has-text("PNG")')).toBeVisible();
  });
});

// ── Table ─────────────────────────────────────────────────────────────────────

test.describe('Data Explorer table', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await uploadSampleData(page);
    await expect(page.locator('#dashboard')).not.toHaveClass(/hidden/, { timeout: 10_000 });
  });

  test('table rows are visible after upload', async ({ page }) => {
    const rows = page.locator('#tableBody tr');
    await expect(rows).not.toHaveCount(0);
  });

  test('table shows both users', async ({ page }) => {
    await expect(page.locator('#tableBody')).toContainText('alice');
    await expect(page.locator('#tableBody')).toContainText('bob');
  });
});

// ── Export menu ───────────────────────────────────────────────────────────────

test.describe('Export menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await uploadSampleData(page);
    await expect(page.locator('#dashboard')).not.toHaveClass(/hidden/, { timeout: 10_000 });
  });

  test('export dropdown is initially hidden', async ({ page }) => {
    await expect(page.locator('#exportMenu')).toHaveClass(/hidden/);
  });

  test('clicking Export button shows dropdown', async ({ page }) => {
    await page.click('#exportMenuTrigger');
    await expect(page.locator('#exportMenu')).not.toHaveClass(/hidden/);
  });

  test('export menu contains expected options', async ({ page }) => {
    await page.click('#exportMenuTrigger');
    await expect(page.locator('#exportMenu')).toContainText('Export Data CSV');
    await expect(page.locator('#exportMenu')).toContainText('Export Consolidated NDJSON');
  });
});
