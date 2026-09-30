/**
 * Pre-filled activity for the demo customer so that the cart, wishlist and
 * order history screens are never empty on a fresh install.
 *
 * All entries reference products by slug (see prisma/data/products/*).
 */
export const demoShippingAddress = {
  fullName: 'Aarav Mehta',
  email: 'demo@novamart.com',
  phone: '+1 (415) 555-0132',
  addressLine1: '2140 Market Street',
  addressLine2: 'Apartment 12B',
  city: 'San Francisco',
  state: 'CA',
  postalCode: '94114',
  country: 'United States',
};

export const demoCart = [
  { slug: 'apple-airpods', quantity: 1 },
  { slug: 'ceramic-planter-pot', quantity: 2 },
];

export const demoWishlist = [
  'rolex-datejust',
  'nike-air-jordan-1-red-and-black',
  'chanel-coco-noir-eau-de-parfum',
];

export const demoOrders = [
  {
    daysAgo: 34,
    status: 'DELIVERED',
    paymentMethod: 'CARD',
    paymentStatus: 'PAID',
    notes: 'Leave with the concierge if I am not home.',
    items: [
      { slug: 'apple-macbook-pro-14-space-grey', quantity: 1 },
      { slug: 'apple-airpods', quantity: 1 },
    ],
  },
  {
    daysAgo: 12,
    status: 'SHIPPED',
    paymentMethod: 'CARD',
    paymentStatus: 'PAID',
    notes: null,
    items: [{ slug: 'longines-master-collection', quantity: 1 }],
  },
  {
    daysAgo: 4,
    status: 'PROCESSING',
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    notes: 'Ring the bell twice.',
    items: [
      { slug: 'puma-future-rider-trainers', quantity: 1 },
      { slug: 'ceramic-planter-pot', quantity: 3 },
    ],
  },
];
