export function formatPrice(price: number | string | undefined | null): string {
  if (price === undefined || price === null || price === '') return "0";
  const numPrice = typeof price === "string" ? parseFloat(price.replace(/,/g, '')) : price;
  
  if (isNaN(numPrice)) return "0";

  if (numPrice >= 10000000) { // 1 Crore
    return `₹${(numPrice / 10000000).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')} Cr`;
  } else if (numPrice >= 100000) { // 1 Lakh
    return `₹${(numPrice / 100000).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')} Lac`;
  } else {
    return `₹${numPrice.toLocaleString('en-IN')}`;
  }
}
