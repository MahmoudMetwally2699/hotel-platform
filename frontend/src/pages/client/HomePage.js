/**
 * Home Page - Guest Landing Page
 * Modern, welcoming landing page designed specifically for hotel guests
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../redux/slices/authSlice';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const HomePage = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Language Switcher - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img src="/qickroom.png" alt="QuickRoom" className="h-8 w-8 mr-2" />
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                QuickRoom
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">{t('landingPage.nav.services')}</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">{t('landingPage.nav.howToBook')}</a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">{t('landingPage.nav.reviews')}</a>
              {isAuthenticated ? (
                <Link
                  to="/my-hotel-services"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                >
                  {t('landingPage.nav.myBookings')}
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                >
                  {t('landingPage.nav.signIn')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Guest Focused */}
      <section className="relative overflow-hidden pt-16 pb-24">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3B5787] via-[#67BAE0] to-[#3B5787]"></div>
        <div className="absolute inset-0 bg-black/10"></div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-white rounded-full"></div>
        </div>

        <div className="relative max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-24 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <span className="text-white text-sm font-medium">{t('landingPage.hero.welcomeBadge')}</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              {t('landingPage.hero.title')}
              <span className="block text-yellow-300">{t('landingPage.hero.titleHighlight')}</span>
            </h1>

            <p className="text-xl md:text-2xl text-white mb-8 max-w-3xl mx-auto leading-relaxed">
              {t('landingPage.hero.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              {isAuthenticated ? (
                <Link
                  to="/my-hotel-services"
                  className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  {t('landingPage.hero.viewMyServices')}
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  {t('landingPage.hero.chooseYourHotel')}
                </Link>
              )}
              <a
                href="#services"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
              >
                {t('landingPage.hero.exploreServices')}
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-white">
              <div className="flex items-center">
                <span className="text-2xl mr-2">🔒</span>
                <span className="text-sm font-medium">{t('landingPage.hero.securePayments')}</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-2">⚡</span>
                <span className="text-sm font-medium">{t('landingPage.hero.instantBooking')}</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-2">📱</span>
                <span className="text-sm font-medium">{t('landingPage.hero.access247')}</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-2">⭐</span>
                <span className="text-sm font-medium">{t('landingPage.hero.rating')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Guest Focused */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('landingPage.services.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('landingPage.services.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group bg-white border border-[#67BAE0] rounded-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🧺</div>
              <h3 className="text-xl font-bold text-[#3B5787] mb-3">{t('landingPage.services.laundry.title')}</h3>
              <p className="text-black mb-4">{t('landingPage.services.laundry.description')}</p>
            </div>

            <div className="group bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">�</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landingPage.services.transportation.title')}</h3>
              <p className="text-gray-600 mb-4">{t('landingPage.services.transportation.description')}</p>
            </div>

            <div className="group bg-white border border-[#67BAE0] rounded-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🧹</div>
              <h3 className="text-xl font-bold text-[#3B5787] mb-3">{t('landingPage.services.housekeeping.title')}</h3>
              <p className="text-black mb-4">{t('landingPage.services.housekeeping.description')}</p>
            </div>

            <div className="group bg-white border border-[#67BAE0] rounded-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🍽️</div>
              <h3 className="text-xl font-bold text-[#3B5787] mb-3">{t('landingPage.services.roomService.title')}</h3>
              <p className="text-black mb-4">{t('landingPage.services.roomService.description')}</p>
            </div>
          </div>

          {/* Service Benefits */}
          <div className="mt-16 bg-white rounded-3xl p-8 md:p-12 border border-[#67BAE0]">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-[#3B5787] mb-4">{t('landingPage.services.benefits.title')}</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#67BAE0] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💳</span>
                </div>
                <h4 className="font-semibold text-[#3B5787] mb-2">{t('landingPage.services.benefits.flexiblePayment')}</h4>
                <p className="text-black text-sm">{t('landingPage.services.benefits.flexiblePaymentDesc')}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#67BAE0] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚡</span>
                </div>
                <h4 className="font-semibold text-[#3B5787] mb-2">{t('landingPage.services.benefits.fastReliable')}</h4>
                <p className="text-black text-sm">{t('landingPage.services.benefits.fastReliableDesc')}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">�</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('landingPage.services.benefits.easyBooking')}</h4>
                <p className="text-gray-600 text-sm">{t('landingPage.services.benefits.easyBookingDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Guest Focused */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#3B5787] mb-4">
              {t('landingPage.howItWorks.title')}
            </h2>
            <p className="text-xl text-black max-w-2xl mx-auto">
              {t('landingPage.howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('landingPage.howItWorks.step1.title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('landingPage.howItWorks.step1.description')}
              </p>
              <div className={`absolute top-10 ${isRTL ? '-left-4' : '-right-4'} hidden md:block`}>
                <svg className="w-8 h-8 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d={isRTL ? "M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" : "M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"} clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <div className="text-center relative">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('landingPage.howItWorks.step2.title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('landingPage.howItWorks.step2.description')}
              </p>
              <div className={`absolute top-10 ${isRTL ? '-left-4' : '-right-4'} hidden md:block`}>
                <svg className="w-8 h-8 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d={isRTL ? "M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" : "M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"} clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('landingPage.howItWorks.step3.title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('landingPage.howItWorks.step3.description')}
              </p>
            </div>
          </div>

          {/* Payment Options Highlight */}
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-[#67BAE0] mt-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-[#3B5787] mb-4">{t('landingPage.howItWorks.payment.title')}</h3>
              <p className="text-black">{t('landingPage.howItWorks.payment.subtitle')}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="text-center p-6 bg-white rounded-2xl border border-[#67BAE0]">
                <div className="text-4xl mb-4">💳</div>
                <h4 className="text-lg font-bold text-[#3B5787] mb-2">{t('landingPage.howItWorks.payment.onlinePayment.title')}</h4>
                <p className="text-black mb-4">{t('landingPage.howItWorks.payment.onlinePayment.description')}</p>
                <div className="text-sm text-[#3B5787] font-medium" dangerouslySetInnerHTML={{ __html: t('landingPage.howItWorks.payment.onlinePayment.features') }}></div>
              </div>
              <div className="text-center p-6 bg-white rounded-2xl border border-[#67BAE0]">
                <div className="text-4xl mb-4">💵</div>
                <h4 className="text-lg font-bold text-[#3B5787] mb-2">{t('landingPage.howItWorks.payment.cashPayment.title')}</h4>
                <p className="text-black mb-4">{t('landingPage.howItWorks.payment.cashPayment.description')}</p>
                <div className="text-sm text-[#3B5787] font-medium" dangerouslySetInnerHTML={{ __html: t('landingPage.howItWorks.payment.cashPayment.features') }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-[#67BAE0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('landingPage.testimonials.title')}
            </h2>
            <p className="text-xl text-white max-w-2xl mx-auto">
              {t('landingPage.testimonials.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-[#3B5787] shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex text-[#3B5787]">
                  {'★'.repeat(5)}
                </div>
                <span className="ml-2 text-sm text-[#3B5787]">{t('landingPage.testimonials.testimonial1.name')}</span>
              </div>
              <p className="text-black italic mb-4">
                {t('landingPage.testimonials.testimonial1.text')}
              </p>
              <div className="text-sm text-[#3B5787] font-medium">{t('landingPage.testimonials.testimonial1.hotel')}</div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-[#3B5787] shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex text-[#3B5787]">
                  {'★'.repeat(5)}
                </div>
                <span className="ml-2 text-sm text-[#3B5787]">{t('landingPage.testimonials.testimonial2.name')}</span>
              </div>
              <p className="text-black italic mb-4">
                {t('landingPage.testimonials.testimonial2.text')}
              </p>
              <div className="text-sm text-[#3B5787] font-medium">{t('landingPage.testimonials.testimonial2.hotel')}</div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-[#3B5787] shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex text-[#3B5787]">
                  {'★'.repeat(5)}
                </div>
                <span className="ml-2 text-sm text-[#3B5787]">{t('landingPage.testimonials.testimonial3.name')}</span>
              </div>
              <p className="text-black italic mb-4">
                {t('landingPage.testimonials.testimonial3.text')}
              </p>
              <div className="text-sm text-[#3B5787] font-medium">{t('landingPage.testimonials.testimonial3.hotel')}</div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-8">{t('landingPage.testimonials.trustedBy')}</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="text-2xl font-bold text-gray-400">�</div>
              <div className="text-2xl font-bold text-gray-400">⭐</div>
              <div className="text-2xl font-bold text-gray-400">🔒</div>
              <div className="text-2xl font-bold text-gray-400">⚡</div>
              <div className="text-2xl font-bold text-gray-400">💎</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Guest Focused */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('landingPage.stats.title')}</h2>
            <p className="text-blue-100">{t('landingPage.stats.subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-4xl md:text-5xl font-bold mb-2">50K+</div>
              <div className="text-blue-100">{t('landingPage.stats.servicesDelivered')}</div>
              <div className="text-sm text-blue-200 mt-1">{t('landingPage.stats.servicesDeliveredSub')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-4xl md:text-5xl font-bold mb-2">4.8/5</div>
              <div className="text-blue-100">{t('landingPage.stats.averageRating')}</div>
              <div className="text-sm text-blue-200 mt-1">{t('landingPage.stats.averageRatingSub')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-4xl md:text-5xl font-bold mb-2">500+</div>
              <div className="text-blue-100">{t('landingPage.stats.partnerHotels')}</div>
              <div className="text-sm text-blue-200 mt-1">{t('landingPage.stats.partnerHotelsSub')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">{t('landingPage.stats.serviceAvailable')}</div>
              <div className="text-sm text-blue-200 mt-1">{t('landingPage.stats.serviceAvailableSub')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Guest Focused */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('landingPage.cta.title')}
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            {t('landingPage.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link
                to="/my-hotel-services"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                {t('landingPage.hero.viewMyServices')}
              </Link>
            ) : (
              <>
                <Link
                  to="/select-hotel"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  {t('landingPage.cta.bookFirstService')}
                </Link>
                <a
                  href="#services"
                  className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-gray-900 transition-all duration-300"
                >
                  {t('landingPage.cta.exploreServices')}
                </a>
              </>
            )}
          </div>
          <div className="mt-8 text-gray-400 text-sm">
            {t('landingPage.cta.footerText')}
          </div>
        </div>
      </section>

      {/* Footer - Guest Focused */}
      <footer className="bg-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <img src="/qickroom.png" alt="QuickRoom" className="h-8 w-8 mr-2" />
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  QuickRoom
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4 max-w-md">
                {t('landingPage.footer.description')}
              </p>
              <div className="flex space-x-4">
                <div className="text-2xl">🔒</div>
                <div className="text-2xl">⚡</div>
                <div className="text-2xl">⭐</div>
                <div className="text-2xl">💎</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('landingPage.footer.forGuests')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#services" className="hover:text-white transition-colors">{t('landingPage.footer.ourServices')}</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">{t('landingPage.footer.howToBook')}</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">{t('landingPage.footer.guestReviews')}</a></li>
                <li><a href="/help" className="hover:text-white transition-colors">{t('landingPage.footer.helpCenter')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('landingPage.footer.support')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="mailto:guest.support@hotelhup.com" className="hover:text-white transition-colors">{t('landingPage.footer.guestSupport')}</a></li>
                <li><a href="/faq" className="hover:text-white transition-colors">{t('landingPage.footer.faq')}</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">{t('landingPage.footer.contactUs')}</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">{t('landingPage.footer.privacySecurity')}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-sm text-gray-400">
            <p>{t('landingPage.footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
