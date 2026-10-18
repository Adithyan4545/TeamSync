export interface ILocationDetails {
  city: string | null;
  state: string | null;
  country: string | null;
  venue: string | null;
  address: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

// City Spelling Normalization Map
const CITY_SPELLING_MAP: Record<string, string> = {
  bangalore: 'Bengaluru',
  bombay: 'Mumbai',
  calcutta: 'Kolkata',
  gurgaon: 'Gurugram',
  'new delhi': 'Delhi',
  'south west delhi': 'Delhi',
  'north delhi': 'Delhi',
  'delhi ncr': 'Delhi',
  madras: 'Chennai',
  baroda: 'Vadodara',
  trivandrum: 'Thiruvananthapuram',
  pondicherry: 'Puducherry',
  'cochin': 'Kochi',
  'trichy': 'Tiruchirappalli',
};

// State mapping for verified Indian Cities
const CITY_TO_STATE_MAP: Record<string, { city: string; state: string }> = {
  // Tamil Nadu
  chennai: { city: 'Chennai', state: 'Tamil Nadu' },
  coimbatore: { city: 'Coimbatore', state: 'Tamil Nadu' },
  madurai: { city: 'Madurai', state: 'Tamil Nadu' },
  tiruchirappalli: { city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  salem: { city: 'Salem', state: 'Tamil Nadu' },
  erode: { city: 'Erode', state: 'Tamil Nadu' },
  vellore: { city: 'Vellore', state: 'Tamil Nadu' },
  tirunelveli: { city: 'Tirunelveli', state: 'Tamil Nadu' },
  kanchipuram: { city: 'Kanchipuram', state: 'Tamil Nadu' },

  // Karnataka
  bengaluru: { city: 'Bengaluru', state: 'Karnataka' },
  mysore: { city: 'Mysore', state: 'Karnataka' },
  mangalore: { city: 'Mangalore', state: 'Karnataka' },
  hubli: { city: 'Hubli', state: 'Karnataka' },
  belgaum: { city: 'Belgaum', state: 'Karnataka' },
  manipal: { city: 'Manipal', state: 'Karnataka' },
  tumakuru: { city: 'Tumakuru', state: 'Karnataka' },

  // Kerala
  thiruvananthapuram: { city: 'Thiruvananthapuram', state: 'Kerala' },
  kochi: { city: 'Kochi', state: 'Kerala' },
  kozhikode: { city: 'Kozhikode', state: 'Kerala' },
  thrissur: { city: 'Thrissur', state: 'Kerala' },
  kothamangalam: { city: 'Kothamangalam', state: 'Kerala' },
  kottayam: { city: 'Kottayam', state: 'Kerala' },
  palakkad: { city: 'Palakkad', state: 'Kerala' },
  kannur: { city: 'Kannur', state: 'Kerala' },

  // Maharashtra
  mumbai: { city: 'Mumbai', state: 'Maharashtra' },
  pune: { city: 'Pune', state: 'Maharashtra' },
  nagpur: { city: 'Nagpur', state: 'Maharashtra' },
  nashik: { city: 'Nashik', state: 'Maharashtra' },
  thane: { city: 'Thane', state: 'Maharashtra' },
  aurangabad: { city: 'Aurangabad', state: 'Maharashtra' },
  'navi mumbai': { city: 'Navi Mumbai', state: 'Maharashtra' },
  solapur: { city: 'Solapur', state: 'Maharashtra' },

  // Telangana
  hyderabad: { city: 'Hyderabad', state: 'Telangana' },
  warangal: { city: 'Warangal', state: 'Telangana' },
  nizamabad: { city: 'Nizamabad', state: 'Telangana' },

  // Andhra Pradesh
  visakhapatnam: { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  vijayawada: { city: 'Vijayawada', state: 'Andhra Pradesh' },
  guntur: { city: 'Guntur', state: 'Andhra Pradesh' },
  tirupati: { city: 'Tirupati', state: 'Andhra Pradesh' },

  // Delhi
  delhi: { city: 'Delhi', state: 'Delhi' },

  // West Bengal
  kolkata: { city: 'Kolkata', state: 'West Bengal' },
  kalyani: { city: 'Kalyani', state: 'West Bengal' },
  durgapur: { city: 'Durgapur', state: 'West Bengal' },
  siliguri: { city: 'Siliguri', state: 'West Bengal' },
  howrah: { city: 'Howrah', state: 'West Bengal' },
  kharagpur: { city: 'Kharagpur', state: 'West Bengal' },
  barrackpore: { city: 'Barrackpore', state: 'West Bengal' },

  // Uttar Pradesh
  noida: { city: 'Noida', state: 'Uttar Pradesh' },
  'greater noida': { city: 'Greater Noida', state: 'Uttar Pradesh' },
  ghaziabad: { city: 'Ghaziabad', state: 'Uttar Pradesh' },
  lucknow: { city: 'Lucknow', state: 'Uttar Pradesh' },
  kanpur: { city: 'Kanpur', state: 'Uttar Pradesh' },
  agra: { city: 'Agra', state: 'Uttar Pradesh' },
  varanasi: { city: 'Varanasi', state: 'Uttar Pradesh' },
  meerut: { city: 'Meerut', state: 'Uttar Pradesh' },
  prayagraj: { city: 'Prayagraj', state: 'Uttar Pradesh' },

  // Gujarat
  ahmedabad: { city: 'Ahmedabad', state: 'Gujarat' },
  surat: { city: 'Surat', state: 'Gujarat' },
  vadodara: { city: 'Vadodara', state: 'Gujarat' },
  rajkot: { city: 'Rajkot', state: 'Gujarat' },
  gandhinagar: { city: 'Gandhinagar', state: 'Gujarat' },

  // Rajasthan
  jaipur: { city: 'Jaipur', state: 'Rajasthan' },
  jodhpur: { city: 'Jodhpur', state: 'Rajasthan' },
  udaipur: { city: 'Udaipur', state: 'Rajasthan' },
  kota: { city: 'Kota', state: 'Rajasthan' },

  // Madhya Pradesh
  indore: { city: 'Indore', state: 'Madhya Pradesh' },
  bhopal: { city: 'Bhopal', state: 'Madhya Pradesh' },
  gwalior: { city: 'Gwalior', state: 'Madhya Pradesh' },
  jabalpur: { city: 'Jabalpur', state: 'Madhya Pradesh' },

  // Punjab
  mohali: { city: 'Mohali', state: 'Punjab' },
  ludhiana: { city: 'Ludhiana', state: 'Punjab' },
  amritsar: { city: 'Amritsar', state: 'Punjab' },
  jalandhar: { city: 'Jalandhar', state: 'Punjab' },

  // Haryana
  gurugram: { city: 'Gurugram', state: 'Haryana' },
  faridabad: { city: 'Faridabad', state: 'Haryana' },
  panipat: { city: 'Panipat', state: 'Haryana' },

  // Odisha
  bhubaneswar: { city: 'Bhubaneswar', state: 'Odisha' },
  cuttack: { city: 'Cuttack', state: 'Odisha' },
  rourkela: { city: 'Rourkela', state: 'Odisha' },

  // Assam
  guwahati: { city: 'Guwahati', state: 'Assam' },

  // Uttarakhand
  dehradun: { city: 'Dehradun', state: 'Uttarakhand' },
  roorkee: { city: 'Roorkee', state: 'Uttarakhand' },

  // Himachal Pradesh
  shimla: { city: 'Shimla', state: 'Himachal Pradesh' },
  hamirpur: { city: 'Hamirpur', state: 'Himachal Pradesh' },

  // Goa
  panaji: { city: 'Panaji', state: 'Goa' },
};

// Known Indian States list for fallback matching
const KNOWN_INDIAN_STATES = [
  'Tamil Nadu', 'Karnataka', 'Kerala', 'Maharashtra', 'Telangana',
  'Andhra Pradesh', 'Delhi', 'West Bengal', 'Uttar Pradesh', 'Gujarat',
  'Rajasthan', 'Madhya Pradesh', 'Punjab', 'Haryana', 'Odisha', 'Assam',
  'Bihar', 'Jharkhand', 'Chhattisgarh', 'Uttarakhand', 'Himachal Pradesh', 'Goa'
];

/**
 * Clean & Normalize Location Strings into explicit LocationDetails
 */
export function normalizeLocationDetails(
  rawLocationInput?: any,
  mode: 'Online' | 'Offline' | 'Hybrid' = 'Online'
): ILocationDetails {
  // ONLINE SAFETY RULE:
  // If mode is strictly Online, do not assign physical city/state unless explicitly specified as a hybrid venue.
  if (mode === 'Online') {
    const locStr = typeof rawLocationInput === 'string' ? rawLocationInput : '';
    const isIndiaExplicit = /india/i.test(locStr);
    return {
      city: null,
      state: null,
      country: isIndiaExplicit ? 'India' : null,
      venue: null,
      address: null,
    };
  }

  if (!rawLocationInput) {
    return { city: null, state: null, country: null, venue: null, address: null };
  }

  let locationText = '';
  let addressText: string | null = null;
  let venueText: string | null = null;

  if (typeof rawLocationInput === 'string') {
    locationText = rawLocationInput.trim();
  } else if (typeof rawLocationInput === 'object') {
    locationText = [
      rawLocationInput.address,
      rawLocationInput.city,
      rawLocationInput.state,
      rawLocationInput.country,
      rawLocationInput.name,
    ]
      .filter(Boolean)
      .join(', ');
    addressText = rawLocationInput.address || null;
    venueText = rawLocationInput.name || null;
  }

  if (!locationText || locationText.toLowerCase() === 'online' || locationText.toLowerCase() === 'virtual') {
    return { city: null, state: null, country: null, venue: null, address: null };
  }

  let extractedCity: string | null = null;
  let extractedState: string | null = null;
  let extractedCountry: string | null = null;

  if (/india/i.test(locationText)) {
    extractedCountry = 'India';
  }

  // 1. Check City Spelling & Mapping against known database
  const words = locationText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);

  // Check multi-word city names first (e.g. 'greater noida', 'new delhi', 'south west delhi')
  const locationLower = locationText.toLowerCase();
  for (const [key, mapping] of Object.entries(CITY_TO_STATE_MAP)) {
    if (locationLower.includes(key)) {
      extractedCity = mapping.city;
      extractedState = mapping.state;
      extractedCountry = 'India';
      break;
    }
  }

  // Check city spelling aliases if not matched yet
  if (!extractedCity) {
    for (const [alias, canonical] of Object.entries(CITY_SPELLING_MAP)) {
      if (locationLower.includes(alias)) {
        const canonicalKey = canonical.toLowerCase();
        if (CITY_TO_STATE_MAP[canonicalKey]) {
          extractedCity = CITY_TO_STATE_MAP[canonicalKey].city;
          extractedState = CITY_TO_STATE_MAP[canonicalKey].state;
          extractedCountry = 'India';
          break;
        }
      }
    }
  }

  // 2. Check explicit State match if State is still null
  if (!extractedState) {
    for (const stateName of KNOWN_INDIAN_STATES) {
      if (new RegExp(`\\b${stateName}\\b`, 'i').test(locationText)) {
        extractedState = stateName;
        extractedCountry = 'India';
        break;
      }
    }
  }

  return {
    city: extractedCity,
    state: extractedState,
    country: extractedCountry,
    venue: venueText || locationText,
    address: addressText || locationText,
  };
}
