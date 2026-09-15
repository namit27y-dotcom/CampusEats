import type React from 'react';

export const DEFAULT_FOOD_IMAGES = {
  coldCoffee: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
  tea: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
  filterCoffee: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
  vadaPav: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80',
  samosa: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
  dosa: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80',
  idli: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
  paneerRoll: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
  choleBhature: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
  lemonTea: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
  riceBowl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
  noodles: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
  combo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  shake: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80',
};

export function getFoodImage(
  name?: string,
  category?: string,
  currentImageUrl?: string | null
): string {
  if (currentImageUrl && typeof currentImageUrl === 'string' && currentImageUrl.trim()) {
    const trimmed = currentImageUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image')) {
      return trimmed;
    }
  }

  const cleanName = (name || '').toLowerCase();

  // Specific dish keyword matchers
  if (cleanName.includes('cold coffee') || cleanName.includes('frappe') || cleanName.includes('iced coffee')) {
    return DEFAULT_FOOD_IMAGES.coldCoffee;
  }
  if (cleanName.includes('vada pav') || cleanName.includes('vadapav') || cleanName.includes('wada pav') || cleanName.includes('batata vada')) {
    return DEFAULT_FOOD_IMAGES.vadaPav;
  }
  if (cleanName.includes('samosa')) {
    return DEFAULT_FOOD_IMAGES.samosa;
  }
  if (cleanName.includes('tea') || cleanName.includes('chai')) {
    if (cleanName.includes('lemon') || cleanName.includes('iced')) {
      return DEFAULT_FOOD_IMAGES.lemonTea;
    }
    return DEFAULT_FOOD_IMAGES.tea;
  }
  if (cleanName.includes('filter coffee') || cleanName.includes('hot coffee') || cleanName.includes('espresso') || cleanName.includes('cappuccino') || cleanName.includes('latte')) {
    return DEFAULT_FOOD_IMAGES.filterCoffee;
  }
  if (cleanName.includes('sandwich') || cleanName.includes('toast') || cleanName.includes('panini') || cleanName.includes('club sandwich')) {
    return DEFAULT_FOOD_IMAGES.sandwich;
  }
  if (cleanName.includes('dosa') || cleanName.includes('uttapam')) {
    return DEFAULT_FOOD_IMAGES.dosa;
  }
  if (cleanName.includes('idli') || cleanName.includes('medu vada')) {
    return DEFAULT_FOOD_IMAGES.idli;
  }
  if (cleanName.includes('roll') || cleanName.includes('kathi') || cleanName.includes('frankie') || cleanName.includes('wrap')) {
    return DEFAULT_FOOD_IMAGES.paneerRoll;
  }
  if (cleanName.includes('chole') || cleanName.includes('bhature') || cleanName.includes('puri') || cleanName.includes('poori')) {
    return DEFAULT_FOOD_IMAGES.choleBhature;
  }
  if (cleanName.includes('burger')) {
    return DEFAULT_FOOD_IMAGES.burger;
  }
  if (cleanName.includes('maggi') || cleanName.includes('noodle') || cleanName.includes('chow mein') || cleanName.includes('chowmein') || cleanName.includes('pasta')) {
    return DEFAULT_FOOD_IMAGES.noodles;
  }
  if (cleanName.includes('rice') || cleanName.includes('rajma') || cleanName.includes('biryani') || cleanName.includes('pulao') || cleanName.includes('thali') || cleanName.includes('curry')) {
    return DEFAULT_FOOD_IMAGES.riceBowl;
  }
  if (cleanName.includes('pizza')) {
    return DEFAULT_FOOD_IMAGES.pizza;
  }
  if (cleanName.includes('shake') || cleanName.includes('smoothie') || cleanName.includes('juice') || cleanName.includes('lassi')) {
    return DEFAULT_FOOD_IMAGES.shake;
  }
  if (cleanName.includes('coffee')) {
    return DEFAULT_FOOD_IMAGES.coldCoffee;
  }

  // Category fallback
  const cleanCat = (category || '').toLowerCase();
  if (cleanCat === 'drinks' || cleanCat === 'beverages') {
    return DEFAULT_FOOD_IMAGES.coldCoffee;
  }
  if (cleanCat === 'breakfast') {
    return DEFAULT_FOOD_IMAGES.dosa;
  }
  if (cleanCat === 'meals' || cleanCat === 'meals & bowls') {
    return DEFAULT_FOOD_IMAGES.riceBowl;
  }
  if (cleanCat === 'snacks') {
    return DEFAULT_FOOD_IMAGES.samosa;
  }
  if (cleanCat === 'combos') {
    return DEFAULT_FOOD_IMAGES.combo;
  }

  return DEFAULT_FOOD_IMAGES.combo;
}

export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  name?: string,
  category?: string
) {
  const target = event.currentTarget;
  const fallback = getFoodImage(name, category);
  if (target.src !== fallback) {
    target.src = fallback;
  }
}
