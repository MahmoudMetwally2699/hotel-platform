const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/pages/guest/GuestOnboardingWizard.js');
let code = fs.readFileSync(filePath, 'utf8');

// Import useTranslation
code = code.replace(
  "import { toast } from 'react-hot-toast';", 
  "import { toast } from 'react-hot-toast';\nimport { useTranslation } from 'react-i18next';"
);

// Initialize useTranslation
code = code.replace(
  "const user = useSelector(selectCurrentUser);", 
  "const user = useSelector(selectCurrentUser);\n  const { t } = useTranslation();"
);

// Replace steps
code = code.replace(
  "    { title: 'Welcome', id: 'welcome' },",
  "    { title: t('guestOnboarding.steps.welcome'), id: 'welcome' },"
).replace(
  "    { title: 'Personal Info', id: 'personal' },",
  "    { title: t('guestOnboarding.steps.personalInfo'), id: 'personal' },"
).replace(
  "    { title: 'Trip Purpose', id: 'purpose' },",
  "    { title: t('guestOnboarding.steps.tripPurpose'), id: 'purpose' },"
).replace(
  "    { title: 'Room Comfort', id: 'room' },",
  "    { title: t('guestOnboarding.steps.roomComfort'), id: 'room' },"
).replace(
  "    { title: 'Food & Beverage', id: 'food' },",
  "    { title: t('guestOnboarding.steps.foodAndBeverage'), id: 'food' },"
).replace(
  "    { title: 'Extra Details', id: 'extra' },",
  "    { title: t('guestOnboarding.steps.extraDetails'), id: 'extra' },"
);

// Replace purposes
code = code.replace(
  "    { value: 'Business', label: 'Business', icon: <HiBriefcase className=\"w-6 h-6\" /> },",
  "    { value: 'Business', label: t('guestOnboarding.purposes.business'), icon: <HiBriefcase className=\"w-6 h-6\" /> },"
).replace(
  "    { value: 'Leisure', label: 'Leisure', icon: <HiOutlineSun className=\"w-6 h-6\" /> },",
  "    { value: 'Leisure', label: t('guestOnboarding.purposes.leisure'), icon: <HiOutlineSun className=\"w-6 h-6\" /> },"
).replace(
  "    { value: 'Family Vacation', label: 'Family Vacation', icon: <HiHome className=\"w-6 h-6\" /> },",
  "    { value: 'Family Vacation', label: t('guestOnboarding.purposes.familyVacation'), icon: <HiHome className=\"w-6 h-6\" /> },"
).replace(
  "    { value: 'Honeymoon', label: 'Honeymoon', icon: <HiHeart className=\"w-6 h-6\" /> },",
  "    { value: 'Honeymoon', label: t('guestOnboarding.purposes.honeymoon'), icon: <HiHeart className=\"w-6 h-6\" /> },"
).replace(
  "    { value: 'Event/Conference', label: 'Event', icon: <HiOfficeBuilding className=\"w-6 h-6\" /> },",
  "    { value: 'Event/Conference', label: t('guestOnboarding.purposes.event'), icon: <HiOfficeBuilding className=\"w-6 h-6\" /> },"
).replace(
  "    { value: 'Transit', label: 'Transit', icon: <HiArrowRight className=\"w-6 h-6\" /> },",
  "    { value: 'Transit', label: t('guestOnboarding.purposes.transit'), icon: <HiArrowRight className=\"w-6 h-6\" /> },"
);

// Replace lists
code = code.replace("['Soft', 'Medium', 'Firm']", "[t('guestOnboarding.pillows.soft'), t('guestOnboarding.pillows.medium'), t('guestOnboarding.pillows.firm')]");
code = code.replace("['Lower', 'Any', 'Higher']", "[t('guestOnboarding.floors.lower'), t('guestOnboarding.floors.any'), t('guestOnboarding.floors.higher')]");

// Re-map internal view options to translated ones but keep tracking internal values (or we can just replace what's displayed).
// Wait, the state shouldn't be the translated value ideally. 
// Ah, previously it WAS the mapped value.
// It is better to map in the render only. But the state gets updated with translated string if we map `map(pillow => <button...>...)`
// So it stores the translated value. That's how it was originally designed, so let's keep it.
code = code.replace("['Any', 'City', 'Pool', 'Nature']", "[t('guestOnboarding.views.any'), t('guestOnboarding.views.city'), t('guestOnboarding.views.pool'), t('guestOnboarding.views.nature')]");

// Messages
code = code.replace(
  "toast.error('Please provide both your identification number and date of birth to continue.');",
  "toast.error(t('guestOnboarding.messages.validationError'));"
).replace(
  "toast.success('Preferences saved successfully!');",
  "toast.success(t('guestOnboarding.messages.saveSuccess'));"
).replace(
  "toast.error('Failed to save preferences. Please try again.');",
  "toast.error(t('guestOnboarding.messages.saveError'));"
);

// Welcome step
code = code.replace(
  "Welcome, {user?.firstName}!",
  "{t('guestOnboarding.welcomeStep.title', { name: user?.firstName })}"
).replace(
  "We're thrilled to have you. Let's quickly personalize your stay with a few questions to ensure everything is perfect.",
  "{t('guestOnboarding.welcomeStep.subtitle')}"
);

// Personal Step
code = code.replace(
  "Personal Details",
  "{t('guestOnboarding.personalStep.title')}"
).replace(
  "Identification Type",
  "{t('guestOnboarding.personalStep.idType')}"
).replace(
  ">National ID<",
  ">{t('guestOnboarding.personalStep.nationalId')}<"
).replace(
  ">Passport<",
  ">{t('guestOnboarding.personalStep.passport')}<"
).replace(
  "{formData.idType === 'national_id' ? 'National ID Number' : 'Passport Number'}",
  "{formData.idType === 'national_id' ? t('guestOnboarding.personalStep.nationalIdNumber') : t('guestOnboarding.personalStep.passportNumber')}"
).replace(
  "{formData.idType === 'national_id' ? 'Enter your National ID' : 'Enter your Passport number'}",
  "{formData.idType === 'national_id' ? t('guestOnboarding.personalStep.enterNationalId') : t('guestOnboarding.personalStep.enterPassport')}"
).replace(
  ">Date of Birth <",
  ">{t('guestOnboarding.personalStep.dateOfBirth')} <"
);

// Purpose step
code = code.replace(
  ">What brings you here?<",
  ">{t('guestOnboarding.purposeStep.title')}<"
);

// Room comfort Step
code = code.replace(
  ">Your Room Comfort<",
  ">{t('guestOnboarding.roomStep.title')}<"
).replace(
  ">Temperature<",
  ">{t('guestOnboarding.roomStep.temperature')}<"
).replace(
  "16°C (Cool)",
  "{t('guestOnboarding.roomStep.cool')}"
).replace(
  "22°C (Ideal)",
  "{t('guestOnboarding.roomStep.ideal')}"
).replace(
  "30°C (Warm)",
  "{t('guestOnboarding.roomStep.warm')}"
).replace(
  ">Pillow Type<",
  ">{t('guestOnboarding.roomStep.pillowType')}<"
).replace(
  ">Floor Preference<",
  ">{t('guestOnboarding.roomStep.floorPreference')}<"
).replace(
  ">Smoking Room<",
  ">{t('guestOnboarding.roomStep.smokingRoom')}<"
).replace(
  ">Subject to hotel availability and policies.<",
  ">{t('guestOnboarding.roomStep.smokingDisclaimer')}<"
);

// Food Step
code = code.replace(
  ">Food & Beverage<",
  ">{t('guestOnboarding.foodStep.title')}<"
).replace(
  ">Favorite Morning Drink<",
  ">{t('guestOnboarding.foodStep.morningDrink.title')}<"
).replace(
  "Select a preference...",
  "{t('guestOnboarding.foodStep.morningDrink.placeholder')}"
).replace(
  ">Black Coffee<",
  ">{t('guestOnboarding.foodStep.morningDrink.blackCoffee')}<"
).replace(
  ">Coffee with Milk<",
  ">{t('guestOnboarding.foodStep.morningDrink.coffeeMilk')}<"
).replace(
  ">Espresso<",
  ">{t('guestOnboarding.foodStep.morningDrink.espresso')}<"
).replace(
  ">Latte / Cappuccino<",
  ">{t('guestOnboarding.foodStep.morningDrink.latte')}<"
).replace(
  ">English Breakfast Tea<",
  ">{t('guestOnboarding.foodStep.morningDrink.englishTea')}<"
).replace(
  ">Green Tea<",
  ">{t('guestOnboarding.foodStep.morningDrink.greenTea')}<"
).replace(
  ">Herbal Tea<",
  ">{t('guestOnboarding.foodStep.morningDrink.herbalTea')}<"
).replace(
  ">Orange Juice<",
  ">{t('guestOnboarding.foodStep.morningDrink.orangeJuice')}<"
).replace(
  ">Hot Chocolate<",
  ">{t('guestOnboarding.foodStep.morningDrink.hotChocolate')}<"
).replace(
  ">Water<",
  ">{t('guestOnboarding.foodStep.morningDrink.water')}<"
).replace(
  ">No Preference<",
  ">{t('guestOnboarding.foodStep.morningDrink.noPreference')}<"
);

// Food step (breakfast style)
code = code.replace(
  ">Dietary Preferences / Breakfast Style<",
  ">{t('guestOnboarding.foodStep.breakfastStyle.title')}<"
).replace(
  ">Continental<",
  ">{t('guestOnboarding.foodStep.breakfastStyle.continental')}<"
).replace(
  ">Full English / American<",
  ">{t('guestOnboarding.foodStep.breakfastStyle.american')}<"
).replace(
  ">Vegetarian<",
  ">{t('guestOnboarding.foodStep.breakfastStyle.vegetarian')}<"
).replace(
  ">Vegan<",
  ">{t('guestOnboarding.foodStep.breakfastStyle.vegan')}<"
).replace(
  ">Gluten-Free<",
  ">{t('guestOnboarding.foodStep.breakfastStyle.glutenFree')}<"
).replace(
  ">Halal<",
  ">{t('guestOnboarding.foodStep.breakfastStyle.halal')}<"
).replace(
  ">Kosher<",
  ">{t('guestOnboarding.foodStep.breakfastStyle.kosher')}<"
).replace(
  ">Healthy / Low Calorie<",
  ">{t('guestOnboarding.foodStep.breakfastStyle.healthy')}<"
);

// Extra details
code = code.replace(
  ">Extra Personalization<",
  ">{t('guestOnboarding.extraStep.title')}<"
).replace(
  ">Anything else we can do to make your stay perfect?<",
  ">{t('guestOnboarding.extraStep.subtitle')}<"
).replace(
  "\"Anniversary celebration, extra towels, early check-in request...\"",
  "t('guestOnboarding.extraStep.placeholder')"
);

// Actions
code = code.replace(
  "> Back<",
  ">{t('guestOnboarding.actions.back')}<"
).replace(
  ">Saving...<",
  ">{t('guestOnboarding.actions.saving')}<"
).replace(
  "Complete Profile <",
  "{t('guestOnboarding.actions.completeProfile')} <"
).replace(
  "Next Step <",
  "{t('guestOnboarding.actions.nextStep')} <"
);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully replaced strings in GuestOnboardingWizard.');
