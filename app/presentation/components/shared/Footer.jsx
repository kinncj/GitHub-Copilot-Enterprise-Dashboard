import React from 'react';

export function Footer() {
  return (
    <footer style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      height: '36px',
      borderTop: '1px solid var(--border)',
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <p style={{ fontSize: '0.68rem', color: 'var(--text-3)', letterSpacing: '0.02em', margin: 0 }}>
        Copyright &copy; 2026{' '}
        <a href="mailto:kinncj@protonmail.com" style={{ color: 'var(--text-2)', textDecoration: 'none' }}>
          Kinn Coelho Juliao &lt;kinncj@protonmail.com&gt;
        </a>
        {' '}&mdash; AGPLv3
      </p>
    </footer>
  );
}
