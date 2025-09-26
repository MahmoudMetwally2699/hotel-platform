/**
 * Home Page - Simple Guest Landing Page
 * Redesigned to match the exact mobile-like interface from the screenshot
 */

import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser, selectAuthRole } from '../../redux/slices/authSlice';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const HomePage = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const role = useSelector(selectAuthRole);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Redirect authenticated guests to categories page
  useEffect(() => {
    if (isAuthenticated && role === 'guest' && user) {
      console.log('Authenticated guest detected, redirecting to categories page');

      // Get user data to extract hotelId
      let hotelId = user?.selectedHotelId;

      // If hotelId is an object, extract the ID
      if (hotelId && typeof hotelId === 'object') {
        hotelId = hotelId._id || hotelId.id || hotelId.toString();
      }

      if (hotelId && typeof hotelId === 'string' && hotelId !== '[object Object]') {
        navigate(`/hotels/${hotelId}/categories`, { replace: true });
        return;
      } else {
        console.log('No valid hotel ID found for authenticated guest');
      }
    }
  }, [isAuthenticated, role, user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-qickroom-lightBlue to-qickroom-blue relative overflow-hidden">
      {/* Header/Navigation */}
      <nav className="flex justify-between items-center p-6">
        {/* Left side - Login button */}
        <Link
          to="/login"
          className="bg-white/90 backdrop-blur-sm text-qickroom-blue px-6 py-2 rounded-full font-medium hover:bg-white transition-colors duration-200"
        >
          {t('homepage.login', 'دخول')}
        </Link>

        {/* Right side - Language Switcher and Logo */}
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
            <LanguageSwitcher />
          </div>
          <span className="text-white text-lg font-semibold">Qickroom</span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left side - Text Content */}
          <div className="text-center lg:text-right space-y-6">
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
              {t('homepage.mainTitle', 'منصة خدمات الغرف لفندقك')}
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 leading-relaxed">
              {t('homepage.subtitle', 'حلول رقمية متطورة لخدمات الضيوف')}
            </p>

            {/* Service Access Button */}
            <div className="pt-4">
              <Link
                to={isAuthenticated ? "/hotels" : "/login"}
                className="inline-flex items-center justify-center bg-white text-qickroom-blue px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <span className="ml-2">{t('homepage.accessService', 'دخول إلى الخدمة')}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right side - Mobile Phone Mockup */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative">
              {/* Phone Frame */}
              <div className="relative bg-black rounded-[3rem] p-2 shadow-2xl">
                <div className="bg-white rounded-[2.5rem] overflow-hidden" style={{ width: '280px', height: '580px' }}>
                  {/* Phone Screen Content */}
                  <div className="h-full bg-gray-50 flex flex-col items-center justify-center p-8">

                    {/* Qickroom Logo in Phone */}
                    <div className="mb-8">
                      <div className="bg-qickroom-blue/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <img
                          src="/qickroom.png"
                          alt="Qickroom"
                          className="h-10 w-10"
                        />
                      </div>
                      <h2 className="text-qickroom-blue text-xl font-bold text-center">
                        Qickroom
                      </h2>
                    </div>

                    {/* Service Title in Phone */}
                    <div className="text-center mb-8">
                      <h3 className="text-gray-800 text-lg font-semibold mb-2">
                        {t('homepage.phoneTitle', 'Hotel Services Platform')}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {t('homepage.phoneSubtitle', 'خدمات رقمية متطورة لتجربة الضيوف')}
                      </p>
                    </div>

                    {/* Service Access Button in Phone */}
                    <div className="w-full px-4">
                      <div className="bg-qickroom-blue text-white py-3 px-6 rounded-xl font-medium text-center mb-3">
                        <span>{t('homepage.serviceLogin', 'دخول إلى الخدمة')}</span>
                      </div>

                      <div className="text-center">
                        <span className="text-gray-500 text-sm">
                          {t('homepage.createAccount', 'إنشاء حساب جديد')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 text-center p-4">
        <p className="text-white/70 text-sm">
          {t('homepage.footer', '© 2024 Qickroom. جميع الحقوق محفوظة')}
        </p>
      </div>
    </div>
  );
};

export default HomePage;
