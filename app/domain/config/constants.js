/**
 * Application-wide constants.
 * All business thresholds live here — change these, not the algorithms.
 */
export const CONFIG = {
  // Quota Thresholds
  DAILY_GENERATION_QUOTA: 500,
  LOW_ACCEPTANCE_THRESHOLD: 0.20,
  HIGH_ACCEPTANCE_THRESHOLD: 0.70,

  // User Classifications
  POWER_USER_PERCENTILE: 0.90,
  MIN_GENERATIONS_FOR_RATE: 50,
  TREND_COMPARISON_DAYS: 7,

  // UI Settings
  TABLE_PAGE_SIZE: 100,
  CHART_ANIMATION_DURATION: 750,
  MAX_TOP_USERS_SHOWN: 15,
  MAX_LANGUAGES_SHOWN: 10,

  // Parser Settings
  CHUNK_SIZE: 10000,
  MAX_FILE_SIZE_MB: 100,

  // Value Calculation defaults (overridable by user at runtime)
  BLENDED_RATE_PER_HOUR: 90,
  MANUAL_LINES_PER_HOUR: 30
};

/**
 * Human-readable labels for every known Copilot feature key.
 * Falls back gracefully for unknown keys via humanizeFeature().
 *
 * Note on agent_edit vs chat_panel_agent_mode:
 * Both are agentic. The difference is the UI entry point (diff review vs chat thread),
 * not the underlying capability. GitHub has been converging these since late 2024.
 */
export const FEATURE_LABELS = {
  code_completion: {
    label: 'Code Completion',
    short: 'Completions',
    icon: 'code-2',
    desc: 'Passive inline suggestions as you type — the "grey ghost text". Accepted by pressing Tab.'
  },
  chat_panel_agent_mode: {
    label: 'Chat · Agent',
    short: 'Chat Agent',
    icon: 'bot',
    desc: 'Agent mode in the Chat panel — same autonomous engine as Edit Mode, but accessed conversationally.'
  },
  chat_panel_ask_mode: {
    label: 'Chat · Ask',
    short: 'Ask',
    icon: 'message-square',
    desc: 'Ask mode in the Chat panel — Q&A about code. Copilot explains and suggests but does not modify files automatically.'
  },
  chat_panel_plan_mode: {
    label: 'Chat · Plan',
    short: 'Plan',
    icon: 'list-checks',
    desc: 'Plan mode — Copilot produces a step-by-step plan before executing any changes.'
  },
  chat_panel_custom_mode: {
    label: 'Chat · Custom',
    short: 'Custom',
    icon: 'sliders-horizontal',
    desc: 'Custom-instructions mode — user-defined system prompts are active.'
  },
  chat_panel_unknown_mode: {
    label: 'Chat · Other',
    short: 'Other',
    icon: 'help-circle',
    desc: 'Chat interactions with an unrecognised mode flag — likely beta or preview features.'
  },
  agent_edit: {
    label: 'Edit Mode',
    short: 'Edits',
    icon: 'pencil-line',
    desc: 'Copilot Edits panel — agentic multi-file editing with diff review before applying.'
  },
  agent: {
    label: 'Agent Mode',
    short: 'Agent',
    icon: 'cpu',
    desc: 'General agentic activity — Copilot autonomously reads files, runs commands, fixes errors, and iterates.'
  },
  chat_inline: {
    label: 'Inline Chat',
    short: 'Inline',
    icon: 'message-circle',
    desc: 'Inline chat triggered with ⌘I / Ctrl+I inside the editor.'
  },
  inline_chat: {
    label: 'Inline Chat',
    short: 'Inline',
    icon: 'message-circle',
    desc: 'Inline chat inside the editor — ask questions or request a localised edit without opening the sidebar.'
  },
  chat: {
    label: 'Copilot Chat',
    short: 'Chat',
    icon: 'messages-square',
    desc: 'General Copilot Chat — older catch-all key before Ask/Agent/Plan modes were split.'
  }
};
