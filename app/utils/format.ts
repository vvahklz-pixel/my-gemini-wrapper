export function formatPrice(price: number, currency: string): string {
  if (!price) return '-';
  if (currency === 'KRW' || price > 1000) {
    return price.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
  }
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
