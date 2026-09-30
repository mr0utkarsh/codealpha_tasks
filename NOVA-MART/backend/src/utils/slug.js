/**
 * Creates a URL friendly slug from any text.
 *
 * @param {string} value
 * @returns {string}
 */
export function slugify(value) {
  return (
    String(value)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120) || 'product'
  );
}

export default slugify;
