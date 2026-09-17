export const EVENT_TYPE_IMAGES = {
  Conference: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
  Seminar: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
  Workshop: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
  Webinar: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=800&q=80',
  Meeting: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
  Cultural: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
  Sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
  Examination: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
  Academic: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
  Social: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
  Other: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80',
};

/**
 * Returns a high quality contextual image for an event based on its eventType / category.
 * If a custom valid imageUrl is present on the event, that takes precedence.
 *
 * @param {string} eventType - The type or category of the event (e.g. Conference, Seminar, Sports, etc.)
 * @param {string} [customImageUrl] - Optional custom image URL specified on the event object
 * @returns {string} The URL of the image to display
 */
export const getEventImage = (eventType, customImageUrl) => {
  if (customImageUrl && typeof customImageUrl === 'string' && customImageUrl.trim() !== '') {
    return customImageUrl;
  }

  const cleanType = (eventType || '').trim().toLowerCase();
  if (!cleanType) {
    return EVENT_TYPE_IMAGES.Other;
  }

  const matchKey = Object.keys(EVENT_TYPE_IMAGES).find(
    (key) => key.toLowerCase() === cleanType
  );

  return matchKey ? EVENT_TYPE_IMAGES[matchKey] : EVENT_TYPE_IMAGES.Other;
};
