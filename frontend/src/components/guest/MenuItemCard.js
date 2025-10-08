/**
 * Menu Item Card – Compact Desktop, unchanged logic/props
 * - Mobile: same as before (list-tile)
 * - Desktop: short image (h-36/40), tighter text, bottom bar
 */

import React from 'react';
import { FaPlus, FaMinus, FaLeaf, FaPepperHot, FaClock } from 'react-icons/fa';
import useRTL from '../../hooks/useRTL';
import { useTranslation } from 'react-i18next';
import { formatPriceByLanguage } from '../../utils/currency';

const MenuItemCard = ({
  item,
  quantity = 0,
  onAdd,
  onIncrease,
  onDecrease,
  isMobile = false
}) => {
  const { isRTL, textAlign } = useRTL();
  const { t, i18n } = useTranslation();

  const spicy = (level) =>
    level === 'normal' ? '' :
    level === 'medium' ? '🌶️🌶️' :
    level === 'hot' ? '🌶️🌶️🌶️' :
    level === 'very_hot' ? '🌶️🌶️🌶️🌶️' : '';

  const Price = () => (
    <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} items-baseline gap-1 ${textAlign}`}>
      <span className="text-xl font-extrabold tracking-tight text-gray-900">
        {formatPriceByLanguage(Number(item.price || 0), i18n.language)}
      </span>
      <span className="text-[11px] text-gray-500">{isRTL ? '/ للطلب' : '/ item'}</span>
    </div>
  );

  const Badges = () => (
    <div className={`mt-1 flex flex-wrap gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
      {item.isVegetarian && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
          <FaLeaf className="w-3 h-3" /> {isRTL ? 'نباتي' : 'Veg'}
        </span>
      )}
      {item.isVegan && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
          <FaLeaf className="w-3 h-3" /> {isRTL ? 'نباتي صارم' : 'Vegan'}
        </span>
      )}
      {item.spicyLevel && spicy(item.spicyLevel) && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-red-50 text-red-700 border border-red-200">
          <FaPepperHot className="w-3 h-3" /> {spicy(item.spicyLevel)}
        </span>
      )}
      {item.preparationTime && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-blue-50 text-blue-700 border border-blue-200">
          <FaClock className="w-3 h-3" /> {item.preparationTime}m
        </span>
      )}
    </div>
  );

  const Stepper = () => (
    <div className={`inline-flex items-center bg-white border border-gray-200 rounded-full shadow-sm ${isMobile ? 'scale-90' : ''}`}>
      <button
        onClick={onDecrease}
        aria-label={isRTL ? 'تقليل الكمية' : 'Decrease quantity'}
        className={`${isMobile ? 'p-1 w-6 h-6' : 'p-2.5'} hover:bg-gray-50 rounded-l-full flex items-center justify-center`}
      >
        <FaMinus className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'}`} />
      </button>
      <span className={`${isMobile ? 'px-1.5 min-w-[20px] text-xs' : 'px-3 min-w-[28px]'} text-center font-bold text-gray-900`}>{quantity}</span>
      <button
        onClick={onIncrease}
        aria-label={isRTL ? 'زيادة الكمية' : 'Increase quantity'}
        className={`${isMobile ? 'p-1 w-6 h-6' : 'p-2.5'} hover:bg-gray-50 rounded-r-full flex items-center justify-center`}
      >
        <FaPlus className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'}`} />
      </button>
    </div>
  );

  /* ===================== MOBILE (unchanged) ===================== */
  if (isMobile) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
        <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Thumb */}
          <div className="shrink-0">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-2xl">🍽️</div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <h3 className={`text-[15px] font-semibold text-gray-900 truncate ${textAlign}`}>{item.name}</h3>
            {item.description && (
              <p className={`mt-0.5 text-[13px] text-gray-600 line-clamp-2 ${textAlign}`}>{item.description}</p>
            )}
            <Badges />

            <div className={`mt-2 flex items-center justify-between gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex-shrink min-w-0 flex-1">
                <Price />
              </div>
              <div className="flex-shrink-0 max-w-[100px]">
                {quantity > 0 ? <Stepper /> : (
                  <button
                    onClick={onAdd}
                    aria-label={isRTL ? 'إضافة إلى الطلب' : 'Add to order'}
                    className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#3B5787] to-[#61B6DE] hover:opacity-95 active:scale-[0.98] transition"
                  >
                    {isRTL ? 'إضافة' : 'Add'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ===================== DESKTOP – COMPACT TILE ===================== */
  return (
    <div className="group bg-white h-full flex flex-col rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all overflow-hidden">
      {/* Short image header */}
      <div className="relative bg-gray-50">
        <div className="h-36 md:h-40 w-full overflow-hidden">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center">
              <div className="bg-white/90 rounded-full p-4 shadow">
                <span className="text-3xl">🍽️</span>
              </div>
            </div>
          )}
        </div>

        {/* Small floating badges (row) */}
        <div className={`absolute top-2 ${isRTL ? 'right-2' : 'left-2'}`}>
          <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} gap-1.5`}>
            {item.isVegetarian && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-600 text-white shadow">
                <FaLeaf className="w-3 h-3" /> {isRTL ? 'نباتي' : 'Veg'}
              </span>
            )}
            {item.spicyLevel && spicy(item.spicyLevel) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-red-600 text-white shadow">
                <FaPepperHot className="w-3 h-3" /> {spicy(item.spicyLevel)}
              </span>
            )}
          </div>
        </div>

        {/* Floating stepper if active */}
        {quantity > 0 && (
          <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'}`}>
            <Stepper />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 p-4">
        <h3 className={`text-[15px] font-semibold text-gray-900 ${textAlign} line-clamp-1`}>
          {item.name}
        </h3>
        {item.description && (
          <p className={`mt-1 text-[13px] text-gray-600 ${textAlign} line-clamp-2`}>
            {item.description}
          </p>
        )}
        <Badges />
      </div>

      {/* Bottom bar – always aligned, keeps card short */}
      <div className={`px-4 py-3 border-t border-gray-100 bg-white mt-auto flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Price />
        {quantity === 0 ? (
          <button
            onClick={onAdd}
            aria-label={isRTL ? 'إضافة إلى الطلب' : 'Add to order'}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3B5787] to-[#61B6DE] hover:opacity-95 active:scale-[0.98] transition"
          >
            <FaPlus className="w-4 h-4" />
            <span>{isRTL ? 'إضافة' : 'Add'}</span>
          </button>
        ) : (
          <div className="text-[#3B5787] bg-[#3B5787]/10 border border-[#3B5787]/20 rounded-lg px-3 py-1.5 text-sm font-semibold">
            {isRTL ? `${quantity} في السلة` : `${quantity} in cart`}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuItemCard;
