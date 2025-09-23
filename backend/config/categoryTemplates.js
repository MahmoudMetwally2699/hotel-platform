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
        id: 'economy_sedan',
        name: 'Economy/Compact Car',
        capacity: { passengers: 4, luggage: 2 },
        description: 'Small, fuel-efficient cars perfect for city driving',
        features: ['Air Conditioning', 'Manual/Automatic', 'Fuel Efficient'],
        basePrice: 25,
        image: '/car-image/EconomyCompact Car.png'
      },
      {
        id: 'sedan',
        name: 'Sedan/Midsize',
        capacity: { passengers: 4, luggage: 3 },
        description: 'Comfortable sedans for business or leisure travel',
        features: ['Air Conditioning', 'Comfortable Seating', 'Trunk Space'],
        basePrice: 35,
        image: '/car-image/SedanMidsize.png'
      },
      {
        id: 'suv',
        name: 'SUV/Crossover',
        capacity: { passengers: 7, luggage: 4 },
        description: 'Spacious SUVs perfect for families or groups',
        features: ['Air Conditioning', '7 Seats', 'Large Cargo Space'],
        basePrice: 55,
        image: '/car-image/SUVCrossover.png'
      },
      {
        id: 'luxury_vehicle',
        name: 'Luxury/Premium',
        capacity: { passengers: 4, luggage: 3 },
        description: 'High-end vehicles for premium experience',
        features: ['Leather Seats', 'Premium Sound', 'Advanced Safety'],
        basePrice: 75,
        image: '/car-image/LuxuryPremium.png'
      },
      {
        id: 'van',
        name: 'Van/MPV',
        capacity: { passengers: 12, luggage: 6 },
        description: 'Large vans for group transportation',
        features: ['12 Passenger Seats', 'Air Conditioning', 'Large Storage'],
        basePrice: 85,
        image: '/car-image/VanMPV.png'
      },
      {
        id: 'van_large',
        name: 'Large Vehicle',
        capacity: { passengers: 15, luggage: 8 },
        description: 'Extra large vehicles for big groups',
        features: ['15+ Passenger Seats', 'Air Conditioning', 'Professional Driver'],
        basePrice: 120,
        image: '/car-image/Large Vehicle.png'
      }
    ],
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
  },

  dining: {
    name: 'Dining Services',
    icon: 'restaurant',
    description: 'Hotel restaurant and dining facilities',
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
    ],
    items: [
      // Breakfast Items
      { name: 'Continental Breakfast', category: 'breakfast', icon: '🍳' },
      { name: 'Full English Breakfast', category: 'breakfast', icon: '🥓' },
      { name: 'Pancakes', category: 'breakfast', icon: '🥞' },
      { name: 'French Toast', category: 'breakfast', icon: '🍞' },
      { name: 'Omelette', category: 'breakfast', icon: '🥚' },
      { name: 'Croissant', category: 'breakfast', icon: '🥐' },

      // Main Courses
      { name: 'Grilled Chicken', category: 'mains', icon: '🍗' },
      { name: 'Beef Steak', category: 'mains', icon: '🥩' },
      { name: 'Fish & Chips', category: 'mains', icon: '🐟' },
      { name: 'Pasta Carbonara', category: 'mains', icon: '🍝' },
      { name: 'Pizza Margherita', category: 'mains', icon: '🍕' },
      { name: 'Burger & Fries', category: 'mains', icon: '🍔' },

      // Beverages
      { name: 'Fresh Orange Juice', category: 'beverages', icon: '🍊' },
      { name: 'Coffee', category: 'beverages', icon: '☕' },
      { name: 'Tea', category: 'beverages', icon: '🍵' },
      { name: 'Soft Drinks', category: 'beverages', icon: '🥤' }
    ],
    serviceTypes: [
      { id: 'room_service', name: 'Room Service', icon: '🍽️', basePrice: 20, unit: 'per order', description: 'In-room dining service' },
      { id: 'restaurant_dining', name: 'Restaurant Dining', icon: '🍽️', basePrice: 25, unit: 'per person', description: 'Main restaurant service' },
      { id: 'catering', name: 'Catering', icon: '🎉', basePrice: 15, unit: 'per person', description: 'Event catering service' }
    ]
  },

  housekeeping: {
    name: 'Housekeeping Services',
    icon: 'broom',
    description: 'Room cleaning and maintenance services',
    serviceTypes: [
      {
        id: 'cleaning',
        name: 'Room Cleaning',
        description: 'Standard room cleaning service',
        features: ['Bed Making', 'Bathroom Cleaning', 'Floor Cleaning', 'Trash Removal'],
        basePrice: 25,
        duration: 60
      },
      {
        id: 'deep-cleaning',
        name: 'Deep Cleaning',
        description: 'Thorough deep cleaning service',
        features: ['All Standard Features', 'Window Cleaning', 'Carpet Cleaning', 'Detailed Sanitization'],
        basePrice: 45,
        duration: 120
      },
      {
        id: 'maintenance',
        name: 'Maintenance Request',
        description: 'Basic maintenance and repairs',
        features: ['Light Bulb Replacement', 'Minor Repairs', 'Equipment Check'],
        basePrice: 20,
        duration: 30
      },
      {
        id: 'amenities',
        name: 'Amenity Restocking',
        description: 'Restocking room amenities',
        features: ['Towel Replacement', 'Toiletries Refill', 'Mini Bar Restock'],
        basePrice: 15,
        duration: 20
      }
    ],
    services: [
      { id: 'daily_housekeeping', name: 'Daily Housekeeping', icon: '🧹', basePrice: 25, unit: 'per room', description: 'Daily room cleaning' },
      { id: 'express_cleaning', name: 'Express Cleaning', icon: '⚡', basePrice: 35, unit: 'per room', description: 'Quick 30-minute cleaning' },
      { id: 'deep_cleaning', name: 'Deep Cleaning', icon: '🧽', basePrice: 50, unit: 'per room', description: 'Thorough deep cleaning' },
      { id: 'maintenance_request', name: 'Maintenance Request', icon: '🔧', basePrice: 20, unit: 'per request', description: 'Basic maintenance service' }
    ]
  },

  // Housekeeping specific categories for detailed reporting and analysis
  housekeepingCategories: {
    maintenance: {
      electrical_issues: {
        name: 'Electrical Issues',
        icon: '⚡',
        examples: [
          'Power outage in room',
          'Key card not working',
          'Light bulb not working',
          'Power outlet issues',
          'Bathroom light issues',
          'AC not working electrically',
          'Refrigerator not cooling',
          'TV not turning on'
        ]
      },
      plumbing_issues: {
        name: 'Plumbing Issues',
        icon: '🔧',
        examples: [
          'Sink clogged',
          'Drain clogged',
          'Water leak',
          'Toilet flush issues',
          'AC leaking water',
          'No hot water',
          'Low water pressure'
        ]
      },
      ac_heating: {
        name: 'AC & Heating',
        icon: '❄️',
        examples: [
          'AC not cooling',
          'Heater not heating',
          'AC making noise',
          'Remote control issues'
        ]
      },
      furniture_repair: {
        name: 'Furniture Repair',
        icon: '🪑',
        examples: [
          'Chair or table repair',
          'Door lock issues',
          'Closet door stuck',
          'Curtain stuck',
          'Bed repair needed',
          'Window won\'t close'
        ]
      },
      electronics_issues: {
        name: 'Electronics Issues',
        icon: '📺',
        examples: [
          'TV not working',
          'WiFi connection problems',
          'TV remote not working',
          'Telephone problems'
        ]
      }
    },
    cleaning: {
      general_cleaning: {
        name: 'General Room Cleaning',
        icon: '🧹',
        examples: [
          'Bathroom cleaning',
          'Change bed sheets',
          'Vacuum floor',
          'Clean windows',
          'Empty trash',
          'Disinfect surfaces',
          'Mop bathroom floor',
          'Clean glass surfaces'
        ]
      },
      deep_cleaning: {
        name: 'Deep Cleaning',
        icon: '🧽',
        examples: [
          'Deep bathroom cleaning',
          'Clean refrigerator',
          'Clean behind furniture',
          'Sanitize door handles',
          'Clean air vents',
          'Polish wood surfaces',
          'Clean light fixtures',
          'Disinfect remote controls'
        ]
      },
      stain_removal: {
        name: 'Stain Removal',
        icon: '🧴',
        examples: [
          'Carpet stain removal',
          'Upholstery stains',
          'Wall marks removal',
          'Bathroom tile stains',
          'Water spots on glass',
          'Coffee stains',
          'Food stains',
          'Makeup stains'
        ]
      }
    },
    amenities: {
      bathroom_amenities: {
        name: 'Bathroom Amenities',
        icon: '🛁',
        examples: [
          'Fresh towels',
          'Extra towels',
          'Toiletries refill',
          'Toilet paper replacement',
          'New shower curtain',
          'Bath mat replacement',
          'Soap dispensers refill',
          'Hair dryer check'
        ]
      },
      room_supplies: {
        name: 'Room Supplies',
        icon: '🛏️',
        examples: [
          'Extra pillows',
          'Extra blankets',
          'Fresh bed linens',
          'Coffee supplies',
          'Mini bar restocking',
          'Ice bucket refill',
          'Fresh glasses',
          'Room service items'
        ]
      },
      cleaning_supplies: {
        name: 'Cleaning Supplies',
        icon: '🧴',
        examples: [
          'Vacuum cleaner bags',
          'Cleaning supplies restock',
          'Air freshener',
          'Tissue box replacement',
          'Hand sanitizer refill',
          'Disinfectant supplies',
          'Laundry bags',
          'Cleaning cloths'
        ]
      }
    }
  }
};

module.exports = categoryTemplates;
