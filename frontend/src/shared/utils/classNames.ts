export type ClassValue = string | number | boolean | undefined | null;

export const cn = (...classes: ClassValue[]): string => classes.filter(Boolean).join(' ');
