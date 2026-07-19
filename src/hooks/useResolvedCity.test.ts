import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useResolvedCity, normalizeCityText } from './useResolvedCity';

vi.mock('@/hooks/useCities', () => ({
  useCities: () => ({
    data: [
      { id: 'JERSEY_CITY', label: 'Jersey City' },
      { id: 'HOBOKEN', label: 'Hoboken' },
      { id: 'CITY_ASPEN', label: 'Aspen' },
      { id: 'NEW_YORK_CITY', label: 'New York City' },
      { id: 'CITY_YORK', label: 'York' },
    ],
  }),
}));

const userMsg = (content: string) => ({ role: 'user', content });
const asstMsg = (content: string) => ({ role: 'assistant', content });

describe('normalizeCityText', () => {
  it('lowercases, strips punctuation, collapses whitespace', () => {
    expect(normalizeCityText('  Jersey-City!! ')).toBe('jersey city');
    expect(normalizeCityText('HOBOKEN,  NJ')).toBe('hoboken nj');
  });
});

describe('useResolvedCity', () => {
  beforeEach(() => vi.clearAllMocks());

  it('prefers explicit selectedCity over conversation scan', () => {
    const messages = [userMsg('actually I want Hoboken')];
    const { result } = renderHook(() =>
      useResolvedCity(messages, 'CITY_ASPEN'),
    );
    expect(result.current.activeCity).toBe('CITY_ASPEN');
    expect(result.current.resolvedCityFromConversation).toBe('CITY_ASPEN');
  });

  it('resolves a typed city label to its DB id (Jersey City)', () => {
    const messages = [
      asstMsg('Which city should we feature?'),
      userMsg('Jersey City'),
    ];
    const { result } = renderHook(() => useResolvedCity(messages, null));
    expect(result.current.activeCity).toBe('JERSEY_CITY');
  });

  it('is case- and punctuation-insensitive for typed cities', () => {
    const messages = [
      asstMsg('Pick a city.'),
      userMsg('  hoboken!! '),
    ];
    const { result } = renderHook(() => useResolvedCity(messages, null));
    expect(result.current.activeCity).toBe('HOBOKEN');
  });

  it('resolves a city mentioned inside a longer sentence', () => {
    const messages = [
      asstMsg('Where should the story take place?'),
      userMsg('Let’s do jersey city please'),
    ];
    const { result } = renderHook(() => useResolvedCity(messages, null));
    expect(result.current.activeCity).toBe('JERSEY_CITY');
  });

  it('treats a UI-tapped chip (selectedCity = DB id) as the active city', () => {
    const { result } = renderHook(() => useResolvedCity([], 'JERSEY_CITY'));
    expect(result.current.activeCity).toBe('JERSEY_CITY');
  });

  it('treats a UI-tapped chip with CITY_ prefix as active city', () => {
    const { result } = renderHook(() => useResolvedCity([], 'CITY_ASPEN'));
    expect(result.current.activeCity).toBe('CITY_ASPEN');
  });

  it('falls back to CITY_CUSTOM: for unknown free-text after a city question', () => {
    const messages = [
      asstMsg('What city should we visit?'),
      userMsg('Reykjavik'),
    ];
    const { result } = renderHook(() => useResolvedCity(messages, null));
    expect(result.current.activeCity).toBe('CITY_CUSTOM:Reykjavik');
  });

  it('does NOT treat generic acknowledgements as a custom city', () => {
    const messages = [
      asstMsg('Which city?'),
      userMsg('yes'),
    ];
    const { result } = renderHook(() => useResolvedCity(messages, null));
    expect(result.current.activeCity).toBeNull();
  });

  it('returns null when there is no city context at all', () => {
    const messages = [
      asstMsg('Hi there!'),
      userMsg('hello'),
    ];
    const { result } = renderHook(() => useResolvedCity(messages, null));
    expect(result.current.activeCity).toBeNull();
  });

  it('uses the most recent user message when multiple cities are mentioned', () => {
    const messages = [
      asstMsg('Pick a city.'),
      userMsg('Aspen'),
      asstMsg('Changed your mind?'),
      userMsg('Hoboken'),
    ];
    const { result } = renderHook(() => useResolvedCity(messages, null));
    expect(result.current.activeCity).toBe('HOBOKEN');
  });

  describe('isCityId predicate', () => {
    it('recognizes CITY_ prefixed ids', () => {
      const { result } = renderHook(() => useResolvedCity([], null));
      expect(result.current.isCityId('CITY_ASPEN')).toBe(true);
    });

    it('recognizes DB-backed legacy ids from useCities', () => {
      const { result } = renderHook(() => useResolvedCity([], null));
      expect(result.current.isCityId('JERSEY_CITY')).toBe(true);
      expect(result.current.isCityId('HOBOKEN')).toBe(true);
    });

    it('recognizes the skip-city sentinel', () => {
      const { result } = renderHook(() => useResolvedCity([], null));
      expect(result.current.isCityId('skip-city')).toBe(true);
    });

    it('rejects unrelated ids', () => {
      const { result } = renderHook(() => useResolvedCity([], null));
      expect(result.current.isCityId('SEASON_WINTER')).toBe(false);
      expect(result.current.isCityId('random')).toBe(false);
    });
  describe('assistant-message fallback', () => {
    it('resolves a city named in the assistant title/outline when no user reply matches', () => {
      const messages = [
        asstMsg('Pick a city.'),
        userMsg('sure'),
        asstMsg('Here is the outline: A story set in New York City with iconic landmarks.'),
      ];
      const { result } = renderHook(() => useResolvedCity(messages, null));
      expect(result.current.activeCity).toBe('NEW_YORK_CITY');
    });

    it('prefers explicit selectedCity over an assistant mention of a different city', () => {
      const messages = [
        asstMsg('Outline for a book set in New York City.'),
      ];
      const { result } = renderHook(() =>
        useResolvedCity(messages, 'JERSEY_CITY'),
      );
      expect(result.current.activeCity).toBe('JERSEY_CITY');
    });

    it('picks the longest matching label (New York City over York)', () => {
      const messages = [
        asstMsg('A story about New York City and its bridges.'),
      ];
      const { result } = renderHook(() => useResolvedCity(messages, null));
      expect(result.current.activeCity).toBe('NEW_YORK_CITY');
    });
  });
});
