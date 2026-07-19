import { describe, it, expect } from 'vitest';
import { resolveProceedCity } from './resolveProceedCity';
import { matchCityInText } from '@/hooks/useResolvedCity';

const cities = [
  { id: 'JERSEY_CITY', label: 'Jersey City' },
  { id: 'HOBOKEN', label: 'Hoboken' },
  { id: 'CITY_ASPEN', label: 'Aspen' },
  { id: 'NEW_YORK_CITY', label: 'New York City' },
  { id: 'CITY_YORK', label: 'York' },
];

const run = (action: Parameters<typeof resolveProceedCity>[0]['action'], activeCity: string | null) =>
  resolveProceedCity({ action, activeCity, cities, matchCityInText });

describe('resolveProceedCity', () => {
  it('returns ok when activeCity is already set (chip carried cityId earlier)', () => {
    const result = run({ id: 'confirm', value: 'create_book', label: 'Create My Book!' }, 'JERSEY_CITY');
    expect(result).toEqual({ status: 'ok', city: 'JERSEY_CITY' });
  });

  it('does not overwrite activeCity with an inferred value from an unrelated chip label', () => {
    const result = run({ id: 'confirm', label: 'Create My Book!' }, 'HOBOKEN');
    expect(result).toEqual({ status: 'ok', city: 'HOBOKEN' });
  });

  it('infers city from chip label when cityId is missing (New York City)', () => {
    const result = run({ id: 'city_pick', label: 'New York City' }, null);
    expect(result).toEqual({ status: 'inferred', city: 'NEW_YORK_CITY' });
  });

  it('infers from a longer label containing the city name', () => {
    const result = run({ id: 'city_pick', label: 'Story set in New York City with bridges' }, null);
    expect(result).toEqual({ status: 'inferred', city: 'NEW_YORK_CITY' });
  });

  it('infers city from action.value when label is empty', () => {
    const result = run({ id: 'confirm', value: 'jersey city' }, null);
    expect(result).toEqual({ status: 'inferred', city: 'JERSEY_CITY' });
  });

  it('longest-label-first: prefers New York City over York', () => {
    const result = run({ id: 'x', label: 'New York City' }, null);
    expect(result.status).toBe('inferred');
    expect((result as { city: string }).city).toBe('NEW_YORK_CITY');
  });

  it('blocks when there is no activeCity and nothing to infer from', () => {
    const result = run({ id: 'confirm', value: 'create_book', label: 'Create My Book!' }, null);
    expect(result).toEqual({ status: 'blocked' });
  });

  it('blocks when chip label mentions an unknown city', () => {
    const result = run({ id: 'x', label: 'Reykjavik' }, null);
    expect(result).toEqual({ status: 'blocked' });
  });

  it('handles the exact SuggestedAction shape (id/label/value/cityId)', () => {
    const action = { id: 'city_hoboken', label: 'Hoboken', value: 'pick_city', cityId: 'HOBOKEN' };
    // Simulates the caller having already set activeCity from action.cityId
    const result = run(action, 'HOBOKEN');
    expect(result).toEqual({ status: 'ok', city: 'HOBOKEN' });
  });
});
