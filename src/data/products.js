export const categories = [
  { id: 5, name: 'П/ф замороженная продукция❄️' },
  { id: 6, name: 'Хлебобулочные изделия🥖' },
  { id: 7, name: 'Кондитерские изделия🧁\n/Кулинария🍴' },
];

const buildDefaultImagePath = (item) =>
  item && typeof item.id === 'number' ? `/product-images/${item.id}.webp` : undefined;

const withImages = (items) =>
  items.map((item) => ({
    ...item,
    image: item.image ?? buildDefaultImagePath(item),
  }));


export const productsByCategory = {
  'П/ф замороженная продукция❄️': withImages([
   
  ]),
  'Хлебобулочные изделия🥖':withImages( [
   
  ]),
  'Кондитерские изделия🧁\n/Кулинария🍴':withImages( [
  
  ]),
};