export const capitalize = (str: string): string =>  {
  if (!str) {
    return "";
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export const pluralize = (count: number, singular: string, plural?: string): string => {
    if (count === 1) {
        return singular;
    }
    return plural || singular + "s";
}

export const generateId = (): string => {
    return Math.random().toString(36).slice(2, 9);
}