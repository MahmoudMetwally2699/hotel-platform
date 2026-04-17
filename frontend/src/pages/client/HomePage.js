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
      let hotelId = user?.selectedHotelId;
      if (hotelId && typeof hotelId === 'object') {
        hotelId = hotelId._id || hotelId.id || hotelId.toString();
      }
      if (hotelId && typeof hotelId === 'string' && hotelId !== '[object Object]') {
        navigate(`/hotels/${hotelId}/categories`, { replace: true });
        return;
      }
    }
  }, [isAuthenticated, role, user, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-dark via-primary-main to-primary-light relative overflow-x-hidden font-sans">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-white/10 blur-[100px]" />
        <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-primary-light/30 blur-[120px]" />
      </div>

      {/* Header/Navigation */}
      <nav className="relative z-50 flex-none flex justify-between items-center px-4 py-4 sm:px-8 sm:py-6 w-full">
        <div className="flex-shrink-0">
          <Link
            to="/login"
            className="group relative flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-full font-medium hover:bg-white/20 transition-all duration-300 text-sm sm:text-base shadow-lg overflow-hidden"
          >
            <span className="relative z-10">{t('homepage.login', 'دخول')}</span>
          </Link>
        </div>

        <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
          <div className="z-50 relative">
            <LanguageSwitcher variant="glass" />
          </div>
          <span className="text-white tracking-widest text-lg sm:text-xl font-bold uppercase drop-shadow-md">
            {t('homepage.brand', 'Qickroom')}
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow relative z-10 flex flex-col lg:flex-row items-center justify-center px-4 sm:px-8 lg:px-16 w-full max-w-7xl mx-auto gap-12 lg:gap-24 py-8">
        
        {/* Text Content */}
        <div className="flex-1 text-center lg:text-right space-y-6 sm:space-y-8 order-2 lg:order-1 flex flex-col items-center lg:items-end w-full">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-100 text-sm font-semibold tracking-wider mb-2 uppercase">
            {t('homepage.welcomeBadge', 'WELCOME TO QICKROOM')}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.2] drop-shadow-lg">
            {t('homepage.mainTitle', 'منصة خدمات الغرف لفندقك')}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-blue-100/90 leading-relaxed max-w-lg font-light">
            {t('homepage.subtitle', 'حلول رقمية متطورة لخدمات الضيوف')}
          </p>

          <div className="pt-4 sm:pt-6 w-full flex justify-center lg:justify-end">
            <Link
              to={isAuthenticated ? "/hotels" : "/login"}
              className="group relative inline-flex items-center justify-center bg-white text-primary-main px-8 py-4 sm:px-10 sm:py-5 rounded-full font-bold text-lg sm:text-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_40px_rgba(103,186,224,0.4)] transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Button Shine Effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary-light/20 to-transparent group-hover:animate-shimmer" />
              
              <span className="relative z-10 ml-3">{t('homepage.accessService', 'دخول إلى الخدمة')}</span>
              <svg className="w-5 h-5 sm:w-6 sm:h-6 relative z-10 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Mobile Mockup */}
        <div className="flex-1 flex justify-center order-1 lg:order-2 w-full lg:w-auto perspective-1000">
          <div className="relative transform-gpu hover:-rotate-y-6 hover:rotate-x-6 hover:scale-105 transition-all duration-500 ease-out">
            
            {/* Glow behind phone */}
            <div className="absolute inset-0 bg-primary-light/40 blur-3xl rounded-full scale-90 -z-10 animate-pulse" />
            
            {/* Phone Frame */}
            <div className="relative bg-gradient-to-b from-gray-800 to-black rounded-[2.5rem] sm:rounded-[3rem] p-2 shadow-2xl border-4 border-gray-800/50">
              
              {/* Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-3xl z-20" />
              
              {/* Phone Screen */}
              <div className="relative bg-white rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden w-[220px] h-[460px] sm:w-[280px] sm:h-[580px] flex flex-col shadow-inner">
                
                {/* Content inside phone */}
                <div className="flex-grow flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white">
                  <div className="relative animate-bounce-slow">
                    <img
                      src="/logo-no-background.svg"
                      alt="Qickroom"
                      className="h-32 w-32 sm:h-48 sm:w-48 drop-shadow-xl"
                    />
                  </div>
                  <h2 className="mt-8 text-xl sm:text-2xl font-bold text-primary-main tracking-wide uppercase">{t('homepage.brand', 'QICKROOM')}</h2>
                  <div className="w-12 h-1 bg-primary-light rounded-full mt-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex-none pb-6 pt-4 text-center w-full">
        <p className="text-white/60 text-xs sm:text-sm font-medium tracking-wide drop-shadow-sm">
          {t('homepage.footer', '© 2024 Qickroom. جميع الحقوق محفوظة')}
        </p>
      </footer>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}} />
    </div>
  );
};

export default HomePage;
