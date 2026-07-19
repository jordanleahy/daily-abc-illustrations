import type { CityId } from '@/types/city';

interface CityLike {
  id: string;
  label: string;
}

interface ActionLike {
  id?: string;
  label?: string;
  value?: string;
  cityId?: string;
}

type MatchFn = (
  text: string,
  cities: CityLike[],
  opts?: { allowReverseInclude?: boolean; minMatchLen?: number },
) => CityId | null;

export type ProceedCityResult =
  | { status: 'ok'; city: CityId }
  | { status: 'inferred'; city: CityId }
  | { status: 'blocked' };

/**
 * Pure gate for the "Create My Book!" proceed action.
 *
 * Priority:
 *   1. If activeCity is already resolved, allow (`ok`).
 *   2. Otherwise try to infer a city from the tapped chip's label/value
 *      (covers chips that didn't carry an explicit `cityId`).
 *   3. Otherwise block so the caller can surface a validation error.
 */
export function resolveProceedCity(params: {
  action: ActionLike;
  activeCity: CityId | null;
  cities: CityLike[];
  matchCityInText: MatchFn;
}): ProceedCityResult {
  const { action, activeCity, cities, matchCityInText } = params;

  if (activeCity) return { status: 'ok', city: activeCity };

  const inferred =
    matchCityInText(action.label ?? '', cities, {
      allowReverseInclude: true,
      minMatchLen: 3,
    }) ||
    matchCityInText(action.value ?? '', cities, {
      allowReverseInclude: true,
      minMatchLen: 3,
    });

  if (inferred) return { status: 'inferred', city: inferred };
  return { status: 'blocked' };
}
