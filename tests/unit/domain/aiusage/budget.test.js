import { describe, it, expect } from 'vitest';
import { computeAIUsageBudget, generateBudgetInsights, deriveDefaultLicenses } from '../../../../app/domain/aiusage/budget.js';

const CONFIG = { NEAR_QUOTA_THRESHOLD: 0.8 };

const rec = over => ({
  date: '2026-06-01', username: 'alice', sku: 'copilot_ai_credit',
  model: 'Claude Sonnet 4.6', baseModel: 'Claude Sonnet 4.6', isAuto: false,
  quantity: 100, grossAmount: 1, netAmount: 0, monthlyQuota: 1000,
  organization: 'Org-A', costCenter: 'P&T', ...over
});

describe('budget confidence / overage / multi-month', () => {
  it('marks single-day data as low confidence', () => {
    const b = computeAIUsageBudget([rec({ date: '2026-06-01' })]);
    expect(b.enterprise.confidence).toBe('low');
  });

  it('marks a ≥7-day window as ok confidence', () => {
    const b = computeAIUsageBudget([
      rec({ date: '2026-06-01' }), rec({ date: '2026-06-08' }), // span 8 days
    ]);
    expect(b.enterprise.confidence).toBe('ok');
  });

  it('computes overage and projected overage', () => {
    // 1 day, quota 1000, used 100 → projected 3000 → projectedOverage 2000
    const b = computeAIUsageBudget([rec({ quantity: 100, monthlyQuota: 1000 })]);
    expect(b.enterprise.overage).toBe(0);            // 100 < 1000 so far
    expect(b.enterprise.projectedOverage).toBeCloseTo(2000);
  });

  it('tracks net billed separately from gross', () => {
    const b = computeAIUsageBudget([rec({ grossAmount: 5, netAmount: 2 })]);
    expect(b.enterprise.gross).toBe(5);
    expect(b.enterprise.net).toBe(2);
  });

  it('computes billable overage per-seat, NOT from a pooled enterprise budget', () => {
    // 8-day window (ok confidence). Two users, big shared allowance, but usage is
    // lopsided: alice blows her quota, bob barely uses his.
    const cfg = { enabled: true, orgs: { 'Org-A': [{ quota: 1000, seats: 2 }] } }; // pool = 2000
    const b = computeAIUsageBudget([
      rec({ username: 'alice', organization: 'Org-A', date: '2026-06-01', quantity: 400, monthlyQuota: 1000 }),
      rec({ username: 'alice', organization: 'Org-A', date: '2026-06-08', quantity: 400, monthlyQuota: 1000 }),
      rec({ username: 'bob',   organization: 'Org-A', date: '2026-06-01', quantity: 10,  monthlyQuota: 1000 }),
      rec({ username: 'bob',   organization: 'Org-A', date: '2026-06-08', quantity: 10,  monthlyQuota: 1000 }),
    ], cfg);
    // factor over 8 days = 1 + 22/8 = 3.75. alice: 800*3.75=3000 (>1000 quota → 2000 over). bob: 20*3.75=75 (under).
    // Enterprise consumed 820, projected 3075, pool budget 2000 → pool overage would be 1075.
    // But per-seat billable overage = alice's 2000 only (bob contributes 0).
    expect(b.enterprise.billableProjectedOverage).toBeCloseTo(2000);
    expect(b.enterprise.projected).toBeCloseTo(3075);
    expect(b.byOrg['Org-A'].billableProjectedOverage).toBeCloseTo(2000);
  });

  it('surfaces a Projected Overage Charges insight even when total is under the summed allowance', () => {
    const cfg = { enabled: true, orgs: { 'Org-A': [{ quota: 1000, seats: 10 }] } }; // huge pool
    const b = computeAIUsageBudget([
      rec({ username: 'alice', organization: 'Org-A', date: '2026-06-01', quantity: 400, monthlyQuota: 1000 }),
      rec({ username: 'alice', organization: 'Org-A', date: '2026-06-08', quantity: 400, monthlyQuota: 1000 }),
    ], cfg);
    expect(b.enterprise.projectedPct).toBeLessThan(1); // under the 10k pool
    const ins = generateBudgetInsights(b, { NEAR_QUOTA_THRESHOLD: 0.8 });
    expect(ins.find(i => i.title === 'Projected Overage Charges')).toBeTruthy();
  });

  it('flags multi-month exports', () => {
    const b = computeAIUsageBudget([rec({ date: '2026-06-30' }), rec({ date: '2026-07-01' })]);
    expect(b.enterprise.multiMonth).toBe(true);
    expect(b.enterprise.monthsSpanned).toBe(2);
  });

  it('downgrades low-confidence insights to info and adds a multi-month warning', () => {
    const b = computeAIUsageBudget([rec({ date: '2026-06-01', quantity: 100, monthlyQuota: 1000 })]);
    const ins = generateBudgetInsights(b, { NEAR_QUOTA_THRESHOLD: 0.8 });
    const ent = ins.find(i => i.title === 'Enterprise Budget Projection');
    expect(ent.type).toBe('info'); // not 'error' despite 300% projection — too few days
    expect(ent.content).toMatch(/Preliminary/);
  });
});

describe('computeAIUsageBudget', () => {
  it('returns null for no records', () => {
    expect(computeAIUsageBudget([])).toBeNull();
  });

  it('sums enterprise budget from distinct user quotas', () => {
    const b = computeAIUsageBudget([
      rec({ username: 'alice', monthlyQuota: 1000 }),
      rec({ username: 'alice', date: '2026-06-02', monthlyQuota: 1000 }), // same user, not double counted
      rec({ username: 'bob', monthlyQuota: 500 }),
    ]);
    expect(b.enterprise.budget).toBe(1500);
    expect(b.enterprise.users).toBe(2);
  });

  it('projects month-end via run rate (consumed + rate × remaining days)', () => {
    // Single day 2026-06-01: 1 of 30 days observed, 29 remaining.
    // consumed 100, rate 100/day → projected = 100 + 100*29 = 3000.
    const b = computeAIUsageBudget([rec({ quantity: 100, monthlyQuota: 1000 })]);
    expect(b.enterprise.daysInMonth).toBe(30);
    expect(b.enterprise.daysObserved).toBe(1);
    expect(b.enterprise.remainingDays).toBe(29);
    expect(b.enterprise.projected).toBeCloseTo(3000);
    expect(b.enterprise.projectedPct).toBeCloseTo(3.0); // 300% of 1000 budget
  });

  it('uses calendar span for daysObserved across multiple days', () => {
    const b = computeAIUsageBudget([
      rec({ date: '2026-06-01', quantity: 100 }),
      rec({ date: '2026-06-03', quantity: 100 }), // span = 3 days inclusive
    ]);
    expect(b.enterprise.daysObserved).toBe(3);
    expect(b.enterprise.consumed).toBe(200);
    // rate = 200/3, remaining = 30 - 3 = 27 → projected = 200 + (200/3)*27 = 2000
    expect(b.enterprise.projected).toBeCloseTo(2000);
  });

  it('computes per-org budget from distinct member quotas', () => {
    const b = computeAIUsageBudget([
      rec({ username: 'alice', organization: 'Org-A', monthlyQuota: 1000, quantity: 100 }),
      rec({ username: 'bob', organization: 'Org-B', monthlyQuota: 500, quantity: 50 }),
    ]);
    expect(b.byOrg['Org-A'].budget).toBe(1000);
    expect(b.byOrg['Org-A'].consumed).toBe(100);
    expect(b.byOrg['Org-B'].budget).toBe(500);
    expect(b.byOrg['Org-A'].users).toBe(1);
  });

  it('computes per-user lines', () => {
    const b = computeAIUsageBudget([rec({ username: 'alice', quantity: 100, monthlyQuota: 1000 })]);
    expect(b.byUser.alice.consumed).toBe(100);
    expect(b.byUser.alice.budget).toBe(1000);
    expect(b.byUser.alice.consumedPct).toBeCloseTo(0.1);
  });

  it('falls back to Unattributed org for blank organization', () => {
    const b = computeAIUsageBudget([rec({ organization: '' })]);
    expect(b.byOrg.Unattributed).toBeDefined();
  });
});

describe('generateBudgetInsights', () => {
  it('returns [] for null budget', () => {
    expect(generateBudgetInsights(null, CONFIG)).toEqual([]);
  });

  it('flags an enterprise projected overage as an error (with enough observed days)', () => {
    // 8-day span (ok confidence), heavy usage → projected over budget
    const b = computeAIUsageBudget([
      rec({ username: 'alice', date: '2026-06-01', quantity: 200, monthlyQuota: 1000 }),
      rec({ username: 'alice', date: '2026-06-08', quantity: 200, monthlyQuota: 1000 }),
    ]);
    expect(b.enterprise.confidence).toBe('ok');
    const ins = generateBudgetInsights(b, CONFIG);
    const ent = ins.find(i => i.title === 'Enterprise Budget Projection');
    expect(ent.type).toBe('error');
    expect(ent.content).toMatch(/over by/);
  });

  it('lists users projected over quota', () => {
    const b = computeAIUsageBudget([rec({ username: 'heavy', quantity: 200, monthlyQuota: 1000 })]);
    const ins = generateBudgetInsights(b, CONFIG);
    expect(ins.find(i => i.title === 'Users Projected Over Quota').content).toMatch(/heavy/);
  });

  it('marks a low-usage enterprise as on track (success)', () => {
    // (kept below)
  });
});

describe('deriveDefaultLicenses', () => {
  it('groups one row per quota tier per org, seats = active users', () => {
    const cfg = deriveDefaultLicenses([
      rec({ username: 'a', organization: 'Org-A', monthlyQuota: 3900 }),
      rec({ username: 'b', organization: 'Org-A', monthlyQuota: 3900 }),
      rec({ username: 'c', organization: 'Org-B', monthlyQuota: 1900 }),
    ]);
    expect(cfg.orgs['Org-A']).toEqual([{ name: '3,900-credit tier', quota: 3900, seats: 2 }]);
    expect(cfg.orgs['Org-B']).toEqual([{ name: '1,900-credit tier', quota: 1900, seats: 1 }]);
  });
});

describe('computeAIUsageBudget with license config', () => {
  it('uses configured seats × quota for org/enterprise budget', () => {
    const records = [
      rec({ username: 'a', organization: 'Org-A', monthlyQuota: 3900, quantity: 100 }),
    ];
    const cfg = { enabled: true, orgs: { 'Org-A': [{ name: 'Enterprise', quota: 3900, seats: 50 }] } };
    const b = computeAIUsageBudget(records, cfg);
    expect(b.byOrg['Org-A'].budget).toBe(195000); // 50 × 3900, not 1 active user
    expect(b.enterprise.budget).toBe(195000);
    expect(b.enterprise.seats).toBe(50);
    expect(b.enterprise.source).toBe('licenses');
    // individual budget still from the user's own CSV quota
    expect(b.byUser.a.budget).toBe(3900);
  });

  it('falls back to active-user budget when config is disabled', () => {
    const records = [rec({ username: 'a', organization: 'Org-A', monthlyQuota: 3900 })];
    const cfg = { enabled: false, orgs: { 'Org-A': [{ quota: 3900, seats: 50 }] } };
    const b = computeAIUsageBudget(records, cfg);
    expect(b.enterprise.budget).toBe(3900); // 1 active user, config ignored
    expect(b.enterprise.source).toBe('active');
  });

  it('includes config-only orgs (tiers the CSV does not show)', () => {
    const records = [rec({ username: 'a', organization: 'Org-A', monthlyQuota: 3900, quantity: 10 })];
    const cfg = { enabled: true, orgs: {
      'Org-A': [{ quota: 3900, seats: 10 }],
      'Org-C': [{ quota: 1900, seats: 5 }], // not present in records
    } };
    const b = computeAIUsageBudget(records, cfg);
    expect(b.byOrg['Org-C'].budget).toBe(9500); // 5 × 1900
    expect(b.byOrg['Org-C'].consumed).toBe(0);
    expect(b.enterprise.budget).toBe(39000 + 9500);
  });

  it('sums multiple license tiers within one org', () => {
    const records = [rec({ username: 'a', organization: 'Org-A', monthlyQuota: 3900 })];
    const cfg = { enabled: true, orgs: { 'Org-A': [
      { quota: 3900, seats: 10 }, { quota: 1900, seats: 20 },
    ] } };
    const b = computeAIUsageBudget(records, cfg);
    expect(b.byOrg['Org-A'].budget).toBe(10 * 3900 + 20 * 1900);
    expect(b.byOrg['Org-A'].seats).toBe(30);
  });
});

describe('budget low-usage success case', () => {
  it('marks a low-usage enterprise as on track (success)', () => {
    // consumed 1/day of a 1000 budget across full span → tiny projection
    const b = computeAIUsageBudget([
      rec({ date: '2026-06-01', quantity: 1, monthlyQuota: 100000 }),
      rec({ date: '2026-06-30', quantity: 1, monthlyQuota: 100000 }),
    ]);
    const ent = generateBudgetInsights(b, CONFIG).find(i => i.title === 'Enterprise Budget Projection');
    expect(ent.type).toBe('success');
  });
});
