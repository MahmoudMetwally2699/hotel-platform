/**
 * Hotel Branding Settings Page
 * Allows hotel admins to customize their dashboard colors and branding
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const BrandingSettingsPage = () => {
  const { t } = useTranslation();
  const { theme, updateBranding, resetTheme, isLoading } = useTheme();
  const [colors, setColors] = useState({
    primaryColor: '#3B5787',
    secondaryColor: '#67BAE0',
    sidebarColor: '#1F2937',
    sidebarTextColor: '#FFFFFF',
    headerColor: '#FFFFFF',
    backgroundColor: '#F8FAFC',
    accentColor: '#10B981'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (theme) {
      setColors({
        primaryColor: theme.primaryColor || '#3B5787',
        secondaryColor: theme.secondaryColor || '#67BAE0',
        sidebarColor: theme.sidebarColor || '#1F2937',
        sidebarTextColor: theme.sidebarTextColor || '#FFFFFF',
        headerColor: theme.headerColor || '#FFFFFF',
        backgroundColor: theme.backgroundColor || '#F8FAFC',
        accentColor: theme.accentColor || '#10B981'
      });
    }
  }, [theme]);

  const handleColorChange = (colorKey, value) => {
    setColors(prev => ({
      ...prev,
      [colorKey]: value
    }));
    setHasChanges(true);
    setMessage({ type: '', text: '' });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    const result = await updateBranding(colors);

    if (result.success) {
      setMessage({ type: 'success', text: 'Branding settings saved successfully!' });
      setHasChanges(false);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to save branding settings' });
    }

    setIsSaving(false);
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset to default colors?')) {
      const defaultColors = {
        primaryColor: '#48ACDA',
        secondaryColor: '#48ACDA',
        sidebarColor: '#FFFFFF',
        sidebarTextColor: '#3B5787',
        headerColor: '#FFFFFF',
        backgroundColor: '#F8FAFC',
        accentColor: '#85C8E6'
      };

      setColors(defaultColors);
      setIsSaving(true);

      // Save the default colors to the database
      const result = await updateBranding(defaultColors);

      if (result.success) {
        resetTheme();
        setHasChanges(false);
        setMessage({ type: 'success', text: 'Colors reset to default and saved successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save default colors' });
      }

      setIsSaving(false);
    }
  };

  const presetThemes = [
    {
      name: 'Ocean Blue',
      colors: {
        primaryColor: '#3B5787',
        secondaryColor: '#67BAE0',
        sidebarColor: '#1F2937',
        sidebarTextColor: '#FFFFFF',
        headerColor: '#FFFFFF',
        backgroundColor: '#F8FAFC',
        accentColor: '#10B981'
      }
    },
    {
      name: 'Royal Purple',
      colors: {
        primaryColor: '#7C3AED',
        secondaryColor: '#A78BFA',
        sidebarColor: '#1F1B24',
        sidebarTextColor: '#FFFFFF',
        headerColor: '#FFFFFF',
        backgroundColor: '#FAF5FF',
        accentColor: '#8B5CF6'
      }
    },
    {
      name: 'Emerald Green',
      colors: {
        primaryColor: '#059669',
        secondaryColor: '#34D399',
        sidebarColor: '#064E3B',
        sidebarTextColor: '#FFFFFF',
        headerColor: '#FFFFFF',
        backgroundColor: '#F0FDF4',
        accentColor: '#10B981'
      }
    },
    {
      name: 'Sunset Orange',
      colors: {
        primaryColor: '#EA580C',
        secondaryColor: '#FB923C',
        sidebarColor: '#431407',
        sidebarTextColor: '#FFFFFF',
        headerColor: '#FFFFFF',
        backgroundColor: '#FFF7ED',
        accentColor: '#F97316'
      }
    },
    {
      name: 'Midnight Dark',
      colors: {
        primaryColor: '#4F46E5',
        secondaryColor: '#818CF8',
        sidebarColor: '#0F172A',
        sidebarTextColor: '#F1F5F9',
        headerColor: '#1E293B',
        backgroundColor: '#F8FAFC',
        accentColor: '#6366F1'
      }
    }
  ];

  const applyPreset = (preset) => {
    setColors(preset.colors);
    setHasChanges(true);
    setMessage({ type: 'info', text: `Applied ${preset.name} theme` });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-modern-lightBlue border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-modern-gray to-white p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Branding Settings</h1>
            <p className="text-gray-600 mt-2">Customize your dashboard colors and brand identity</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
            >
              Reset to Default
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                hasChanges && !isSaving
                  ? 'bg-gradient-to-r from-modern-blue to-modern-lightBlue text-white hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mt-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Color Customization */}
        <div className="lg:col-span-2 space-y-6">
          {/* Primary Colors */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Primary Colors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ColorPicker
                label="Primary Color"
                description="Main brand color for buttons and highlights"
                value={colors.primaryColor}
                onChange={(value) => handleColorChange('primaryColor', value)}
              />
              <ColorPicker
                label="Secondary Color"
                description="Secondary accent color"
                value={colors.secondaryColor}
                onChange={(value) => handleColorChange('secondaryColor', value)}
              />
              <ColorPicker
                label="Accent Color"
                description="Accent color for success states"
                value={colors.accentColor}
                onChange={(value) => handleColorChange('accentColor', value)}
              />
            </div>
          </div>

          {/* Layout Colors */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Layout Colors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ColorPicker
                label="Sidebar Background"
                description="Background color for navigation sidebar"
                value={colors.sidebarColor}
                onChange={(value) => handleColorChange('sidebarColor', value)}
              />
              <ColorPicker
                label="Sidebar Text"
                description="Text color for sidebar menu items"
                value={colors.sidebarTextColor}
                onChange={(value) => handleColorChange('sidebarTextColor', value)}
              />
              <ColorPicker
                label="Header Background"
                description="Background color for page headers"
                value={colors.headerColor}
                onChange={(value) => handleColorChange('headerColor', value)}
              />
              <ColorPicker
                label="Page Background"
                description="Main background color for pages"
                value={colors.backgroundColor}
                onChange={(value) => handleColorChange('backgroundColor', value)}
              />
            </div>
          </div>

          {/* Preset Themes */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Preset Themes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {presetThemes.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-modern-blue transition-all group"
                >
                  <div className="flex space-x-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg shadow-sm"
                      style={{ backgroundColor: preset.colors.primaryColor }}
                    />
                    <div
                      className="w-8 h-8 rounded-lg shadow-sm"
                      style={{ backgroundColor: preset.colors.secondaryColor }}
                    />
                    <div
                      className="w-8 h-8 rounded-lg shadow-sm"
                      style={{ backgroundColor: preset.colors.sidebarColor }}
                    />
                  </div>
                  <p className="font-semibold text-gray-900 group-hover:text-modern-blue transition-colors">
                    {preset.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Live Preview</h2>

            {/* Mini Dashboard Preview */}
            <div
              className="rounded-xl overflow-hidden shadow-lg border border-gray-200"
              style={{ backgroundColor: colors.backgroundColor }}
            >
              {/* Preview Sidebar */}
              <div className="flex h-64">
                <div
                  className="w-16 p-3 space-y-2"
                  style={{ backgroundColor: colors.sidebarColor }}
                >
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-lg opacity-80"
                      style={{ backgroundColor: colors.sidebarTextColor }}
                    />
                  ))}
                </div>

                {/* Preview Content */}
                <div className="flex-1 p-4 space-y-3">
                  {/* Preview Header */}
                  <div
                    className="h-12 rounded-lg"
                    style={{ backgroundColor: colors.headerColor }}
                  />

                  {/* Preview Cards */}
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className="h-16 rounded-lg"
                      style={{ backgroundColor: colors.primaryColor }}
                    />
                    <div
                      className="h-16 rounded-lg"
                      style={{ backgroundColor: colors.secondaryColor }}
                    />
                  </div>

                  {/* Preview Button */}
                  <div
                    className="h-10 rounded-lg"
                    style={{ backgroundColor: colors.accentColor }}
                  />
                </div>
              </div>
            </div>

            {/* Color Values */}
            <div className="mt-6 space-y-2">
              <h3 className="font-semibold text-gray-700 text-sm">Current Colors:</h3>
              <div className="space-y-1 text-xs text-gray-600 font-mono">
                {Object.entries(colors).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span>{key}:</span>
                    <span className="font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Color Picker Component
const ColorPicker = ({ label, description, value, onChange }) => {
  return (
    <div className="space-y-2">
      <label className="block">
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </label>
      <div className="flex items-center space-x-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-16 h-16 rounded-xl cursor-pointer border-2 border-gray-200 hover:border-modern-blue transition-colors"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            if (/^#[0-9A-F]{0,6}$/i.test(val)) {
              onChange(val);
            }
          }}
          placeholder="#000000"
          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-modern-blue focus:ring-2 focus:ring-modern-lightBlue font-mono text-sm uppercase"
          maxLength={7}
        />
      </div>
    </div>
  );
};

export default BrandingSettingsPage;
