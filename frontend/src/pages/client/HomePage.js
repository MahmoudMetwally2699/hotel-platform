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
        // No valid hotel ID found for authenticated guest
      }
    }
  }, [isAuthenticated, role, user, navigate]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-qickroom-lightBlue to-qickroom-blue relative overflow-hidden">
      {/* Header/Navigation */}
      <nav className="flex justify-between items-center px-3 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-6 w-full">
        {/* Left side - Login button */}
        <div className="flex-shrink-0">
          <Link
            to="/login"
            className="bg-white/90 backdrop-blur-sm text-qickroom-blue px-3 py-2 sm:px-5 sm:py-2.5 lg:px-6 lg:py-3 rounded-full font-medium hover:bg-white transition-colors duration-200 text-sm sm:text-base shadow-sm whitespace-nowrap"
          >
            {t('homepage.login', 'دخول')}
          </Link>
        </div>

        {/* Right side - Language Switcher and Logo */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-shrink-0">
          {/* Language Switcher */}
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 sm:px-3 sm:py-1.5 min-w-[50px] sm:min-w-[60px] flex justify-center">
            <LanguageSwitcher />
          </div>
          {/* Logo/Brand */}
          <span className="text-white text-sm sm:text-base lg:text-lg font-semibold whitespace-nowrap">
            Qickroom
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-160px)] sm:min-h-[calc(100vh-180px)] lg:min-h-[calc(100vh-200px)] px-3 sm:px-4 lg:px-4">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">

          {/* Left side - Text Content */}
          <div className="text-center lg:text-right space-y-4 sm:space-y-5 lg:space-y-6 order-2 lg:order-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight px-2 sm:px-0">
              {t('homepage.mainTitle', 'منصة خدمات الغرف لفندقك')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed px-2 sm:px-0">
              {t('homepage.subtitle', 'حلول رقمية متطورة لخدمات الضيوف')}
            </p>

            {/* Service Access Button */}
            <div className="pt-2 sm:pt-3 lg:pt-4">
              <Link
                to={isAuthenticated ? "/hotels" : "/login"}
                className="inline-flex items-center justify-center bg-white text-qickroom-blue px-6 py-3 sm:px-7 sm:py-3.5 lg:px-8 lg:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <span className="ml-2">{t('homepage.accessService', 'دخول إلى الخدمة')}</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right side - Mobile Phone Mockup */}
          <div className="flex justify-center lg:justify-start order-1 lg:order-2 mb-4 sm:mb-6 lg:mb-0">
            <div className="relative">
              {/* Phone Frame - Responsive sizing */}
              <div className="relative bg-black rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] p-1.5 sm:p-2 shadow-2xl">
                <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden w-[200px] h-[400px] sm:w-[240px] sm:h-[480px] lg:w-[280px] lg:h-[580px]">
                  {/* Phone Screen Content */}
                  <div className="h-full bg-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">

                    {/* Centered Logo in Phone */}
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <img
                          src="/logo-no-background.svg"
                          alt="Qickroom"
                          className="h-48 w-48 sm:h-56 sm:w-56 lg:h-64 lg:w-64 mx-auto"
                        />
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
      <div className="absolute bottom-0 left-0 right-0 text-center p-2 sm:p-3 lg:p-4">
        <p className="text-white/70 text-xs sm:text-sm px-4">
          {t('homepage.footer', '© 2024 Qickroom. جميع الحقوق محفوظة')}
        </p>
      </div>
      </div>
    </>
  );
};

export default HomePage;
