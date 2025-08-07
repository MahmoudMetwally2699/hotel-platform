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
    description: 'Professional laundry and dry cleaning services',    items: [
      // Regular Clothing
      { name: 'T-Shirt', category: 'clothing' },
      { name: 'Dress Shirt', category: 'clothing' },
      { name: 'Short Sleeve Shirt', category: 'clothing' },
      { name: 'Long Sleeve Shirt', category: 'clothing' },
      { name: 'Pants/Trousers', category: 'clothing' },
      { name: 'Long Trousers', category: 'clothing' },
      { name: 'Shorts', category: 'clothing' },
      { name: 'Jeans', category: 'clothing' },
      { name: 'Dress', category: 'clothing' },
      { name: 'Skirt', category: 'clothing' },
      { name: 'Blouse', category: 'clothing' },
      { name: 'Sports T-Shirt', category: 'sportswear' },
      { name: 'Military T-Shirt', category: 'uniforms' },
      { name: 'Undershirt', category: 'undergarments' },

      // Suits and Formal Wear
      { name: 'Formal Suit', category: 'formal' },
      { name: 'Regular Suit', category: 'formal' },
      { name: 'Suit Jacket', category: 'formal' },
      { name: 'Pakistani Uniform', category: 'uniforms' },
      { name: 'Military Uniform', category: 'uniforms' },
      { name: 'Work Uniform', category: 'uniforms' },

      // Outerwear
      { name: 'Coat', category: 'outerwear' },
      { name: 'Overcoat', category: 'outerwear' },
      { name: 'Jacket', category: 'outerwear' },
      { name: 'Leather Jacket', category: 'outerwear' },
      { name: 'Tracksuit', category: 'sportswear' },
      { name: 'Sports Tracksuit', category: 'sportswear' },
      { name: 'Sweatshirt', category: 'sportswear' },
      { name: 'Hoodie', category: 'sportswear' },
      { name: 'Overalls', category: 'workwear' },
      { name: 'Jumpsuit', category: 'workwear' },

      // Traditional and Religious Wear
      { name: 'Thobe', category: 'traditional' },      { name: 'Embroidered Thobe', category: 'traditional' },
      { name: 'Wool Thobe', category: 'traditional' },
      { name: 'Kandura', category: 'traditional' },
      { name: 'Dishdasha', category: 'traditional' },
      { name: 'Jalabia', category: 'traditional' },
      { name: 'Abaya', category: 'traditional' },
      { name: 'Embroidered Abaya', category: 'traditional' },
      { name: 'Bisht', category: 'traditional' },
      { name: 'Cloak', category: 'traditional' },
      { name: 'Ihram', category: 'religious' },

      // Accessories and Headwear
      { name: 'Shemagh', category: 'accessories' },
      { name: 'Ghutra', category: 'accessories' },
      { name: 'Igal', category: 'accessories' },
      { name: 'Cap', category: 'accessories' },
      { name: 'Kufi', category: 'accessories' },
      { name: 'Skullcap', category: 'accessories' },
      { name: 'Headscarf', category: 'accessories' },

      // Undergarments and Sleepwear
      { name: 'Underwear (per piece)', category: 'undergarments' },
      { name: 'Socks (per pair)', category: 'undergarments' },
      { name: 'Pajamas', category: 'sleepwear' },

      // Linens and Home Items
      { name: 'Bedsheet (single)', category: 'linens' },
      { name: 'Bedsheet (double)', category: 'linens' },
      { name: 'Bed Sheets', category: 'linens' },
      { name: 'Light Sheet', category: 'linens' },
      { name: 'Pillowcase', category: 'linens' },
      { name: 'Duvet', category: 'linens' },
      { name: 'Blanket', category: 'linens' },
      { name: 'Towel', category: 'linens' },
      { name: 'Curtains', category: 'home' },
      { name: 'Rug', category: 'home' },
      { name: 'Sofa Cover', category: 'home' },
      { name: 'Chair Cover', category: 'home' },      { name: 'Furnishings', category: 'home' }
    ],

    // Simplified base service types (no fixed pricing multipliers)
    serviceTypes: [
      {
        id: 'wash_only',
        name: 'Wash Only',
        description: 'Machine wash with appropriate detergent',
        duration: { value: 24, unit: 'hours' }
      },
      {
        id: 'iron_only',
        name: 'Iron Only',
        description: 'Professional ironing and pressing',
        duration: { value: 12, unit: 'hours' }
      },
      {
        id: 'wash_iron',
        name: 'Wash + Iron',
        description: 'Complete wash and iron service',
        duration: { value: 24, unit: 'hours' },
        isPopular: true
      },
      {
        id: 'dry_cleaning',
        name: 'Dry Cleaning',
        description: 'Professional dry cleaning service',
        duration: { value: 48, unit: 'hours' }
      }    ],

    // Express surcharge configuration (service providers set their own rate)
    expressSurcharge: {
      name: 'Express Service',
      description: 'Rush 4-hour delivery service',
      duration: { value: 4, unit: 'hours' },
      isOptional: true // Service providers can choose to offer this
    },    // Simplified service combinations for package services (no fixed pricing)
    serviceCombinations: [
      {
        id: 'wash_only',
        name: 'Wash Only',
        description: 'Machine wash with appropriate detergent',
        serviceTypes: ['wash_only'],
        duration: { value: 24, unit: 'hours' },
        isPopular: false
      },
      {
        id: 'iron_only',
        name: 'Iron Only',
        description: 'Professional ironing and pressing',
        serviceTypes: ['iron_only'],
        duration: { value: 12, unit: 'hours' },
        isPopular: false
      },
      {
        id: 'wash_iron',
        name: 'Wash & Iron',
        description: 'Complete wash and iron service',
        serviceTypes: ['wash_iron'],
        duration: { value: 24, unit: 'hours' },
        isPopular: true
      },
      {
        id: 'dry_cleaning',
        name: 'Dry Cleaning',
        description: 'Professional dry cleaning service',
        serviceTypes: ['dry_cleaning'],
        duration: { value: 48, unit: 'hours' },
        isPopular: false
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
