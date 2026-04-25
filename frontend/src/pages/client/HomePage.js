import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser, selectAuthRole } from '../../redux/slices/authSlice';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import {
  Utensils,
  WashingMachine,
  Sparkles,
  Car,
  ScanLine,
  MousePointerClick,
  Coffee,
  ArrowRight,
  ShieldCheck,
  Star,
  Smartphone,
  Globe,
  Users,
  Building2,
  CheckCircle2,
  Play
} from 'lucide-react';

/* ── inline keyframes (no external CSS needed) ── */
const animStyles = `
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
@keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulse-ring { 0%{transform:scale(.8);opacity:.5} 80%,100%{transform:scale(2);opacity:0} }
@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes gradientMove { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
.anim-float { animation:float 6s ease-in-out infinite }
.anim-float-delay { animation:float 6s ease-in-out 1.5s infinite }
.anim-fade-up { animation:fadeUp .8s ease-out both }
.anim-fade-up-d1 { animation:fadeUp .8s .15s ease-out both }
.anim-fade-up-d2 { animation:fadeUp .8s .3s ease-out both }
.anim-fade-up-d3 { animation:fadeUp .8s .45s ease-out both }
.anim-shimmer { background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.4) 50%,transparent 100%); background-size:200% 100%; animation:shimmer 3s infinite }
.anim-gradient { background-size:200% 200%; animation:gradientMove 8s ease infinite }
`;

const HomePage = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const role = useSelector(selectAuthRole);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (isAuthenticated && role === 'guest' && user) {
      let hotelId = user?.selectedHotelId;
      if (hotelId && typeof hotelId === 'object') {
        hotelId = hotelId._id || hotelId.id || hotelId.toString();
      }
      if (hotelId && typeof hotelId === 'string' && hotelId !== '[object Object]') {
        navigate(`/hotels/${hotelId}/categories`, { replace: true });
      }
    }
  }, [isAuthenticated, role, user, navigate]);

  const features = [
    { icon: Utensils, title: t('homepage.dining','In-Room Dining'), desc: t('homepage.diningDesc','Order gourmet meals directly to your room with a few taps.'), color:'from-orange-400 to-rose-400' },
    { icon: WashingMachine, title: t('homepage.laundry','Laundry Service'), desc: t('homepage.laundryDesc','Schedule pickups for cleaning, pressing, and folding.'), color:'from-violet-400 to-purple-500' },
    { icon: Sparkles, title: t('homepage.housekeeping','Housekeeping'), desc: t('homepage.housekeepingDesc','Request room cleaning, extra towels, or amenities.'), color:'from-emerald-400 to-teal-500' },
    { icon: Car, title: t('homepage.transport','Transportation'), desc: t('homepage.transportDesc','Book airport transfers and local rides effortlessly.'), color:'from-sky-400 to-blue-500' },
  ];

  const steps = [
    { icon: ScanLine, title: t('homepage.step1','Scan QR Code'), desc: t('homepage.step1Desc','Scan the QR code in your room to access the platform instantly.') },
    { icon: MousePointerClick, title: t('homepage.step2','Select Services'), desc: t('homepage.step2Desc','Browse menus, schedule services, and customize your requests.') },
    { icon: Coffee, title: t('homepage.step3','Relax & Enjoy'), desc: t('homepage.step3Desc','Sit back while the hotel staff takes care of the rest.') },
  ];

  const stats = [
    { icon: Building2, count:'50+', label: t('homepage.statHotels','Partner Hotels') },
    { icon: Users, count:'10K+', label: t('homepage.statGuests','Happy Guests') },
    { icon: CheckCircle2, count:'100K+', label: t('homepage.statServices','Services Delivered') },
    { icon: Globe, count:'24/7', label: t('homepage.statSupport','Active Support') },
  ];

  return (
    <>
      <style>{animStyles}</style>

      <div className="min-h-screen flex flex-col bg-white relative overflow-x-hidden font-sans text-gray-800">

        {/* ─── Sticky Nav ─── */}
        <nav className="sticky top-0 z-50 flex items-center justify-between px-5 py-4 sm:px-10 lg:px-16 bg-white/80 backdrop-blur-lg border-b border-gray-100/60">
          <div className="flex items-center gap-2.5">
            <img src="/logo-no-background.svg" alt="Qickroom" className="h-8 w-8 sm:h-9 sm:w-9 object-contain" onError={e=>e.target.style.display='none'} />
            <span className="text-primary-light tracking-[.2em] text-lg sm:text-xl font-black uppercase">{t('homepage.brand','Qickroom')}</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <LanguageSwitcher variant="light" />
            <Link to="/login" className="bg-primary-light text-white px-5 py-2 sm:px-7 sm:py-2.5 rounded-full font-bold text-sm shadow-lg shadow-primary-light/25 hover:shadow-primary-light/40 hover:-translate-y-0.5 transition-all duration-300">
              {t('homepage.login','Login')}
            </Link>
          </div>
        </nav>

        <main className="flex-grow flex flex-col">

          {/* ════════════════ HERO ════════════════ */}
          <section className="relative w-full min-h-[85vh] sm:min-h-[90vh] flex items-center overflow-hidden">
            {/* Full-bleed background image */}
            <div className="absolute inset-0 z-0">
              <img src="/hotel-hero.png" alt="" className="w-full h-full object-cover" />
              {/* Dramatic gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent" />
            </div>

            {/* Animated decorative circles */}
            <div className="absolute top-20 right-10 w-64 h-64 rounded-full border border-white/10 anim-float hidden lg:block" />
            <div className="absolute bottom-32 right-40 w-40 h-40 rounded-full border border-primary-light/20 anim-float-delay hidden lg:block" />

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-10 lg:px-16 py-16 sm:py-20">
              <div className="max-w-2xl space-y-6 sm:space-y-8">
                {/* Badge */}
                <div className="anim-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-semibold tracking-widest uppercase">
                  <Star className="w-3.5 h-3.5 fill-primary-light text-primary-light" />
                  {t('homepage.welcomeBadge','Premium Guest Experience')}
                </div>

                {/* Headline */}
                <h1 className="anim-fade-up-d1 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.1] tracking-tight">
                  {t('homepage.mainTitle','Elevate Your Hotel Stay')}
                </h1>

                {/* Subtitle */}
                <p className="anim-fade-up-d2 text-base sm:text-lg lg:text-xl text-white/75 leading-relaxed max-w-xl font-medium">
                  {t('homepage.subtitle','Seamless access to room service, laundry, housekeeping, and transportation—all from the palm of your hand.')}
                </p>

                {/* CTA buttons */}
                <div className="anim-fade-up-d3 flex flex-col sm:flex-row items-start gap-4 pt-2">
                  <Link
                    to={isAuthenticated ? "/hotels" : "/login"}
                    className="group relative inline-flex items-center justify-center gap-3 bg-primary-light text-white pl-8 pr-6 py-4 rounded-full font-bold text-base sm:text-lg shadow-2xl shadow-primary-light/30 hover:shadow-primary-light/50 hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto overflow-hidden"
                  >
                    <span className="absolute inset-0 anim-shimmer rounded-full pointer-events-none" />
                    <span className="relative z-10">{t('homepage.accessService','Access Services')}</span>
                    <ArrowRight className={`w-5 h-5 relative z-10 transition-transform ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                  </Link>
                </div>
              </div>

              {/* Floating glass stats row — desktop only */}
              <div className="hidden lg:flex items-center gap-6 mt-16 anim-fade-up-d3">
                {stats.map((s,i)=>(
                  <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-5 py-3">
                    <s.icon className="w-5 h-5 text-primary-light" />
                    <div>
                      <p className="text-white font-black text-lg leading-tight">{s.count}</p>
                      <p className="text-white/60 text-xs font-medium">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ════════════════ MOBILE STATS (visible below hero on small screens) ════════════════ */}
          <section className="lg:hidden w-full bg-gradient-to-b from-gray-900 to-gray-800 py-10 px-5">
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {stats.map((s,i)=>(
                <div key={i} className="flex flex-col items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                  <s.icon className="w-6 h-6 text-primary-light" />
                  <p className="text-white font-black text-2xl">{s.count}</p>
                  <p className="text-white/50 text-xs font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ════════════════ FEATURES ════════════════ */}
          <section className="w-full py-16 sm:py-24 px-5 sm:px-10 bg-white relative overflow-hidden">
            {/* Decorative bg blob */}
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary-light/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
              <div className="text-center mb-14 sm:mb-20 space-y-4 max-w-2xl mx-auto">
                <span className="inline-block text-primary-light text-xs sm:text-sm font-bold tracking-[.25em] uppercase">{t('homepage.howItWorks','How It Works')}</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
                  {t('homepage.servicesTitle','Everything You Need, Instantly')}
                </h2>
                <p className="text-gray-500 text-base sm:text-lg font-medium leading-relaxed">
                  {t('homepage.servicesDesc','Enjoy a frictionless hotel experience with our comprehensive suite of digital services.')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                {features.map((f,i) => (
                  <div key={i} className="group relative bg-white rounded-3xl p-7 sm:p-8 border border-gray-100 hover:border-transparent hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-default">
                    {/* Gradient top accent */}
                    <div className={`absolute top-0 inset-x-0 h-1 rounded-t-3xl bg-gradient-to-r ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                      <f.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                    <p className="text-gray-500 leading-relaxed text-sm sm:text-base font-medium">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ════════════════ HOW IT WORKS ════════════════ */}
          <section className="w-full py-16 sm:py-24 px-5 sm:px-10 bg-gray-50 relative">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-14 sm:mb-20">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">{t('homepage.howItWorks','How It Works')}</h2>
                <div className="w-16 h-1 bg-primary-light rounded-full mx-auto" />
              </div>

              <div className="relative">
                {/* Connecting line */}
                <div className="hidden md:block absolute top-16 left-[16.5%] right-[16.5%] h-[2px] bg-gradient-to-r from-transparent via-primary-light/30 to-transparent" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
                  {steps.map((step,i) => (
                    <div key={i} className="flex flex-col items-center text-center group">
                      <div className="relative mb-6">
                        {/* Pulse ring */}
                        <div className="absolute inset-0 rounded-full bg-primary-light/20 group-hover:animate-ping" style={{animationDuration:'2s'}} />
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white shadow-xl border-2 border-gray-100 flex items-center justify-center group-hover:border-primary-light/30 transition-colors duration-500">
                          <step.icon className="w-10 h-10 sm:w-12 sm:h-12 text-primary-light group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        {/* Step number */}
                        <div className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-gradient-to-br from-primary-light to-[#4A9BC4] text-white font-black text-sm flex items-center justify-center shadow-lg border-4 border-white">
                          {i+1}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-500 font-medium max-w-xs text-sm sm:text-base">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ════════════════ SEAMLESS EXPERIENCE ════════════════ */}
          <section className="w-full py-16 sm:py-24 px-5 sm:px-10 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              {/* Visual side */}
              <div className="flex-1 w-full flex justify-center relative order-2 lg:order-1">
                <div className="absolute w-80 h-80 bg-primary-light/10 rounded-full blur-3xl -z-10" />
                <div className="relative">
                  {/* Phone frame */}
                  <div className="w-[240px] sm:w-[280px] bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl anim-float">
                    <div className="w-full aspect-[9/19] bg-white rounded-[2rem] overflow-hidden relative">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-900 rounded-b-2xl z-10" />
                      {/* Screen content */}
                      <div className="h-2/5 bg-gradient-to-br from-primary-light to-[#4A9BC4] p-5 pt-10 text-white flex flex-col justify-end relative">
                        <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
                        <p className="text-lg font-bold relative z-10">Grand Plaza</p>
                        <p className="text-white/70 text-xs relative z-10 mt-0.5">Room 402</p>
                      </div>
                      <div className="flex-1 p-4 space-y-3 bg-gray-50">
                        <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center"><Utensils className="w-4 h-4 text-orange-500" /></div>
                          <div className="flex-1"><div className="h-2 w-16 bg-gray-200 rounded-full" /><div className="h-1.5 w-10 bg-gray-100 rounded-full mt-1.5" /></div>
                        </div>
                        <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center"><WashingMachine className="w-4 h-4 text-violet-500" /></div>
                          <div className="flex-1"><div className="h-2 w-20 bg-gray-200 rounded-full" /><div className="h-1.5 w-12 bg-gray-100 rounded-full mt-1.5" /></div>
                        </div>
                        <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Sparkles className="w-4 h-4 text-emerald-500" /></div>
                          <div className="flex-1"><div className="h-2 w-14 bg-gray-200 rounded-full" /><div className="h-1.5 w-8 bg-gray-100 rounded-full mt-1.5" /></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Floating badge */}
                  <div className="absolute -top-4 -right-6 sm:-right-10 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 sm:p-4 anim-float-delay">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">100% Web</p>
                        <p className="text-[10px] text-gray-500">No App Needed</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text side */}
              <div className="flex-1 space-y-6 text-center lg:text-start order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-light/10 text-primary-light text-xs sm:text-sm font-bold tracking-widest uppercase mx-auto lg:mx-0">
                  <Smartphone className="w-4 h-4" />
                  {t('homepage.noAppNeeded','No App Download Required')}
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
                  {t('homepage.seamlessTitle','A Seamless Experience Across All Devices')}
                </h2>
                <p className="text-base sm:text-lg text-gray-500 leading-relaxed font-medium max-w-xl mx-auto lg:mx-0">
                  {t('homepage.seamlessDesc','Guests can access all hotel services instantly through their mobile browser. No cumbersome app downloads, no complicated registrations. Just scan and enjoy.')}
                </p>
                <div className="flex justify-center lg:justify-start w-full">
                  <ul className="space-y-4 pt-2 text-start inline-block">
                    {[
                      t('homepage.benefit1','Instant access via QR code'),
                      t('homepage.benefit2','Works on any smartphone or tablet'),
                      t('homepage.benefit3','Multi-language support (English & Arabic)'),
                    ].map((b,i)=>(
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary-light/10 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-primary-light" />
                        </div>
                        <span className="text-gray-700 font-medium text-sm sm:text-base">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* ════════════════ CTA / TRUST ════════════════ */}
          <section className="relative w-full py-16 sm:py-24 px-5 overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-light via-[#4A9BC4] to-primary-main anim-gradient" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22%20fill%3D%22rgba(255%2C255%2C255%2C0.08)%22%2F%3E%3C%2Fsvg%3E')] opacity-60" />

            <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-sm font-semibold">
                <ShieldCheck className="w-4 h-4" />
                {t('homepage.secure','Secure & Private')}
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                {t('homepage.secureDesc','Your data is protected with enterprise-grade security.')}
              </h2>
              <p className="text-white/70 text-base sm:text-lg font-medium max-w-xl mx-auto">
                {t('homepage.seamlessDesc','Guests can access all hotel services instantly through their mobile browser. No cumbersome app downloads, no complicated registrations. Just scan and enjoy.')}
              </p>
              <div className="pt-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-3 bg-white text-primary-light px-8 sm:px-10 py-4 sm:py-5 rounded-full font-bold text-base sm:text-lg shadow-2xl hover:shadow-white/20 hover:-translate-y-1 transition-all duration-300"
                >
                  {t('homepage.partner','Partner With Us')}
                  <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
              </div>
            </div>
          </section>

        </main>

        {/* ─── Footer ─── */}
        <footer className="w-full bg-gray-950 text-white py-10 sm:py-14 px-5 sm:px-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-light to-[#4A9BC4] flex items-center justify-center shadow-lg shadow-primary-light/20">
                <span className="font-black text-white text-sm">Q</span>
              </div>
              <span className="text-lg font-bold tracking-[.15em] uppercase text-white/90">Qickroom</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">{t('homepage.footer','© 2024 Qickroom. All rights reserved.')}</p>
          </div>
        </footer>

      </div>
    </>
  );
};

export default HomePage;
