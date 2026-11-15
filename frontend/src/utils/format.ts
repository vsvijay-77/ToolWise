export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
export const money = (value: number, currency: 'USD' | 'INR' = 'INR') =>
  new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(currency === 'INR' ? value * 83 : value)
export const percent = (value: number) => `${Math.round(value)}%`
