import { describe, it, expect } from 'vitest';
import { composePrompt, estimateTokens } from './promptBudget';

describe('estimateTokens', () => {
  it('returns 0 for empty text', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('estimates 1 token per 4 chars', () => {
    expect(estimateTokens('12345678')).toBe(2);
    expect(estimateTokens('123456789')).toBe(3);
  });
});

describe('composePrompt', () => {
  it('joins blocks in input order', () => {
    const result = composePrompt([
      { label: 'a', content: 'AAA', required: true },
      { label: 'b', content: 'BBB', priority: 10 },
    ]);
    expect(result.content).toBe('AAABBB');
    expect(result.withinBudget).toBe(true);
    expect(result.droppedLabels).toEqual([]);
  });

  it('skips empty blocks and marks them as empty', () => {
    const result = composePrompt([
      { label: 'a', content: 'AAA', required: true },
      { label: 'empty', content: '   ' },
    ]);
    expect(result.content).toBe('AAA');
    expect(result.blocks.find((b) => b.label === 'empty')?.status).toBe('empty');
  });

  it('drops lowest-priority optional blocks first when over budget', () => {
    const result = composePrompt(
      [
        { label: 'required', content: 'R'.repeat(40), required: true },
        { label: 'high', content: 'H'.repeat(40), priority: 90 },
        { label: 'low', content: 'L'.repeat(40), priority: 10 },
      ],
      { maxTokens: 20, charsPerToken: 4 } // 80 chars budget
    );
    expect(result.droppedLabels).toEqual(['low']);
    expect(result.content).toBe('R'.repeat(40) + 'H'.repeat(40));
    expect(result.withinBudget).toBe(true);
  });

  it('never drops required blocks', () => {
    const result = composePrompt(
      [
        { label: 'r1', content: 'A'.repeat(50), required: true },
        { label: 'o1', content: 'B'.repeat(50), priority: 5 },
      ],
      { maxTokens: 15, charsPerToken: 4 } // 60 chars
    );
    expect(result.droppedLabels).toEqual(['o1']);
    expect(result.content.startsWith('A'.repeat(50))).toBe(true);
  });

  it('truncates the largest required block as a last resort', () => {
    const result = composePrompt(
      [
        { label: 'big', content: 'A'.repeat(500), required: true },
        { label: 'small', content: 'B'.repeat(10), required: true },
      ],
      { maxTokens: 25, charsPerToken: 4 } // 100 chars
    );
    expect(result.content.length).toBeLessThanOrEqual(100);
    expect(result.content).toContain('context truncated');
    expect(result.blocks.find((b) => b.label === 'big')?.status).toBe('truncated');
  });

  it('reports estimated tokens and max tokens', () => {
    const result = composePrompt([{ label: 'a', content: 'X'.repeat(400), required: true }], {
      maxTokens: 1000,
    });
    expect(result.estimatedTokens).toBe(100);
    expect(result.maxTokens).toBe(1000);
  });
});
