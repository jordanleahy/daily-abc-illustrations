import { useCallback, useMemo } from 'react';
import { useCities } from '@/hooks/useCities';
import { hasPrefix, ID_PREFIX } from '@/types/idRegistry';
import type { CityId } from '@/types/city';

/**
 * Normalize free-text city input for fuzzy matching:
 * lowercase, strip punctuation, collapse whitespace.
 */
export const normalizeCityText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

interface ChatMessageLike {
  role: string;
  content: unknown;
}

interface CityLike {
  id: string;
  label: string;
}

/**
 * Try to match a piece of text against a list of cities.
 * Iterates longest-label-first so "New York City" wins over "York".
 * Returns the matching city id, or null.
 *
 * `minMatchLen` guards against tiny substrings matching accidentally
 * (e.g. a 2-char user reply matching inside a long label).
 */
export function matchCityInText(
  text: string,
  cities: CityLike[],
  opts: { allowReverseInclude?: boolean; minMatchLen?: number } = {},
): CityId | null {
  const normalizedText = normalizeCityText(text);
  if (!normalizedText) return null;
  const minLen = opts.minMatchLen ?? 3;

  // Longest-label-first so "New York City" beats "York".
  const sorted = [...cities].sort((a, b) => b.label.length - a.label.length);

  for (const city of sorted) {
    const normalizedId = normalizeCityText(city.id.replace(/_/g, ' '));
    const normalizedLabel = normalizeCityText(city.label);
    if (!normalizedLabel) continue;

    if (
      normalizedText === normalizedLabel ||
      normalizedText === normalizedId
    ) {
      return city.id as CityId;
    }
    if (normalizedLabel.length >= minLen && normalizedText.includes(normalizedLabel)) {
      return city.id as CityId;
    }
    if (
      opts.allowReverseInclude &&
      normalizedText.length >= minLen &&
      normalizedLabel.includes(normalizedText)
    ) {
      return city.id as CityId;
    }
  }
  return null;
}

/**
 * Single source of truth for resolving the "active" city in the chat flow.
 *
 * Resolution order (first hit wins):
 *   1. Explicit `selectedCity`
 *   2. A user message that names or contains a known city label
 *   3. An assistant message (title, outline, description) that names a known city
 *   4. Free-text user reply to an assistant city question (CITY_CUSTOM fallback)
 */
export function useResolvedCity(
  messages: ChatMessageLike[],
  selectedCity: CityId | null,
) {
  const { data: cities = [] } = useCities();

  const cityIds = useMemo(() => new Set(cities.map(c => c.id)), [cities]);

  const isCityId = useCallback(
    (id: string): boolean =>
      hasPrefix(id, ID_PREFIX.CITY) || cityIds.has(id) || id === 'skip-city',
    [cityIds],
  );

  const resolvedCityFromConversation = useMemo<CityId | null>(() => {
    if (selectedCity) return selectedCity;

    // Pass 1: most-recent user message that names a known city.
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== 'user' || typeof msg.content !== 'string') continue;
      const matched = matchCityInText(msg.content, cities, {
        allowReverseInclude: true,
        minMatchLen: 3,
      });
      if (matched) return matched;
    }

    // Pass 2: most-recent assistant message that names a known city
    // (covers agent-grounded titles/outlines/descriptions).
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== 'assistant' || typeof msg.content !== 'string') continue;
      const matched = matchCityInText(msg.content, cities, {
        allowReverseInclude: false,
        minMatchLen: 4,
      });
      if (matched) return matched;
    }

    // Pass 3: free-text reply to an assistant city question → CITY_CUSTOM.
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== 'user' || typeof msg.content !== 'string') continue;
      const rawContent = msg.content.trim();
      if (!rawContent) continue;

      const previousAssistant = messages
        .slice(0, i)
        .reverse()
        .find(
          previous =>
            previous.role === 'assistant' && typeof previous.content === 'string',
        );
      const assistantAskedCity =
        typeof previousAssistant?.content === 'string' &&
        /city|location|place/i.test(previousAssistant.content);
      if (
        assistantAskedCity &&
        rawContent.length >= 2 &&
        !/^(yes|no|ok|okay|sure|approve|create|looks|perfect)$/i.test(rawContent)
      ) {
        return `CITY_CUSTOM:${rawContent}` as CityId;
      }
    }

    // Pass 4: assistant bolded a location the agent grounded the story in
    // (e.g. "in **New York City**" / "adventure through **Paris**").
    // Covers cities the DB doesn't know about so CITY_CUSTOM is deterministic.
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== 'assistant' || typeof msg.content !== 'string') continue;
      const boldMatch = msg.content.match(
        /\b(?:in|through|around|across|from|to|of)\s+(?:the\s+)?(?:city\s+of\s+)?\*\*([A-Z][^*\n]{1,60})\*\*/,
      );
      if (boldMatch) {
        const label = boldMatch[1].trim().replace(/[.,!?;:]+$/, '');
        if (label.length >= 2) return `CITY_CUSTOM:${label}` as CityId;
      }
    }



    return null;
  }, [cities, messages, selectedCity]);

  const activeCity: CityId | null = selectedCity || resolvedCityFromConversation;

  return {
    cities,
    activeCity,
    resolvedCityFromConversation,
    isCityId,
    normalizeCityText,
    matchCityInText,
  };
}
