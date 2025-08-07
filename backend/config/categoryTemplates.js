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
      { name: 'T-Shirt', category: 'clothing', icon: '👕' },
      { name: 'Dress Shirt', category: 'clothing', icon: '👔' },
      { name: 'Short Sleeve Shirt', category: 'clothing', icon: '👔' },
      { name: 'Long Sleeve Shirt', category: 'clothing', icon: '👔' },
      { name: 'Pants/Trousers', category: 'clothing', icon: '👖' },
      { name: 'Long Trousers', category: 'clothing', icon: '👖' },
      { name: 'Shorts', category: 'clothing', icon: '🩳' },
      { name: 'Jeans', category: 'clothing', icon: '👖' },
      { name: 'Dress', category: 'clothing', icon: '👗' },
      { name: 'Skirt', category: 'clothing', icon: '👗' },
      { name: 'Blouse', category: 'clothing', icon: '👚' },
      { name: 'Sports T-Shirt', category: 'sportswear', icon: '🏃' },
      { name: 'Military T-Shirt', category: 'uniforms', icon: '🎖️' },
      { name: 'Undershirt', category: 'undergarments', icon: '👕' },

      // Suits and Formal Wear
      { name: 'Formal Suit', category: 'formal', icon: '🤵' },
      { name: 'Regular Suit', category: 'formal', icon: '👔' },
      { name: 'Suit Jacket', category: 'formal', icon: '🧥' },
      { name: 'Pakistani Uniform', category: 'uniforms', icon: '👳' },
      { name: 'Military Uniform', category: 'uniforms', icon: '🎖️' },
      { name: 'Work Uniform', category: 'uniforms', icon: '👷' },

      // Outerwear
      { name: 'Coat', category: 'outerwear', icon: '🧥' },
      { name: 'Overcoat', category: 'outerwear', icon: '🧥' },
      { name: 'Jacket', category: 'outerwear', icon: '🧥' },
      { name: 'Leather Jacket', category: 'outerwear', icon: '🧥' },
      { name: 'Tracksuit', category: 'sportswear', icon: '🏃' },
      { name: 'Sports Tracksuit', category: 'sportswear', icon: '🏃' },
      { name: 'Sweatshirt', category: 'sportswear', icon: '👕' },
      { name: 'Hoodie', category: 'sportswear', icon: '🧥' },
      { name: 'Overalls', category: 'workwear', icon: '👷' },
      { name: 'Jumpsuit', category: 'workwear', icon: '👷' },

      // Traditional and Religious Wear
      { name: 'Thobe', category: 'traditional', icon: '🕌' },
      { name: 'Embroidered Thobe', category: 'traditional', icon: '🕌' },
      { name: 'Wool Thobe', category: 'traditional', icon: '🕌' },
      { name: 'Kandura', category: 'traditional', icon: '🕌' },
      { name: 'Dishdasha', category: 'traditional', icon: '🕌' },
      { name: 'Jalabia', category: 'traditional', icon: '🕌' },
      { name: 'Abaya', category: 'traditional', icon: '�' },
      { name: 'Embroidered Abaya', category: 'traditional', icon: '🧕' },
      { name: 'Bisht', category: 'traditional', icon: '🕌' },
      { name: 'Cloak', category: 'traditional', icon: '🕌' },
      { name: 'Ihram', category: 'religious', icon: '🕌' },

      // Accessories and Headwear
      { name: 'Shemagh', category: 'accessories', icon: '🧢' },
      { name: 'Ghutra', category: 'accessories', icon: '🧢' },
      { name: 'Igal', category: 'accessories', icon: '🧢' },
      { name: 'Cap', category: 'accessories', icon: '🧢' },
      { name: 'Kufi', category: 'accessories', icon: '🧢' },
      { name: 'Skullcap', category: 'accessories', icon: '🧢' },
      { name: 'Headscarf', category: 'accessories', icon: '🧕' },

      // Undergarments and Sleepwear
      { name: 'Underwear (per piece)', category: 'undergarments', icon: '🩲' },
      { name: 'Socks (per pair)', category: 'undergarments', icon: '🧦' },
      { name: 'Pajamas', category: 'sleepwear', icon: '😴' },

      // Linens and Home Items
      { name: 'Bedsheet (single)', category: 'linens', icon: '🛏️' },
      { name: 'Bedsheet (double)', category: 'linens', icon: '🛏️' },
      { name: 'Bed Sheets', category: 'linens', icon: '🛏️' },
      { name: 'Light Sheet', category: 'linens', icon: '🛏️' },
      { name: 'Pillowcase', category: 'linens', icon: '🛏️' },
      { name: 'Duvet', category: 'linens', icon: '🛏️' },
      { name: 'Blanket', category: 'linens', icon: '🛏️' },
      { name: 'Towel', category: 'linens', icon: '🏖️' },
      { name: 'Curtains', category: 'home', icon: '🪟' },
      { name: 'Rug', category: 'home', icon: '🏠' },
      { name: 'Sofa Cover', category: 'home', icon: '🛋️' },
      { name: 'Chair Cover', category: 'home', icon: '🪑' },
      { name: 'Furnishings', category: 'home', icon: '🏠' }
    ],// Simplified base service types (no fixed pricing multipliers)
    serviceTypes: [
      {
        id: 'wash_only',
        name: 'Wash Only',
        description: 'Machine wash with appropriate detergent',
        duration: { value: 24, unit: 'hours' },
        icon: '🧼'
      },
      {
        id: 'iron_only',
        name: 'Iron Only',
        description: 'Professional ironing and pressing',
        duration: { value: 12, unit: 'hours' },
        icon: '👕'
      },
      {
        id: 'wash_iron',
        name: 'Wash + Iron',
        description: 'Complete wash and iron service',
        duration: { value: 24, unit: 'hours' },
        icon: '⭐',
        isPopular: true
      },
      {
        id: 'dry_cleaning',
        name: 'Dry Cleaning',
        description: 'Professional dry cleaning service',
        duration: { value: 48, unit: 'hours' },
        icon: '✨'
      }
    ],// Express surcharge configuration (service providers set their own rate)
    expressSurcharge: {
      name: 'Express Service',
      description: 'Rush 4-hour delivery service',
      duration: { value: 4, unit: 'hours' },
      icon: '⚡',
      isOptional: true // Service providers can choose to offer this
    },    // Simplified service combinations for package services (no fixed pricing)
    serviceCombinations: [
      {
        id: 'wash_only',
        name: 'Wash Only',
        description: 'Machine wash with appropriate detergent',
        serviceTypes: ['wash_only'],
        duration: { value: 24, unit: 'hours' },
        icon: '🧼',
        isPopular: false
      },
      {
        id: 'iron_only',
        name: 'Iron Only',
        description: 'Professional ironing and pressing',
        serviceTypes: ['iron_only'],
        duration: { value: 12, unit: 'hours' },
        icon: '👕',
        isPopular: false
      },
      {
        id: 'wash_iron',
        name: 'Wash & Iron',
        description: 'Complete wash and iron service',
        serviceTypes: ['wash_iron'],
        duration: { value: 24, unit: 'hours' },
        icon: '⭐',
        isPopular: true
      },
      {
        id: 'dry_cleaning',
        name: 'Dry Cleaning',
        description: 'Professional dry cleaning service',
        serviceTypes: ['dry_cleaning'],
        duration: { value: 48, unit: 'hours' },
        icon: '✨',
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
