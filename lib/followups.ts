export const DEFAULT_FOLLOWUP_1 = (n: string, num: string, link: string) =>
  `Buongiorno, le ricordo il preventivo n. ${num} relativo a "${n}". Resto a disposizione per chiarimenti. Può rivederlo qui: ${link}`;

export const DEFAULT_FOLLOWUP_2 = (n: string, num: string, link: string) =>
  `Buongiorno, riporto alla sua attenzione il preventivo n. ${num} ("${n}"). La proposta resta valida, resto disponibile. Link: ${link}`;

export function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}
