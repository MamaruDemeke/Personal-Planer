export const ETHIOPIAN_MONTHS = [
  'Meskerem',
  'Tikimt',
  'Hidar',
  'Tahsas',
  'Tir',
  'Yekatit',
  'Megabit',
  'Miazia',
  'Ginbot',
  'Sene',
  'Hamle',
  'Nehase',
  'Pagume',
]

export const ETHIOPIAN_MONTHS_AMHARIC = [
  'መስከረም', 'ጥቅምት', 'ኅዳር', 'ታህሣሥ', 'ጥር', 'የካቲት',
  'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜን',
]

function gregorianToJdn(date) {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const a = Math.floor((14 - m) / 12)
  const yy = y + 4800 - a
  const mm = m + 12 * a - 3
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045
}

export function gregorianToEthiopian(date) {
  const jdn = gregorianToJdn(date)
  const e = jdn - 1724221
  const year = Math.floor(e / 1461) * 4 + Math.floor((e % 1461) / 365) + 1
  const r = e % 1461
  const n = r % 365
  const month = Math.floor(n / 30) + 1
  const day = (n % 30) + 1
  return { year, month, day, monthName: ETHIOPIAN_MONTHS[month - 1] }
}

export function ethiopianToGregorian(year, month, day) {
  const e = (year - 1) * 365 + Math.floor((year - 1) / 4) + (month - 1) * 30 + (day - 1)
  const jdn = e + 1724221
  // JDN to Gregorian (standard algorithm)
  const a = jdn + 32044
  const b = Math.floor((4 * a + 3) / 146097)
  const c = a - Math.floor((146097 * b) / 4)
  const dd = Math.floor((4 * c + 3) / 1461)
  const ee = c - Math.floor((1461 * dd) / 4)
  const mth = Math.floor((5 * ee + 2) / 153)
  const d = ee - Math.floor((153 * mth + 2) / 5) + 1
  const mo = mth + 3 - 12 * Math.floor(mth / 10)
  const y = 100 * b + dd - 4800 + Math.floor(mth / 10)
  return new Date(y, mo - 1, d)
}

export function isEthiopianLeapYear(year) {
  return year % 4 === 3
}

export function daysInEthiopianMonth(year, month) {
  if (month === 13) return isEthiopianLeapYear(year) ? 6 : 5
  return 30
}
