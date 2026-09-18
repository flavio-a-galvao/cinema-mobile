export const digitsOnly = (value: string, limit: number): string => value.replace(/\D/g, '').slice(0, limit);

export function maskBrazilianDate(value: string): string {
  return digitsOnly(value, 8).replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
}

export function toApiDate(value: string): string | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return null;
  const [day, month, year] = value.split('/').map(Number);
  if (year < 1000 || month < 1 || month > 12 || day < 1) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return value.slice(6) + '-' + value.slice(3, 5) + '-' + value.slice(0, 2);
}

export function toDisplayDate(value: string | null): string {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? match[3] + '/' + match[2] + '/' + match[1] : '';
}

export function ageError(value: string): string | undefined {
  if (!value) return undefined;
  if (!/^\d{1,3}$/.test(value)) return 'Informe uma idade de 0 a 130.';
  return Number(value) > 130 ? 'A idade informada é maior do que o permitido.' : undefined;
}
