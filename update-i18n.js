const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'frontend/src/i18n/locales/en/translation.json');
const arPath = path.join(__dirname, 'frontend/src/i18n/locales/ar/translation.json');

const enObj = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const arObj = JSON.parse(fs.readFileSync(arPath, 'utf8'));

enObj.guestOnboarding = {
  "steps": {
    "welcome": "Welcome",
    "personalInfo": "Personal Info",
    "tripPurpose": "Trip Purpose",
    "roomComfort": "Room Comfort",
    "foodAndBeverage": "Food & Beverage",
    "extraDetails": "Extra Details"
  },
  "purposes": {
    "business": "Business",
    "leisure": "Leisure",
    "familyVacation": "Family Vacation",
    "honeymoon": "Honeymoon",
    "event": "Event/Conference",
    "transit": "Transit"
  },
  "pillows": {
    "soft": "Soft",
    "medium": "Medium",
    "firm": "Firm"
  },
  "views": {
    "any": "Any",
    "city": "City",
    "pool": "Pool",
    "nature": "Nature"
  },
  "floors": {
    "lower": "Lower",
    "any": "Any",
    "higher": "Higher"
  },
  "messages": {
    "saveSuccess": "Preferences saved successfully!",
    "saveError": "Failed to save preferences. Please try again.",
    "validationError": "Please provide both your identification number and date of birth to continue."
  },
  "welcomeStep": {
    "title": "Welcome, {{name}}!",
    "subtitle": "We're thrilled to have you. Let's quickly personalize your stay with a few questions to ensure everything is perfect."
  },
  "personalStep": {
    "title": "Personal Details",
    "idType": "Identification Type",
    "nationalId": "National ID",
    "passport": "Passport",
    "nationalIdNumber": "National ID Number",
    "passportNumber": "Passport Number",
    "enterNationalId": "Enter your National ID",
    "enterPassport": "Enter your Passport number",
    "dateOfBirth": "Date of Birth"
  },
  "purposeStep": {
    "title": "What brings you here?"
  },
  "roomStep": {
    "title": "Your Room Comfort",
    "temperature": "Temperature",
    "cool": "16°C (Cool)",
    "ideal": "22°C (Ideal)",
    "warm": "30°C (Warm)",
    "pillowType": "Pillow Type",
    "floorPreference": "Floor Preference",
    "smokingRoom": "Smoking Room",
    "smokingDisclaimer": "Subject to hotel availability and policies."
  },
  "foodStep": {
    "title": "Food & Beverage",
    "morningDrink": {
      "title": "Favorite Morning Drink",
      "placeholder": "Select a preference...",
      "blackCoffee": "Black Coffee",
      "coffeeMilk": "Coffee with Milk",
      "espresso": "Espresso",
      "latte": "Latte / Cappuccino",
      "englishTea": "English Breakfast Tea",
      "greenTea": "Green Tea",
      "herbalTea": "Herbal Tea",
      "orangeJuice": "Orange Juice",
      "hotChocolate": "Hot Chocolate",
      "water": "Water",
      "noPreference": "No Preference"
    },
    "breakfastStyle": {
      "title": "Dietary Preferences / Breakfast Style",
      "placeholder": "Select a preference...",
      "continental": "Continental",
      "american": "Full English / American",
      "vegetarian": "Vegetarian",
      "vegan": "Vegan",
      "glutenFree": "Gluten-Free",
      "halal": "Halal",
      "kosher": "Kosher",
      "healthy": "Healthy / Low Calorie",
      "noPreference": "No Preference"
    }
  },
  "extraStep": {
    "title": "Extra Personalization",
    "subtitle": "Anything else we can do to make your stay perfect?",
    "placeholder": "Anniversary celebration, extra towels, early check-in request..."
  },
  "actions": {
    "back": "Back",
    "nextStep": "Next Step",
    "completeProfile": "Complete Profile",
    "saving": "Saving..."
  }
};

arObj.guestOnboarding = {
  "steps": {
    "welcome": "مرحباً",
    "personalInfo": "البيانات الشخصية",
    "tripPurpose": "غرض الرحلة",
    "roomComfort": "راحة الغرفة",
    "foodAndBeverage": "الطعام والشراب",
    "extraDetails": "تفاصيل إضافية"
  },
  "purposes": {
    "business": "عمل",
    "leisure": "ترفيه",
    "familyVacation": "عطلة عائلية",
    "honeymoon": "شهر عسل",
    "event": "فعالية/مؤتمر",
    "transit": "ترانزيت"
  },
  "pillows": {
    "soft": "ناعم",
    "medium": "متوسط",
    "firm": "صلب"
  },
  "views": {
    "any": "أي إطلالة",
    "city": "المدينة",
    "pool": "المسبح",
    "nature": "الطبيعة"
  },
  "floors": {
    "lower": "طابق سفلي",
    "any": "أي طابق",
    "higher": "طابق علوي"
  },
  "messages": {
    "saveSuccess": "تم حفظ التفضيلات بنجاح!",
    "saveError": "فشل حفظ التفضيلات. يرجى المحاولة مرة أخرى.",
    "validationError": "يرجى تقديم كلا من رقم إثبات الشخصية وتاريخ الميلاد للمتابعة."
  },
  "welcomeStep": {
    "title": "مرحباً بك، {{name}}!",
    "subtitle": "يسعدنا جداً استضافتك. دعنا نخصص إقامتك ببضعة أسئلة تأكد أن كل شيء مثالي."
  },
  "personalStep": {
    "title": "البيانات الشخصية",
    "idType": "نوع الهوية",
    "nationalId": "الهوية الوطنية",
    "passport": "جواز السفر",
    "nationalIdNumber": "رقم الهوية الوطنية",
    "passportNumber": "رقم جواز السفر",
    "enterNationalId": "أدخل رقم الهوية",
    "enterPassport": "أدخل رقم جواز السفر",
    "dateOfBirth": "تاريخ الميلاد"
  },
  "purposeStep": {
    "title": "ما هو غرض زيارتك؟"
  },
  "roomStep": {
    "title": "راحة غرفتك",
    "temperature": "درجة الحرارة",
    "cool": "16 مئوية (بارد)",
    "ideal": "22 مئوية (مثالي)",
    "warm": "30 مئوية (دافئ)",
    "pillowType": "نوع الوسادة",
    "floorPreference": "تفضيل الطابق",
    "smokingRoom": "غرفة للمدخنين",
    "smokingDisclaimer": "يخضع لتوفر الفندق وسياساته."
  },
  "foodStep": {
    "title": "الطعام والشراب",
    "morningDrink": {
      "title": "مشروب الصباح المفضل",
      "placeholder": "اختر تفضيلاً...",
      "blackCoffee": "قهوة سوداء",
      "coffeeMilk": "قهوة بالحليب",
      "espresso": "إسبريسو",
      "latte": "لاتيه / كابتشينو",
      "englishTea": "شاي الإفطار الإنجليزي",
      "greenTea": "شاي أخضر",
      "herbalTea": "شاي أعشاب",
      "orangeJuice": "عصير برتقال",
      "hotChocolate": "شوكولاتة ساخنة",
      "water": "ماء",
      "noPreference": "لا يوجد تفضيل"
    },
    "breakfastStyle": {
      "title": "التفضيلات الغذائية / نوع الإفطار",
      "placeholder": "اختر تفضيلاً...",
      "continental": "كونتيننتال",
      "american": "فطور أمريكي / إنجليزي",
      "vegetarian": "نباتي",
      "vegan": "نباتي صرف (فيغان)",
      "glutenFree": "خالي من الغلوتين",
      "halal": "حلال",
      "kosher": "كوشير",
      "healthy": "صحي / قليل السعرات",
      "noPreference": "لا يوجد تفضيل"
    }
  },
  "extraStep": {
    "title": "تخصيص إضافي",
    "subtitle": "هل هناك أي شيء آخر يمكننا القيام به لجعل إقامتك مثالية؟",
    "placeholder": "احتفال ذكرى سنوية، مناشف إضافية، طلب تسجيل دخول مبكر..."
  },
  "actions": {
    "back": "رجوع",
    "nextStep": "الخطوة التالية",
    "completeProfile": "إكمال الملف الشخصي",
    "saving": "جاري الحفظ..."
  }
};

fs.writeFileSync(enPath, JSON.stringify(enObj, null, 2), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(arObj, null, 2), 'utf8');
console.log('Successfully updated translation files.');
