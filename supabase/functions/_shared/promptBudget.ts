/**
 * Prompt Budget (Phase 3)
 *
 * Single source of truth for composing large system prompts from labeled blocks
 * while keeping them inside a token budget.
 *
 * Design goals:
 * - Deterministic: same inputs -> same output (no AI, no randomness).
 * - Observable: returns a per-block report so edge logs show what was kept/dropped.
 * - Safe: blocks marked `required` are never dropped; optional blocks are dropped
 *   lowest-priority-first, then (as a last resort) truncated.
 */

export interface PromptBlock {
  /** Short label used in logs, e.g. "systemPrompt", "cityContext" */
  label: string;
  /** Block content; empty/whitespace-only blocks are skipped entirely */
  content: string;
  /**
   * Higher number = more important. Required blocks are always kept.
   * Optional blocks are dropped from the lowest priority upward.
   */
  priority?: number;
  /** Required blocks are never dropped (may be truncated as a last resort) */
  required?: boolean;
}

export interface PromptBudgetOptions {
  /** Max tokens allowed for the composed prompt. Default 120_000. */
  maxTokens?: number;
  /** Characters per token used for estimation. Default 4. */
  charsPerToken?: number;
}

export interface PromptBlockReport {
  label: string;
  chars: number;
  tokens: number;
  status: 'kept' | 'dropped' | 'truncated' | 'empty';
}

export interface PromptBudgetResult {
  content: string;
  totalChars: number;
  estimatedTokens: number;
  maxTokens: number;
  withinBudget: boolean;
  blocks: PromptBlockReport[];
  droppedLabels: string[];
}

export const DEFAULT_CHARS_PER_TOKEN = 4;
export const DEFAULT_MAX_PROMPT_TOKENS = 120_000;

/** Cheap, deterministic token estimate (chars / charsPerToken, rounded up). */
export function estimateTokens(text: string, charsPerToken = DEFAULT_CHARS_PER_TOKEN): number {
  if (!text) return 0;
  const divisor = charsPerToken > 0 ? charsPerToken : DEFAULT_CHARS_PER_TOKEN;
  return Math.ceil(text.length / divisor);
}

const TRUNCATION_NOTICE = '\n\n[...context truncated to fit prompt budget...]';

/**
 * Compose blocks into one prompt string, enforcing a token budget.
 * Block order in the output always follows the input order (prompt semantics),
 * while drop decisions follow priority (lowest first).
 */
export function composePrompt(
  blocks: PromptBlock[],
  options: PromptBudgetOptions = {}
): PromptBudgetResult {
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_PROMPT_TOKENS;
  const charsPerToken = options.charsPerToken ?? DEFAULT_CHARS_PER_TOKEN;
  const maxChars = Math.max(0, maxTokens * charsPerToken);

  const report: PromptBlockReport[] = [];
  const active: Array<{ index: number; block: PromptBlock; content: string }> = [];

  blocks.forEach((block, index) => {
    const content = block?.content ?? '';
    if (!content.trim()) {
      report.push({ label: block?.label ?? `block_${index}`, chars: 0, tokens: 0, status: 'empty' });
      return;
    }
    active.push({ index, block, content });
    report.push({
      label: block.label,
      chars: content.length,
      tokens: estimateTokens(content, charsPerToken),
      status: 'kept',
    });
  });

  const statusFor = (label: string) => report.find((r) => r.label === label && r.status !== 'empty');

  let totalChars = active.reduce((sum, entry) => sum + entry.content.length, 0);
  const droppedLabels: string[] = [];

  // 1) Drop optional blocks, lowest priority first (stable by original order).
  if (totalChars > maxChars) {
    const optional = active
      .filter((entry) => !entry.block.required)
      .sort((a, b) => (a.block.priority ?? 0) - (b.block.priority ?? 0) || a.index - b.index);

    for (const entry of optional) {
      if (totalChars <= maxChars) break;
      const idx = active.indexOf(entry);
      if (idx >= 0) active.splice(idx, 1);
      totalChars -= entry.content.length;
      droppedLabels.push(entry.block.label);
      const r = statusFor(entry.block.label);
      if (r) r.status = 'dropped';
    }
  }

  // 2) Last resort: truncate the largest remaining (required) block.
  if (totalChars > maxChars && active.length > 0) {
    const largest = active.reduce((a, b) => (b.content.length > a.content.length ? b : a));
    const overflow = totalChars - maxChars;
    const keepChars = Math.max(0, largest.content.length - overflow - TRUNCATION_NOTICE.length);
    const truncated = largest.content.slice(0, keepChars) + TRUNCATION_NOTICE;
    totalChars -= largest.content.length - truncated.length;
    largest.content = truncated;
    const r = statusFor(largest.block.label);
    if (r) {
      r.status = 'truncated';
      r.chars = truncated.length;
      r.tokens = estimateTokens(truncated, charsPerToken);
    }
  }

  const content = active
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.content)
    .join('');

  return {
    content,
    totalChars: content.length,
    estimatedTokens: estimateTokens(content, charsPerToken),
    maxTokens,
    withinBudget: content.length <= maxChars,
    blocks: report,
    droppedLabels,
  };
}

/** Structured, single-line-per-section log of a budget result. */
export function logPromptBudget(result: PromptBudgetResult, scope = 'prompt'): void {
  const kept = result.blocks.filter((b) => b.status === 'kept' || b.status === 'truncated');
  console.log(
    `📊 [${scope}] ${result.totalChars} chars ≈ ${result.estimatedTokens}/${result.maxTokens} tokens (${
      result.withinBudget ? 'within budget' : 'OVER BUDGET'
    })`
  );
  console.log(
    `📊 [${scope}] blocks: ${kept.map((b) => `${b.label}:${b.tokens}t${b.status === 'truncated' ? '(trunc)' : ''}`).join(', ')}`
  );
  if (result.droppedLabels.length > 0) {
    console.warn(`⚠️ [${scope}] dropped for budget: ${result.droppedLabels.join(', ')}`);
  }
}
