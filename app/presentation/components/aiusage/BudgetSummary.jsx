import React, { useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { KpiCard } from '../kpi/KpiCard.jsx';
import { SectionDivider } from '../shared/SectionDivider.jsx';
import { formatCredits, formatCurrency } from '../../../../common/utils/format.js';
import { captureElementAsPng } from '../../../../common/utils/download.js';
import { CONFIG } from '../../../domain/config/constants.js';

const usd = credits => formatCurrency(credits * CONFIG.CREDIT_USD);

export function BudgetSummary() {
  const { aiUsageBudget } = useApp();
  const ref = useRef(null);
  if (!aiUsageBudget) return null;

  const { enterprise, byOrg, byUser } = aiUsageBudget;
  const near = CONFIG.NEAR_QUOTA_THRESHOLD;

  const orgsOver = Object.values(byOrg).filter(o => o.budget > 0 && o.projectedPct > 1).length;
  const orgsAtRisk = Object.values(byOrg).filter(o => o.budget > 0 && o.projectedPct >= near && o.projectedPct <= 1).length;
  const usersOver = enterprise.usersOverAllowance;
  const low = enterprise.confidence === 'low';
  // Overage is pooled at the billing entity level: it accrues only once total
  // consumption exceeds the total included allowance.
  const projOverageCr = enterprise.projectedOverage;
  const willOverage = projOverageCr > 0;

  // With too few observed days the projection isn't trustworthy — don't raise a
  // red alarm; show a neutral "preliminary" pill instead.
  const status = low
    ? { label: `PRELIMINARY · ${enterprise.daysObserved}D`, color: 'var(--text-2)', bg: 'var(--surface-2)', border: 'var(--border)' }
    : willOverage
      ? { label: 'OVERAGE PROJECTED', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)' }
      : enterprise.projectedPct >= near
        ? { label: 'AT RISK', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' }
        : { label: 'ON TRACK', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)' };

  const projColor = low ? 'var(--text-2)' : enterprise.projectedPct > 1 ? '#ef4444' : undefined;

  return (
    <div ref={ref}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem' }}>
        <SectionDivider icon="gauge" label="Budget & Burn Rate" />
        <div style={{ display:'flex',gap:'0.5rem',alignItems:'center' }}>
          <span style={{ fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.06em',padding:'0.2rem 0.6rem',borderRadius:'9999px',color:status.color,background:status.bg,border:`1px solid ${status.border}` }}>
            {status.label}
          </span>
          <button className="btn-secondary" style={{ fontSize:'0.72rem' }} onClick={() => captureElementAsPng(ref.current, 'budget-summary.png')}>PNG</button>
        </div>
      </div>

      {(low || enterprise.multiMonth) && (
        <div style={{ marginBottom:'0.9rem',padding:'0.6rem 0.9rem',borderRadius:'8px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.25)',fontSize:'0.75rem',color:'var(--text-2)',lineHeight:1.5 }}>
          {enterprise.multiMonth && <span><strong style={{ color:'#f59e0b' }}>Multi-month export:</strong> data spans {enterprise.monthsSpanned} months — the monthly budget projection assumes a single month and is unreliable. Filter to one month for an accurate burn rate. </span>}
          {low && <span><strong style={{ color:'#f59e0b' }}>Preliminary projection:</strong> only {enterprise.daysObserved} day{enterprise.daysObserved === 1 ? '' : 's'} observed (need ≥{CONFIG.MIN_PROJECTION_DAYS} to trust the run rate). Treat month-end figures as a rough early signal, not a forecast.</span>}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
        <KpiCard
          label="Credits Allotted"
          value={formatCredits(enterprise.budget)}
          subtitle={enterprise.source === 'licenses'
            ? `${usd(enterprise.budget)} allocated · ${enterprise.users} active of ${enterprise.seats} licensed seats`
            : `${usd(enterprise.budget)} allocated · ${enterprise.seats} active users`}
          tooltip={enterprise.source === 'licenses'
            ? "Enterprise monthly credit allowance = configured licensed seats × per-seat quota (set in License & Budget Configuration). Allocated budget = credits × $0.01."
            : "Enterprise monthly credit allowance = sum of each ACTIVE user's total_monthly_quota. Idle licensed seats are not in the export — configure licenses below for the true budget. Allocated budget = credits × $0.01."}
        />
        <KpiCard
          label="Credits Used"
          value={formatCredits(enterprise.consumed)}
          subtitle={`${(enterprise.consumedPct * 100).toFixed(1)}% of allowance`}
          tooltip="Credits consumed so far in the observed window, as a share of the credits allotted."
        />
        <KpiCard
          label="Consumption Value"
          value={usd(enterprise.consumed)}
          subtitle="gross value of credits used"
          tooltip="List-price value of the credits consumed = credits used × $0.01. This is consumption value, NOT money billed — see Billed to Date."
        />
        <KpiCard
          label="Billed to Date"
          value={formatCurrency(enterprise.net)}
          subtitle={enterprise.net > 0 ? 'actual overage charges' : 'within included allowance'}
          tooltip="Actual dollars billed (sum of net_amount). Usually $0 while consumption stays within the included monthly allowance; only overage beyond the allowance is charged."
        />
        <KpiCard
          label="Projected Month-End"
          value={formatCredits(enterprise.projected)}
          subtitle={`${(enterprise.projectedPct * 100).toFixed(0)}% of budget · ${usd(enterprise.projected)}${low ? ' · preliminary' : ''}`}
          tooltip="Run-rate projection: credits used so far + observed daily average applied to the remaining days of the month."
          valueColor={projColor}
        />
        <KpiCard
          label="Projected Overage"
          value={willOverage ? formatCredits(projOverageCr) : '—'}
          subtitle={willOverage ? `${usd(projOverageCr)} beyond pooled allowance${low ? ' · preliminary' : ''}` : 'within pooled allowance'}
          tooltip="Projected credits beyond the total included allowance = max(0, projected − allotted). Included credits pool across the billing entity, so overage only accrues once the shared pool is exhausted. Cost at $0.01 / credit if overage is enabled; otherwise usage is blocked."
          valueColor={!low && willOverage ? '#ef4444' : undefined}
        />
        <KpiCard
          label="Window"
          value={`${enterprise.daysObserved} / ${enterprise.daysInMonth}`}
          subtitle={`days observed in ${enterprise.month}`}
          tooltip="Observed days of data vs total days in the month. The projection extrapolates the observed daily rate across the rest of the month."
        />
        <KpiCard
          label="At-Risk Accounts"
          value={`${orgsOver + orgsAtRisk} / ${usersOver}`}
          subtitle="orgs (≥80%) · heavy users"
          tooltip="Organizations projected to reach ≥80% of their pooled budget, and users projected to draw more than their own per-seat share. Heavy users are covered by the shared pool unless user-level budgets are configured."
        />
      </div>

      <p style={{ fontSize:'0.7rem',color:'var(--text-3)',lineHeight:1.5,marginBottom:'1.5rem' }}>
        Budgets are in <strong style={{ color:'var(--text-2)' }}>AI credits</strong> (premium requests); dollar values use GitHub's{' '}
        <strong style={{ color:'var(--text-2)' }}>$0.01 / credit</strong> rate. Model multipliers are already baked into the credit counts.
        Projection assumes the observed daily run rate continues for the rest of the month.{' '}
        Included credits <strong style={{ color:'var(--text-2)' }}>pool across the billing entity</strong> — power users draw from the shared pool, offset by lighter users, so overage accrues only once the whole pool is exhausted.{' '}
        <a href={CONFIG.BILLING_DOCS_URL} target="_blank" rel="noreferrer"
           style={{ color:'var(--green)',display:'inline-flex',alignItems:'center',gap:'0.2rem' }}>
          usage-based billing <ExternalLink size={11} />
        </a>{' · '}
        <a href={CONFIG.PRICING_DOCS_URL} target="_blank" rel="noreferrer"
           style={{ color:'var(--green)',display:'inline-flex',alignItems:'center',gap:'0.2rem' }}>
          models &amp; pricing <ExternalLink size={11} />
        </a>
      </p>
    </div>
  );
}
