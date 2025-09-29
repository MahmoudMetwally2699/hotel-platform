/**
 * WhatsApp Cloud API Utility (Arabic templates with NAMED VARIABLES)
 * - Sends template messages outside 24h window using named params
 * - Sends text messages (requires 24h session)
 * - Webhook verify/process for delivery status
 */

const axios = require('axios');
const logger = require('./logger');

/** =========================
 *  Utility Functions
 *  ========================= */

/**
 * Sanitize text for WhatsApp template parameters
 * WhatsApp templates cannot have:
 * - Newline characters (\n, \r)
 * - Tab characters (\t)
 * - More than 4 consecutive spaces
 */
const sanitizeWhatsAppText = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  return text
    .replace(/[\n\r\t]/g, ' ')  // Replace newlines and tabs with single space
    .replace(/\s{5,}/g, '    ') // Replace 5+ consecutive spaces with exactly 4 spaces
    .trim();
};

/**
 * Sanitize all parameters in a named params object for WhatsApp templates
 */
const sanitizeWhatsAppParams = (namedParams) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(namedParams)) {
    sanitized[key] = sanitizeWhatsAppText(value);
  }
  return sanitized;
};

/** =========================
 *  Configuration
 *  ========================= */
const WHATSAPP_CONFIG = {
  baseURL: process.env.WHATSAPP_GRAPH_BASE || 'https://graph.facebook.com/v18.0',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
  defaultCountry: process.env.WHATSAPP_DEFAULT_COUNTRY || 'EG'
};

if (!WHATSAPP_CONFIG.phoneNumberId || !WHATSAPP_CONFIG.accessToken) {
  console.error('[WhatsApp] Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN');
  console.log('[WhatsApp] Current config:', {
    phoneNumberId: WHATSAPP_CONFIG.phoneNumberId ? 'SET' : 'MISSING',
    accessToken: WHATSAPP_CONFIG.accessToken ? 'SET' : 'MISSING',
    baseURL: WHATSAPP_CONFIG.baseURL
  });
}

/** =========================
 *  HTTP Client
 *  ========================= */
const createWhatsAppClient = () =>
  axios.create({
    baseURL: `${WHATSAPP_CONFIG.baseURL}/${WHATSAPP_CONFIG.phoneNumberId}`,
    headers: {
      Authorization: `Bearer ${WHATSAPP_CONFIG.accessToken}`,
      'Content-Type': 'application/json'
    },
    timeout: 20000
  });

/** =========================
 *  Phone Formatting (E.164 digits only, no '+')
 *  ========================= */
const toE164 = (raw, defaultCountry = WHATSAPP_CONFIG.defaultCountry) => {
  if (!raw) return null;
  const cleaned = String(raw).trim();
  const onlyDigitsPlus = cleaned.replace(/[^\d+]/g, '');
  if (onlyDigitsPlus.startsWith('+')) return onlyDigitsPlus.slice(1);
  if (/^(20|966|971|965|973|974|968|1|44)\d{6,}$/.test(onlyDigitsPlus)) return onlyDigitsPlus;

  if (defaultCountry === 'EG') {
    if (/^0\d{9,10}$/.test(onlyDigitsPlus)) return `20${onlyDigitsPlus.slice(1)}`;
  }
  if (defaultCountry === 'SA') {
    if (/^05\d{8}$/.test(onlyDigitsPlus)) return `966${onlyDigitsPlus.slice(1)}`;
  }
  if (defaultCountry === 'AE') {
    if (/^05\d{7,8}$/.test(onlyDigitsPlus)) return `971${onlyDigitsPlus.slice(1)}`;
  }
  if (defaultCountry === 'GB') {
    if (/^07\d{8,9}$/.test(onlyDigitsPlus)) return `44${onlyDigitsPlus.slice(1)}`;
  }
  if (defaultCountry === 'US') {
    if (/^\d{10}$/.test(onlyDigitsPlus)) return `1${onlyDigitsPlus}`;
  }
  return onlyDigitsPlus.replace(/[^\d]/g, '');
};

/** =========================
 *  Build components for NAMED VARIABLES
 *  - Expects a plain object: { key1: val1, key2: val2, ... }
 *  - We only include BODY because your headers/footers have no variables
 *  ========================= */
const buildNamedBodyComponent = (namedParams = {}) => {
  const entries = Object.entries(namedParams);
  if (!entries.length) {
    return [{ type: 'body', parameters: [] }];
  }
  return [
    {
      type: 'body',
      parameters: entries.map(([parameter_name, value]) => ({
        type: 'text',
        parameter_name,           // REQUIRED for named-variable templates
        text: String(value ?? '')
      }))
    }
  ];
};

/** =========================
 *  Send Template (outside 24h window) — NAMED mode
 *  ========================= */
const sendTemplateMessage = async (
  to,
  templateName,
  { languageCode = 'ar', namedParams = {} } = {}
) => {
  const client = createWhatsAppClient();
  const formattedPhone = toE164(to);
  if (!formattedPhone) throw new Error('Invalid phone number');

  // Sanitize all parameters before sending
  const sanitizedParams = sanitizeWhatsAppParams(namedParams);

  const payload = {
    messaging_product: 'whatsapp',
    to: formattedPhone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components: buildNamedBodyComponent(sanitizedParams)
    }
  };

  logger?.info?.('WA template(named) -> sending', {
    to: formattedPhone,
    templateName,
    languageCode,
    keys: Object.keys(sanitizedParams)
  });

  try {
    const res = await client.post('/messages', payload);
    const messageId = res?.data?.messages?.[0]?.id;
    logger?.info?.('WA template(named) -> success', { to: formattedPhone, templateName, messageId });
    return { success: true, to: formattedPhone, messageId };
  } catch (err) {
    const apiErr = err.response?.data?.error || err.message;
    logger?.error?.('WA template(named) -> failed', { to, templateName, apiErr, payload });
    throw new Error(
      `Template send failed: ${typeof apiErr === 'string' ? apiErr : JSON.stringify(apiErr)}`
    );
  }
};

/** =========================
 *  Send Text (requires 24h session)
 *  ========================= */
const sendTextMessage = async (to, message) => {
  const client = createWhatsAppClient();
  const formattedPhone = toE164(to);
  if (!formattedPhone) throw new Error('Invalid phone number');

  const payload = {
    messaging_product: 'whatsapp',
    to: formattedPhone,
    type: 'text',
    text: { body: String(message ?? '') }
  };

  logger?.info?.('WA text -> sending', { to: formattedPhone, len: (message || '').length });

  try {
    const res = await client.post('/messages', payload);
    const messageId = res?.data?.messages?.[0]?.id;
    logger?.info?.('WA text -> success', { to: formattedPhone, messageId });
    return { success: true, to: formattedPhone, messageId };
  } catch (err) {
    const apiErr = err.response?.data?.error || err.message;
    logger?.error?.('WA text -> failed', { to, apiErr, payload });
    throw new Error(
      `Text send failed (likely outside 24h session): ${typeof apiErr === 'string' ? apiErr : JSON.stringify(apiErr)}`
    );
  }
};

/** =========================
 *  Webhook Verify & Processor
 *  ========================= */
const verifyWebhook = (mode, token, challenge) => {
  if (mode === 'subscribe' && token === WHATSAPP_CONFIG.webhookVerifyToken) {
    logger?.info?.('WA webhook verified');
    return challenge;
  }
  logger?.warn?.('WA webhook verify failed', { mode, tokenOK: token === WHATSAPP_CONFIG.webhookVerifyToken });
  return null;
};

const processWebhook = async (body) => {
  try {
    logger?.info?.('WA webhook -> incoming', { hasEntry: !!body?.entry });
    if (!body?.entry) return { success: true, note: 'no entry' };

    for (const entry of body.entry) {
      for (const change of entry.changes || []) {
        const v = change.value || {};

        if (Array.isArray(v.statuses)) {
          for (const st of v.statuses) {
            logger?.info?.('WA status', {
              messageId: st.id,
              status: st.status,
              recipient: st.recipient_id,
              ts: st.timestamp,
              error: st.errors?.[0]
            });
          }
        }

        if (Array.isArray(v.messages)) {
          for (const m of v.messages) {
            logger?.info?.('WA inbound', { from: m.from, id: m.id, type: m.type, ts: m.timestamp });
          }
        }
      }
    }
    return { success: true };
  } catch (e) {
    logger?.error?.('WA webhook -> error', { err: e.message });
    throw e;
  }
};

/** =========================================================
 *  Convenience senders — EXACTLY matching your templates
 *  (NAMED KEYS must match your placeholders)
 *  ========================================================= */

/**
 * Template: laundry_booking_confirmation_ar (language: ar)
 * Body placeholders:
 *  {{guest_name}}, {{booking_number}}, {{hotel_name}}, {{ser_pro_name}},
 *  {{service_type}}, {{pickup_date}}, {{pickup_time}}, {{room_number}},
 *  {{total_amount}}, {{payment_status}}
 */
const sendLaundryBookingConfirmation = async ({
  guestName,
  guestPhone,
  bookingNumber,
  hotelName,
  serviceProviderName, // -> ser_pro_name
  serviceType,
  pickupDate,
  pickupTime,
  roomNumber,
  totalAmount,
  paymentStatus
}) => {
  return sendTemplateMessage(guestPhone, 'laundry_booking_confirmation_ar', {
    languageCode: 'ar',
    namedParams: {
      guest_name: guestName,
      booking_number: bookingNumber,
      hotel_name: hotelName,
      ser_pro_name: serviceProviderName || 'سيتم تحديده قريباً',
      service_type: serviceType,
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      room_number: roomNumber,
      total_amount: totalAmount,
      payment_status: paymentStatus
    }
  });
};

/**
 * Template: transportation_booking_confirmation_ar (language: ar)
 * Body placeholders:
 *  {{guest_name}}, {{booking_number}}, {{hotel_name}}, {{sere_provider_name}},
 *  {{vehicle_type}}, {{trip_date}}, {{departure_time}}, {{pickup_location}},
 *  {{destination_location}}, {{total_amount}}, {{payment_status}}
 */
const sendTransportationBookingConfirmation = async ({
  guestName,
  guestPhone,
  bookingNumber,
  hotelName,
  serviceProviderName, // -> sere_provider_name
  vehicleType,
  tripDate,
  departureTime,
  pickupLocation,
  destinationLocation,
  totalAmount,
  paymentStatus
}) => {
  return sendTemplateMessage(guestPhone, 'transportation_booking_confirmation_ar', {
    languageCode: 'ar',
    namedParams: {
      guest_name: guestName,
      booking_number: bookingNumber,
      hotel_name: hotelName,
      sere_provider_name: serviceProviderName || 'سيتم تحديده قريباً',
      vehicle_type: vehicleType,
      trip_date: tripDate,
      departure_time: departureTime,
      pickup_location: pickupLocation,
      destination_location: destinationLocation,
      total_amount: totalAmount,
      payment_status: paymentStatus
    }
  });
};

/**
 * Template: new_laundry_order_provider_ar (language: ar)
 * Body placeholders:
 *  {{booking_number}}, {{guest_name}}, {{hotel_name}}, {{room_number}},
 *  {{guest_phone}}, {{pickup_date}}, {{pickup_time}}, {{service_type}},
 *  {{special_notes}}, {{base_amount}}
 */
const sendNewLaundryOrderToProvider = async ({
  providerPhone,
  bookingNumber,
  guestName,
  hotelName,
  roomNumber,
  guestPhone,
  pickupDate,
  pickupTime,
  serviceType,
  specialNotes,
  baseAmount
}) => {
  return sendTemplateMessage(providerPhone, 'new_laundry_order_provider_ar', {
    languageCode: 'ar',
    namedParams: {
      booking_number: bookingNumber,
      guest_name: guestName,
      hotel_name: hotelName,
      room_number: roomNumber,
      guest_phone: guestPhone,
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      service_type: serviceType,
      special_notes: specialNotes || 'لا توجد ملاحظات',
      base_amount: baseAmount
    }
  });
};

/**
 * Template: new_transportation_order_provider_ar (language: ar)
 * Body placeholders:
 *  {{booking_number}}, {{guest_name}}, {{hotel_name}}, {{guest_phone}},
 *  {{trip_date}}, {{departure_time}}, {{pickup_location}}, {{destination_location}},
 *  {{vehicle_type}}, {{passenger_count}}, {{base_amount}}
 */
const sendNewTransportationOrderToProvider = async ({
  providerPhone,
  bookingNumber,
  guestName,
  hotelName,
  guestPhone,
  tripDate,
  departureTime,
  pickupLocation,
  destinationLocation,
  vehicleType,
  passengerCount,
  baseAmount
}) => {
  return sendTemplateMessage(providerPhone, 'new_transportation_order_provider_ar', {
    languageCode: 'ar',
    namedParams: {
      booking_number: bookingNumber,
      guest_name: guestName,
      hotel_name: hotelName,
      guest_phone: guestPhone,
      trip_date: tripDate,
      departure_time: departureTime,
      pickup_location: pickupLocation,
      destination_location: destinationLocation,
      vehicle_type: vehicleType,
      passenger_count: passengerCount,
      base_amount: baseAmount
    }
  });
};

/**
 * Template: laundry_service_completed_guest_ar (language: ar)
 * Body placeholders:
 *  {{guest_name}}, {{booking_number}}, {{servi_provider_name}},
 *  {{delivery_date}}, {{delivery_time}}, {{room_number}}
 */
const sendLaundryServiceCompleted = async ({
  guestName,
  guestPhone,
  bookingNumber,
  serviceProviderName, // -> servi_provider_name
  deliveryDate,
  deliveryTime,
  roomNumber
}) => {
  return sendTemplateMessage(guestPhone, 'laundry_service_completed_guest_ar', {
    languageCode: 'ar',
    namedParams: {
      guest_name: guestName,
      booking_number: bookingNumber,
      servi_provider_name: serviceProviderName,
      delivery_date: deliveryDate,
      delivery_time: deliveryTime,
      room_number: roomNumber
    }
  });
};

/**
 * Template: housekeeping_booking_confirmation_ar (language: ar)
 * Body placeholders:
 *  {{booking_number}}, {{hotel_name}}, {{service_type}},
 *  {{preferred_time}}, {{room_number}}, {{special_requests}}
 */
const sendHousekeepingBookingConfirmation = async ({
  guestName,
  guestPhone,
  bookingNumber,
  hotelName,
  serviceType,
  preferredTime,
  roomNumber,
  specialRequests
}) => {
  return sendTemplateMessage(guestPhone, 'housekeeping_booking_confirmation_ar', {
    languageCode: 'ar',
    namedParams: {
      booking_number: bookingNumber,
      hotel_name: hotelName,
      service_type: serviceType,
      preferred_time: preferredTime,
      room_number: roomNumber,
      special_requests: specialRequests || 'لا توجد ملاحظات خاصة'
    }
  });
};

/**
 * Template: new_housekeeping_order_provider_ar (language: ar)
 * Body placeholders:
 *  {{booking_number}}, {{guest_name}}, {{hotel_name}}, {{room_number}},
 *  {{guest_phone}}, {{service_type}}, {{preferred_time}}, {{scheduled_time}},
 *  {{estimated_duration}}, {{special_requests}}
 */
const sendNewHousekeepingOrderToProvider = async ({
  providerPhone,
  bookingNumber,
  guestName,
  hotelName,
  roomNumber,
  guestPhone,
  serviceType,
  preferredTime,
  scheduledTime,
  estimatedDuration,
  specialRequests
}) => {
  console.log('🔧 Sending housekeeping order to provider phone:', providerPhone);
  return sendTemplateMessage(providerPhone, 'new_housekeeping_order_provider_ar', {
    languageCode: 'ar',
    namedParams: {
      booking_number: bookingNumber,
      guest_name: guestName,
      hotel_name: hotelName,
      room_number: roomNumber,
      guest_phone: guestPhone,
      service_type: serviceType,
      preferred_time: preferredTime,
      scheduled_time: scheduledTime || 'حسب الوقت المفضل',
      estimated_duration: estimatedDuration || '30',
      special_requests: specialRequests || 'لا توجد ملاحظات خاصة'
    }
  });
};

/**
 * Template: housekeeping_service_completed_guest_ar (language: ar)
 * Body placeholders:
 *  {{guest_name}}, {{booking_number}}, {{service_type}},
 *  {{completion_date}}, {{completion_time}}, {{room_number}}
 */
const sendHousekeepingServiceCompleted = async ({
  guestName,
  guestPhone,
  bookingNumber,
  serviceType,
  completionDate,
  completionTime,
  roomNumber
}) => {
  return sendTemplateMessage(guestPhone, 'housekeeping_service_completed_guest_ar', {
    languageCode: 'ar',
    namedParams: {
      guest_name: guestName,
      booking_number: bookingNumber,
      service_type: serviceType,
      completion_date: completionDate,
      completion_time: completionTime,
      room_number: roomNumber
    }
  });
};

/**
 * Template: housekeeping_service_started_guest_ar (language: ar)
 * Body placeholders:
 *  {{guest_name}}, {{booking_number}}, {{service_type}},
 *  {{start_time}}, {{room_number}}, {{estimated_duration}}
 */
const sendHousekeepingServiceStarted = async ({
  guestName,
  guestPhone,
  bookingNumber,
  serviceType,
  startTime,
  roomNumber,
  estimatedDuration
}) => {
  return sendTemplateMessage(guestPhone, 'housekeeping_service_started_guest_ar', {
    languageCode: 'ar',
    namedParams: {
      guest_name: guestName,
      booking_number: bookingNumber,
      service_type: serviceType,
      start_time: startTime,
      room_number: roomNumber,
      estimated_duration: estimatedDuration || '30'
    }
  });
};

module.exports = {
  // Core
  sendTemplateMessage,
  sendTextMessage,
  verifyWebhook,
  processWebhook,
  toE164,
  // App-specific convenience
  sendLaundryBookingConfirmation,
  sendTransportationBookingConfirmation,
  sendNewLaundryOrderToProvider,
  sendNewTransportationOrderToProvider,
  sendLaundryServiceCompleted,
  // Housekeeping services
  sendHousekeepingBookingConfirmation,
  sendNewHousekeepingOrderToProvider,
  sendHousekeepingServiceCompleted,
  sendHousekeepingServiceStarted
};
