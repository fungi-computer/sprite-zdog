/** Author palette references remain plain strings in portable Zdog scene data. */
export const COLOR_PREFIX = "\u0000sprite-color:";

export const colorKeyFromValue = (
  value: string | undefined,
): string | undefined =>
  value?.startsWith(COLOR_PREFIX)
    ? value.slice(COLOR_PREFIX.length)
    : undefined;
