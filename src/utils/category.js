export const CATEGORY_ENTITY_TYPES = ['wisata', 'hotel', 'restoran'];

export const CATEGORY_ENTITY_LABELS = {
  wisata: 'Objek Wisata',
  hotel: 'Hotel',
  restoran: 'Restoran',
};

export const CATEGORY_ENTITY_DESCRIPTIONS = {
  wisata: 'Kategori hanya akan muncul di form objek wisata.',
  hotel: 'Kategori hanya akan muncul di form hotel.',
  restoran: 'Kategori hanya akan muncul di form restoran.',
};

export function getCategoryEntityLabel(entityType) {
  return CATEGORY_ENTITY_LABELS[entityType] || entityType;
}

export function getCategoryAddLink(entityType) {
  if (!entityType) {
    return '/admin/categories/new';
  }

  return `/admin/categories/new?entity_type=${entityType}`;
}
