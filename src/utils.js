export const formatPrice = (value) => {
  const number = Number(value);
  if (Number.isNaN(number)) {
    return '';
  }
  return Number.isInteger(number) ? number.toString() : number.toFixed(2);
};