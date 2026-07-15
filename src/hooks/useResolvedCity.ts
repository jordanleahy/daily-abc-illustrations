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

/**
 * Single source of truth for resolving the "active" city in the chat flow.
 *
 * Combines:
 * - The user's explicit selection (`selectedCity`)
 * - A conversation-scan fallback (last user message that matches a known
 *   city ID/label, or an assistant-city-question followed by free-text)
 * - A prefix/DB-backed `isCityId` predicate used by suggestion chip parsing
 *
 * Returns `activeCity` for consumers plus helpers for chip parsing.
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

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== 'user' || typeof msg.content !== 'string') continue;

      const rawContent = msg.content.trim();
      const normalizedContent = normalizeCityText(rawContent);
      if (!normalizedContent) continue;

      const matchedCity = cities.find(city => {
        const normalizedId = normalizeCityText(city.id.replace(/_/g, ' '));
        const normalizedLabel = normalizeCityText(city.label);
        return (
          normalizedContent === normalizedId ||
          normalizedContent === normalizedLabel ||
          normalizedContent.includes(normalizedLabel)
        );
      });

      if (matchedCity) return matchedCity.id;

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

    return null;
  }, [cities, messages, selectedCity]);

  const activeCity: CityId | null = selectedCity || resolvedCityFromConversation;

  return {
    cities,
    activeCity,
    resolvedCityFromConversation,
    isCityId,
    normalizeCityText,
  };
}
