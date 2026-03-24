import { test, expect } from '@playwright/test';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SAMPLE_NDJSON = [
  { user_login: 'alice', day: '2025-01-01', code_generation_activity_count: 50, code_acceptance_activity_count: 30, loc_added_sum: 300, loc_deleted_sum: 50, active_time_minutes: 60, totals_by_ide: [{ ide: 'vscode', code_generation_activity_count: 50 }], totals_by_feature: [{ feature: 'code_completion', code_generation_activity_count: 50 }], totals_by_language_feature: [{ language: 'python', code_generation_activity_count: 50 }], totals_by_language_model: [{ language: 'python', model: 'gpt-4o', code_generation_activity_count: 50 }], totals_by_model_feature: [] },
  { user_login: 'bob',   day: '2025-01-01', code_generation_activity_count: 20, code_acceptance_activity_count: 10, loc_added_sum: 100, loc_deleted_sum: 20, active_time_minutes: 30, totals_by_ide: [{ ide: 'jetbrains', code_generation_activity_count: 20 }], totals_by_feature: [{ feature: 'agent_edit', code_generation_activity_count: 20 }], totals_by_language_feature: [{ language: 'typescript', code_generation_activity_count: 20 }], totals_by_language_model: [{ language: 'typescript', model: 'claude-3.5-sonnet', code_generation_activity_count: 20 }], totals_by_model_feature: [] },
  { user_login: 'alice', day: '2025-01-02', code_generation_activity_count: 80, code_acceptance_activity_count: 60, loc_added_sum: 500, loc_deleted_sum: 100, active_time_minutes: 90, totals_by_ide: [{ ide: 'vscode', code_generation_activity_count: 80 }], totals_by_feature: [{ feature: 'code_completion', code_generation_activity_count: 80 }], totals_by_language_feature: [{ language: 'python', code_generation_activity_count: 80 }], totals_by_language_model: [{ language: 'python', model: 'gpt-4o', code_generation_activity_count: 80 }], totals_by_model_feature: [] }
].map(r => JSON.stringify(r)).join('\n');

async function uploadSampleData(page) {
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles({
    name: 'sample.ndjson',
    mimeType: 'application/x-ndjson',
    buffer: Buffer.from(SAMPLE_NDJSON)
  });
}

async function waitForDashboard(page) {
  // "Add Files" button only appears in the dashboard header after upload
  await expect(page.getByRole('button', { name: /Add Files/ })).toBeVisible({ timeout: 10_000 });
}

// ── Upload screen ─────────────────────────────────────────────────────────────

test.describe('Upload screen', () => {
  test('shows upload zone on initial load', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.upload-zone')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Select Files' })).toBeVisible();
  });

  test('upload zone accepts file and transitions to dashboard', async ({ page }) => {
    await page.goto('/');
    await uploadSampleData(page);
    await waitForDashboard(page);
    // Upload zone is gone, dashboard header is visible
    await expect(page.locator('.upload-zone')).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Add Files/ })).toBeVisible();
  });
});

// ── KPIs ──────────────────────────────────────────────────────────────────────

test.describe('KPI cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await uploadSampleData(page);
    await waitForDashboard(page);
  });

  test('shows correct total user count', async ({ page }) => {
    // subtitle text is unique — "2" alone matches too many elements
    await expect(page.getByText('Total Users', { exact: true })).toBeVisible();
    await expect(page.getByText('Unique users in date range')).toBeVisible();
  });

  test('KPI section headings are visible', async ({ page }) => {
    await expect(page.getByText('Activity', { exact: true })).toBeVisible();
    await expect(page.getByText('Lines of Code', { exact: true })).toBeVisible();
    await expect(page.getByText('Feature Adoption', { exact: true })).toBeVisible();
  });

  test('acceptance rate KPI is visible', async ({ page }) => {
    await expect(page.getByText('Acceptance Rate', { exact: true })).toBeVisible();
  });
});

// ── Filters ───────────────────────────────────────────────────────────────────

test.describe('Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await uploadSampleData(page);
    await waitForDashboard(page);
  });

  test('user filter dropdown is populated', async ({ page }) => {
    const userSelect = page.getByRole('combobox').filter({ hasText: /All Users/ });
    await expect(userSelect).toBeVisible();
    const options = await userSelect.locator('option').allTextContents();
    expect(options).toContain('alice');
    expect(options).toContain('bob');
  });

  test('IDE filter dropdown is populated', async ({ page }) => {
    const ideSelect = page.getByRole('combobox').filter({ hasText: /All IDEs/ });
    await expect(ideSelect).toBeVisible();
    const options = await ideSelect.locator('option').allTextContents();
    expect(options).toContain('vscode');
    expect(options).toContain('jetbrains');
  });

  test('language filter dropdown is populated', async ({ page }) => {
    const langSelect = page.getByRole('combobox').filter({ hasText: /All Languages/ });
    await expect(langSelect).toBeVisible();
    const options = await langSelect.locator('option').allTextContents();
    expect(options).toContain('python');
    expect(options).toContain('typescript');
  });

  test('filtering by user updates the record count', async ({ page }) => {
    const userSelect = page.getByRole('combobox').filter({ hasText: /All Users/ });
    await userSelect.selectOption('alice');
    // alice has 2 records, bob has 1 — table should now only show alice's rows
    await expect(page.getByRole('table')).toContainText('alice');
    await expect(page.getByRole('table')).not.toContainText('bob');
  });
});

// ── Insights ──────────────────────────────────────────────────────────────────

test.describe('Insights panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await uploadSampleData(page);
    await waitForDashboard(page);
  });

  test('insights section heading is visible', async ({ page }) => {
    await expect(page.getByText('Insights & Anomalies')).toBeVisible();
  });

  test('power users insight is generated', async ({ page }) => {
    await expect(page.getByText('Power Users')).toBeVisible();
  });
});

// ── Data table ────────────────────────────────────────────────────────────────

test.describe('Data Explorer table', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await uploadSampleData(page);
    await waitForDashboard(page);
  });

  test('table rows are visible after upload', async ({ page }) => {
    const rows = page.getByRole('table').getByRole('row');
    // header row + 3 data rows
    await expect(rows).toHaveCount(4);
  });

  test('table shows both users', async ({ page }) => {
    await expect(page.getByRole('table')).toContainText('alice');
    await expect(page.getByRole('table')).toContainText('bob');
  });
});

// ── Export menu ───────────────────────────────────────────────────────────────

test.describe('Export menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await uploadSampleData(page);
    await waitForDashboard(page);
  });

  test('export dropdown opens on click', async ({ page }) => {
    await page.getByRole('button', { name: /Export/ }).click();
    await expect(page.getByText('Export Data CSV')).toBeVisible();
    await expect(page.getByText('Export Consolidated NDJSON')).toBeVisible();
  });

  test('export dropdown closes when clicking outside', async ({ page }) => {
    await page.getByRole('button', { name: /Export/ }).click();
    await expect(page.getByText('Export Data CSV')).toBeVisible();
    await page.click('body');
    await expect(page.getByText('Export Data CSV')).not.toBeVisible();
  });
});
