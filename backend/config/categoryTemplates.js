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
      { name: 'Thobe', category: 'traditional' },
      { name: 'Embroidered Thobe', category: 'traditional' },
      { name: 'Kaftan', category: 'traditional' },
      { name: 'Abaya', category: 'traditional' },
      { name: 'Hijab', category: 'traditional' },
      { name: 'Prayer Clothes', category: 'religious' },

      // Undergarments and Delicates
      { name: 'Underwear', category: 'undergarments' },
      { name: 'Bra', category: 'undergarments' },
      { name: 'Socks', category: 'undergarments' },
      { name: 'Stockings', category: 'undergarments' },
      { name: 'Ties', category: 'accessories' },
      { name: 'Scarves', category: 'accessories' },

      // Bedding and Household Items
      { name: 'Bed Sheets', category: 'bedding' },
      { name: 'Pillowcases', category: 'bedding' },
      { name: 'Blankets', category: 'bedding' },
      { name: 'Comforters', category: 'bedding' },
      { name: 'Curtains', category: 'household' },
      { name: 'Table Cloths', category: 'household' },
      { name: 'Towels', category: 'household' },
      { name: 'Cloth Diapers', category: 'baby' }
    ],
    services: [
      { name: 'Wash & Fold', basePrice: 3, unit: 'per kg' },
      { name: 'Dry Cleaning', basePrice: 15, unit: 'per piece' },
      { name: 'Iron Only', basePrice: 2, unit: 'per piece' },
      { name: 'Express Service', basePrice: 5, unit: 'surcharge', description: 'Same day delivery' },
      { name: 'Stain Removal', basePrice: 8, unit: 'per piece', description: 'Special treatment for tough stains' }
    ]
  },

  transportation: {
    name: 'Transportation Services',
    icon: 'car',
    description: 'Vehicle rental and transportation services',
    vehicleTypes: [
      {
        id: 'economy',
        name: 'Economy/Compact Car',
        capacity: 4,
        description: 'Small, fuel-efficient cars perfect for city driving',
        features: ['Air Conditioning', 'Manual/Automatic', 'Fuel Efficient'],
        basePrice: 25,
        image: '/car-image/EconomyCompact Car.png'
      },
      {
        id: 'sedan',
        name: 'Sedan/Midsize',
        capacity: 4,
        description: 'Comfortable sedans for business or leisure travel',
        features: ['Air Conditioning', 'Comfortable Seating', 'Trunk Space'],
        basePrice: 35,
        image: '/car-image/SedanMidsize.png'
      },
      {
        id: 'suv',
        name: 'SUV/Crossover',
        capacity: 7,
        description: 'Spacious SUVs perfect for families or groups',
        features: ['Air Conditioning', '7 Seats', 'Large Cargo Space'],
        basePrice: 55,
        image: '/car-image/SUVCrossover.png'
      },
      {
        id: 'luxury',
        name: 'Luxury/Premium',
        capacity: 4,
        description: 'High-end vehicles for premium experience',
        features: ['Leather Seats', 'Premium Sound', 'Advanced Safety'],
        basePrice: 75,
        image: '/car-image/LuxuryPremium.png'
      },
      {
        id: 'van',
        name: 'Van/MPV',
        capacity: 12,
        description: 'Large vans for group transportation',
        features: ['12 Passenger Seats', 'Air Conditioning', 'Large Storage'],
        basePrice: 85,
        image: '/car-image/VanMPV.png'
      },
      {
        id: 'large',
        name: 'Large Vehicle',
        capacity: 15,
        description: 'Extra large vehicles for big groups',
        features: ['15+ Passenger Seats', 'Air Conditioning', 'Professional Driver'],
        basePrice: 120,
        image: '/car-image/Large Vehicle.png'
      }
    ],
    services: [
      { name: 'Hourly Rental', basePrice: 15, unit: 'per hour', description: 'Flexible hourly rental' },
      { name: 'Daily Rental', basePrice: 50, unit: 'per day', description: 'Full day rental' },
      { name: 'Airport Transfer', basePrice: 30, unit: 'per trip', description: 'One-way airport transfer' },
      { name: 'City Tour', basePrice: 80, unit: 'per day', description: 'Guided city tour with driver' }
    ]
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
    services: [
      { name: 'Room Service', basePrice: 20, unit: 'per order', description: 'In-room dining service' },
      { name: 'Restaurant Dining', basePrice: 25, unit: 'per person', description: 'Main restaurant service' },
      { name: 'Catering', basePrice: 15, unit: 'per person', description: 'Event catering service' }
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
      { name: 'Daily Housekeeping', basePrice: 25, unit: 'per room', description: 'Daily room cleaning' },
      { name: 'Express Cleaning', basePrice: 35, unit: 'per room', description: 'Quick 30-minute cleaning' },
      { name: 'Deep Cleaning', basePrice: 50, unit: 'per room', description: 'Thorough deep cleaning' },
      { name: 'Maintenance Request', basePrice: 20, unit: 'per request', description: 'Basic maintenance service' }
    ]
  }
};

module.exports = categoryTemplates;
