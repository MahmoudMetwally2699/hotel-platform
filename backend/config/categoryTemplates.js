/**
 * Service Category Templates
 *
 * Predefined templates for different service categories
 * Used to provide consistent service creation across providers
 */

const categoryTemplates = {
  laundry: {
    name: 'Laundry Services',
    icon: 'washing-machine',
    description: 'Professional laundry and dry cleaning services',
    items: [
      { name: 'T-Shirt', basePrice: 5, category: 'clothing' },
      { name: 'Dress Shirt', basePrice: 8, category: 'clothing' },
      { name: 'Pants/Trousers', basePrice: 10, category: 'clothing' },
      { name: 'Dress', basePrice: 12, category: 'clothing' },
      { name: 'Suit Jacket', basePrice: 15, category: 'clothing' },
      { name: 'Coat/Jacket', basePrice: 18, category: 'outerwear' },
      { name: 'Sweater', basePrice: 10, category: 'clothing' },
      { name: 'Jeans', basePrice: 8, category: 'clothing' },
      { name: 'Underwear (per piece)', basePrice: 3, category: 'undergarments' },
      { name: 'Socks (per pair)', basePrice: 2, category: 'undergarments' },
      { name: 'Bedsheet (single)', basePrice: 15, category: 'linens' },
      { name: 'Bedsheet (double)', basePrice: 20, category: 'linens' },
      { name: 'Pillowcase', basePrice: 5, category: 'linens' },
      { name: 'Towel', basePrice: 8, category: 'linens' },
      { name: 'Curtains', basePrice: 25, category: 'home' }
    ],
    serviceTypes: [
      {
        id: 'washing',
        name: 'Washing Only',
        description: 'Machine wash with appropriate detergent',
        priceModifier: 0,
        duration: { value: 24, unit: 'hours' }
      },
      {
        id: 'ironing',
        name: 'Ironing Only',
        description: 'Professional ironing and pressing',
        priceModifier: 0.3,
        duration: { value: 12, unit: 'hours' }
      },
      {
        id: 'washing_ironing',
        name: 'Washing + Ironing',
        description: 'Complete wash and iron service',
        priceModifier: 0.4,
        duration: { value: 24, unit: 'hours' },
        isPopular: true
      },
      {
        id: 'dry_cleaning',
        name: 'Dry Cleaning',
        description: 'Professional dry cleaning service',
        priceModifier: 1.5,
        duration: { value: 48, unit: 'hours' }
      },
      {
        id: 'express',
        name: 'Express Service (4 hours)',
        description: 'Rush service for urgent items',
        priceModifier: 2.0,
        duration: { value: 4, unit: 'hours' }
      },
      {
        id: 'standard',
        name: 'Standard Delivery (24 hours)',
        description: 'Regular pickup and delivery',
        priceModifier: 0,
        duration: { value: 24, unit: 'hours' }
      }
    ]
  },

  transportation: {
    name: 'Transportation Services',
    icon: 'car',
    description: 'Vehicle rental and transportation services',
    vehicleTypes: [
      {
        id: 'sedan',
        name: 'Sedan',
        capacity: 4,
        features: ['AC', 'Music System'],
        basePrice: 25,
        pricePerKm: 2
      },
      {
        id: 'suv',
        name: 'SUV',
        capacity: 7,
        features: ['AC', 'Music System', 'Extra Space'],
        basePrice: 40,
        pricePerKm: 3,
        isPopular: true
      },
      {
        id: 'luxury',
        name: 'Luxury Car',
        capacity: 4,
        features: ['AC', 'Premium Interior', 'WiFi', 'Refreshments'],
        basePrice: 80,
        pricePerKm: 5
      },
      {
        id: 'van',
        name: 'Van/Minibus',
        capacity: 12,
        features: ['AC', 'Large Space'],
        basePrice: 60,
        pricePerKm: 4
      }
    ],
    serviceTypes: [
      {
        id: 'hourly',
        name: 'Hourly Rental',
        description: 'Rent by the hour with driver',
        pricingType: 'per-hour',
        minimumHours: 2
      },
      {
        id: 'daily',
        name: 'Daily Rental',
        description: 'Full day rental with driver',
        pricingType: 'per-day',
        isPopular: true
      },
      {
        id: 'airport',
        name: 'Airport Transfer',
        description: 'One-way airport pickup/drop',
        pricingType: 'fixed'
      },
      {
        id: 'city_tour',
        name: 'City Tour',
        description: 'Guided city sightseeing',
        pricingType: 'fixed'
      }
    ]
  },

  tours: {
    name: 'Tours & Activities',
    icon: 'map',
    description: 'Guided tours and recreational activities',
    tourTypes: [
      {
        id: 'city_tour',
        name: 'City Sightseeing',
        duration: '4-6 hours',
        groupSize: { min: 2, max: 15 },
        basePrice: 50,
        includes: ['Guide', 'Transportation', 'Entry Tickets']
      },
      {
        id: 'cultural',
        name: 'Cultural Heritage',
        duration: '6-8 hours',
        groupSize: { min: 4, max: 20 },
        basePrice: 75,
        includes: ['Expert Guide', 'Transportation', 'Lunch', 'Entry Tickets'],
        isPopular: true
      },
      {
        id: 'adventure',
        name: 'Adventure Activities',
        duration: 'Full Day',
        groupSize: { min: 2, max: 8 },
        basePrice: 120,
        includes: ['Equipment', 'Guide', 'Safety Gear', 'Refreshments']
      },
      {
        id: 'food',
        name: 'Food & Culinary',
        duration: '3-4 hours',
        groupSize: { min: 2, max: 12 },
        basePrice: 60,
        includes: ['Food Tastings', 'Guide', 'Recipe Cards']
      },
      {
        id: 'nature',
        name: 'Nature & Wildlife',
        duration: '6-8 hours',
        groupSize: { min: 2, max: 10 },
        basePrice: 90,
        includes: ['Guide', 'Transportation', 'Binoculars', 'Lunch']
      }
    ]
  },

  spa: {
    name: 'Spa & Wellness',
    icon: 'spa',
    description: 'Relaxation and wellness services',
    treatments: [
      {
        id: 'massage',
        name: 'Therapeutic Massage',
        duration: [30, 60, 90],
        basePrice: 80,
        types: ['Swedish', 'Deep Tissue', 'Hot Stone', 'Aromatherapy']
      },
      {
        id: 'facial',
        name: 'Facial Treatment',
        duration: [45, 60, 75],
        basePrice: 60,
        types: ['Cleansing', 'Anti-Aging', 'Hydrating', 'Acne Treatment']
      },
      {
        id: 'body_treatment',
        name: 'Body Treatment',
        duration: [60, 90],
        basePrice: 100,
        types: ['Body Scrub', 'Body Wrap', 'Detox Treatment']
      }
    ]
  },

  dining: {
    name: 'Dining Services',
    icon: 'restaurant',
    description: 'Food delivery and catering services',
    cuisineTypes: [
      { id: 'local', name: 'Local Cuisine', isPopular: true },
      { id: 'italian', name: 'Italian' },
      { id: 'chinese', name: 'Chinese' },
      { id: 'indian', name: 'Indian' },
      { id: 'mexican', name: 'Mexican' },
      { id: 'japanese', name: 'Japanese' },
      { id: 'american', name: 'American' },
      { id: 'mediterranean', name: 'Mediterranean' }
    ],
    mealTypes: [
      { id: 'breakfast', name: 'Breakfast', timeRange: '06:00-11:00' },
      { id: 'lunch', name: 'Lunch', timeRange: '11:00-16:00' },
      { id: 'dinner', name: 'Dinner', timeRange: '18:00-23:00' },
      { id: 'snacks', name: 'Snacks & Beverages', timeRange: '24/7' }
    ]
  },

  entertainment: {
    name: 'Entertainment',
    icon: 'music',
    description: 'Entertainment and event services',
    eventTypes: [
      {
        id: 'live_music',
        name: 'Live Music Performance',
        duration: '2-4 hours',
        capacity: { min: 10, max: 200 },
        basePrice: 500
      },
      {
        id: 'dj',
        name: 'DJ Services',
        duration: '3-6 hours',
        capacity: { min: 20, max: 500 },
        basePrice: 300,
        isPopular: true
      },
      {
        id: 'cultural_show',
        name: 'Cultural Show',
        duration: '1-2 hours',
        capacity: { min: 15, max: 100 },
        basePrice: 400
      }
    ]
  },

  shopping: {
    name: 'Shopping Services',
    icon: 'shopping-bag',
    description: 'Personal shopping and delivery services',
    storeTypes: [
      { id: 'grocery', name: 'Grocery & Essentials', deliveryFee: 5 },
      { id: 'pharmacy', name: 'Pharmacy', deliveryFee: 3 },
      { id: 'clothing', name: 'Clothing & Fashion', deliveryFee: 8 },
      { id: 'electronics', name: 'Electronics', deliveryFee: 10 },
      { id: 'souvenirs', name: 'Souvenirs & Gifts', deliveryFee: 6, isPopular: true }
    ]
  },

  fitness: {
    name: 'Fitness & Sports',
    icon: 'dumbbell',
    description: 'Fitness training and sports activities',
    activities: [
      {
        id: 'personal_training',
        name: 'Personal Training',
        duration: [30, 45, 60],
        basePrice: 50,
        equipment: true
      },
      {
        id: 'yoga',
        name: 'Yoga Session',
        duration: [45, 60, 90],
        basePrice: 30,
        equipment: true,
        isPopular: true
      },
      {
        id: 'swimming',
        name: 'Swimming Instruction',
        duration: [30, 60],
        basePrice: 40,
        equipment: false
      }
    ]
  }
};

module.exports = categoryTemplates;
