/**
 * Regression tests for the "Create My Book" outline gate.
 *
 * The google-create-book edge function is deterministic-only: it rejects any
 * request without a `bookOutline` (OUTLINE_REQUIRED). The client must therefore
 * decide, before firing the request, whether the transcript contains a parsable
 * page-by-page outline. These tests lock that decision in.
 */

import { describe, it, expect } from 'vitest';
import { parseBookOutline } from './pageHelpers';
import { buildOutlinePayload } from './bookPrompts';

const decide = (messages: Array<{ role: string; content: string }>) => {
  const outline = parseBookOutline(messages);
  const payload = buildOutlinePayload(outline);
  return payload ? ('create' as const) : ('request_outline' as const);
};

describe('create-book outline gate', () => {
  it('requests an outline when the assistant only produced a title + description', () => {
    const messages = [
      { role: 'user', content: 'Sight words book in Jersey City' },
      {
        role: 'assistant',
        content:
          'Here is a title and description for your book:\n\n' +
          '**Title: Jersey City Sight Words**\n' +
          '**Description:** Join Bluey and Bingo on a sunny summer day in Jersey City!',
      },
    ];
    expect(decide(messages)).toBe('request_outline');
  });

  it('requests an outline for an empty transcript', () => {
    expect(decide([])).toBe('request_outline');
  });

  it('proceeds when a bold-format page outline is present', () => {
    const pages = Array.from({ length: 12 }, (_, i) =>
      `**Page ${i + 1}: Page ${i + 1} Title** A short description for page ${i + 1}.`
    ).join('\n');

    const messages = [
      { role: 'user', content: 'Sight words book in Jersey City' },
      { role: 'assistant', content: `Here is your outline:\n\n${pages}` },
    ];

    expect(decide(messages)).toBe('create');

    const payload = buildOutlinePayload(parseBookOutline(messages));
    expect(payload).toBeDefined();
    expect(payload!.pages).toHaveLength(12);
    expect(payload!.pages[0].pageType).toBe('cover');
    expect(payload!.pages[1].pageType).toBe('educational');
    expect(payload!.bookName).toBe('Page 1 Title');
  });

  it('proceeds when a list-format page outline is present', () => {
    const pages = Array.from({ length: 12 }, (_, i) =>
      `- Page ${i + 1}: Title ${i + 1}: Description ${i + 1}`
    ).join('\n');

    const messages = [{ role: 'assistant', content: pages }];
    expect(decide(messages)).toBe('create');
    expect(buildOutlinePayload(parseBookOutline(messages))!.pages).toHaveLength(12);
  });
});
