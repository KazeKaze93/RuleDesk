export const SPLIT_MIN_LENGTH: number;
export const CATALOGUE_MAX_LENGTH: number;
export const CATALOGUE_WORD: string;
/** The text with the long first lines of its modules broken; everything else as it was. */
export function splitLongLines(text: string): string;
/** The numbers (from 1) of the lines the catalogue would take for minified code. */
export function linesTakenForMinified(text: string): number[];
