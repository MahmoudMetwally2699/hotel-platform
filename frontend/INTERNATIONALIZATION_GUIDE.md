# Internationalization (i18n) Implementation Guide

## Overview
This guide explains how to use the internationalization features implemented in the Hotel Service Management Platform. The system supports English and Arabic languages with full RTL (Right-to-Left) support.

## Features Implemented
- ✅ React-i18next integration
- ✅ English and Arabic language support
- ✅ RTL layout support for Arabic
- ✅ Language switcher component
- ✅ Persistent language selection
- ✅ Toast notifications RTL support
- ✅ Custom hooks for RTL handling

## Quick Start

### 1. Using Translations in Components

```javascript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <button>{t('common.submit')}</button>
    </div>
  );
};
```

### 2. Using the Language Switcher

```javascript
import LanguageSwitcher from '../components/common/LanguageSwitcher';

const Header = () => {
  return (
    <header>
      <div className="flex justify-between items-center">
        <h1>My App</h1>
        <LanguageSwitcher />
      </div>
    </header>
  );
};
```

### 3. Using RTL Support Hook

```javascript
import useRTL from '../hooks/useRTL';

const MyComponent = () => {
  const { isRTL, textAlign, marginLeft } = useRTL();

  return (
    <div className={`${textAlign} ${marginLeft('4')}`}>
      <p>This text adapts to RTL automatically</p>
    </div>
  );
};
```

## Translation Keys Structure

### Common Keys
```json
{
  "common": {
    "welcome": "Welcome",
    "login": "Login",
    "logout": "Logout",
    "submit": "Submit",
    "cancel": "Cancel",
    // ... more common keys
  }
}
```

### Navigation Keys
```json
{
  "navigation": {
    "home": "Home",
    "dashboard": "Dashboard",
    "services": "Services",
    // ... more navigation keys
  }
}
```

### Domain-Specific Keys
- `hotel.*` - Hotel management related translations
- `services.*` - Service management translations
- `booking.*` - Booking related translations
- `auth.*` - Authentication translations
- `errors.*` - Error messages
- `validation.*` - Form validation messages

## Adding New Translations

### Step 1: Add to English translations
Edit `src/i18n/locales/en/translation.json`:

```json
{
  "myNewSection": {
    "title": "My New Title",
    "description": "My new description"
  }
}
```

### Step 2: Add to Arabic translations
Edit `src/i18n/locales/ar/translation.json`:

```json
{
  "myNewSection": {
    "title": "العنوان الجديد",
    "description": "الوصف الجديد"
  }
}
```

### Step 3: Use in component
```javascript
const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h2>{t('myNewSection.title')}</h2>
      <p>{t('myNewSection.description')}</p>
    </div>
  );
};
```

## RTL Styling Guidelines

### Automatic RTL Support
The following are handled automatically:
- Text direction (`dir="rtl"`)
- Text alignment
- Toast notifications
- Document language attribute

### Manual RTL Adjustments
For components that need manual RTL support:

```javascript
import useRTL from '../hooks/useRTL';

const MyComponent = () => {
  const { isRTL } = useRTL();

  return (
    <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`${isRTL ? 'ml-4' : 'mr-4'}`}>Content</div>
    </div>
  );
};
```

### CSS RTL Support
Use the provided CSS classes:

```css
/* Automatically applied when Arabic is selected */
[dir="rtl"] .text-left {
  text-align: right !important;
}

[dir="rtl"] .text-right {
  text-align: left !important;
}
```

## Form Validation with i18n

```javascript
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';

const MyForm = () => {
  const { t } = useTranslation();

  const validationSchema = Yup.object({
    email: Yup.string()
      .email(t('errors.invalidEmail'))
      .required(t('errors.requiredField')),
    password: Yup.string()
      .min(6, t('errors.passwordTooShort'))
      .required(t('errors.requiredField'))
  });

  // ... rest of form component
};
```

## Advanced Features

### Dynamic Translations with Variables
```javascript
// Translation file
{
  "validation": {
    "minLength": "{{field}} must be at least {{min}} characters"
  }
}

// Component usage
const message = t('validation.minLength', { field: 'Password', min: 6 });
```

### Pluralization Support
```javascript
// Translation file
{
  "items": {
    "item_zero": "No items",
    "item_one": "{{count}} item",
    "item_other": "{{count}} items"
  }
}

// Component usage
const message = t('items.item', { count: itemCount });
```

## Performance Considerations

### Lazy Loading Translations
For large applications, consider splitting translations:

```javascript
// In i18n/index.js
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // ... other config
  });
```

## Testing i18n

### Testing Components with Translations
```javascript
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

const renderWithI18n = (component) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  );
};

test('renders translated text', () => {
  const { getByText } = renderWithI18n(<MyComponent />);
  expect(getByText('Welcome')).toBeInTheDocument();
});
```

## Troubleshooting

### Common Issues

1. **Translations not updating**: Make sure to restart the development server after adding new translation files.

2. **RTL layout issues**: Check if custom CSS is overriding RTL styles. Use `!important` if necessary.

3. **Missing translations**: The app will show the translation key if a translation is missing. Check browser console for warnings.

4. **Language not persisting**: Ensure localStorage is enabled and working in the browser.

## Best Practices

1. **Consistent Key Structure**: Use a hierarchical structure for translation keys
2. **Descriptive Keys**: Use meaningful key names that describe the content
3. **Avoid Hardcoded Text**: Always use translation keys, never hardcode user-facing text
4. **Test Both Languages**: Always test your components in both English and Arabic
5. **RTL Testing**: Verify that your layouts work correctly in RTL mode
6. **Accessibility**: Ensure proper `lang` and `dir` attributes are set

## File Structure
```
src/
├── i18n/
│   ├── index.js                    # i18n configuration
│   └── locales/
│       ├── en/
│       │   └── translation.json    # English translations
│       └── ar/
│           └── translation.json    # Arabic translations
├── components/
│   └── common/
│       └── LanguageSwitcher.js     # Language switcher component
├── hooks/
│   └── useRTL.js                   # RTL support hook
└── contexts/
    └── I18nContext.js              # Enhanced i18n context (optional)
```

## Next Steps

1. **Add more languages**: Create new translation files in `src/i18n/locales/`
2. **Improve RTL support**: Add more RTL-specific styles as needed
3. **Add date/number formatting**: Implement locale-specific formatting
4. **Performance optimization**: Implement lazy loading for large translation files
5. **Testing**: Add comprehensive tests for i18n functionality
