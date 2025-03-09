import React from 'react';

export type CurrencyCode =
    | 'AED'
    | 'ARS'
    | 'AUD'
    | 'BGN'
    | 'BHD'
    | 'BRL'
    | 'BWP'
    | 'CAD'
    | 'CHF'
    | 'CNY'
    | 'CZK'
    | 'DKK'
    | 'EGP'
    | 'ETB'
    | 'EUR'
    | 'GBP'
    | 'GHS'
    | 'GMD'
    | 'HUF'
    | 'ILS'
    | 'INR'
    | 'JPY'
    | 'KES'
    | 'MAD'
    | 'MUR'
    | 'MWK'
    | 'MXN'
    | 'MYR'
    | 'NGN'
    | 'NOK'
    | 'NZD'
    | 'PEN'
    | 'PLN'
    | 'QAR'
    | 'RUB'
    | 'RWF'
    | 'SAR'
    | 'SEK'
    | 'SGD'
    | 'SLL'
    | 'THB'
    | 'TRY'
    | 'TZS'
    | 'UGX'
    | 'USD'
    | 'VEF'
    | 'VND'
    | 'XAF'
    | 'XOF'
    | 'ZAR'
    | 'ZMK'
    | 'ZMW';

// ISO country code to currency code mapping
export const countryToCurrency: Record<string, CurrencyCode> = {
    AE: 'AED', // United Arab Emirates
    AR: 'ARS', // Argentina
    AU: 'AUD', // Australia
    BG: 'BGN', // Bulgaria
    BH: 'BHD', // Bahrain
    BR: 'BRL', // Brazil
    BW: 'BWP', // Botswana
    CA: 'CAD', // Canada
    CH: 'CHF', // Switzerland
    CN: 'CNY', // China
    CZ: 'CZK', // Czech Republic
    DK: 'DKK', // Denmark
    EG: 'EGP', // Egypt
    ET: 'ETB', // Ethiopia
    // Euro countries
    AT: 'EUR', // Austria
    BE: 'EUR', // Belgium
    CY: 'EUR', // Cyprus
    EE: 'EUR', // Estonia
    FI: 'EUR', // Finland
    FR: 'EUR', // France
    DE: 'EUR', // Germany
    GR: 'EUR', // Greece
    IE: 'EUR', // Ireland
    IT: 'EUR', // Italy
    LV: 'EUR', // Latvia
    LT: 'EUR', // Lithuania
    LU: 'EUR', // Luxembourg
    MT: 'EUR', // Malta
    NL: 'EUR', // Netherlands
    PT: 'EUR', // Portugal
    SK: 'EUR', // Slovakia
    SI: 'EUR', // Slovenia
    ES: 'EUR', // Spain
    // End of Euro countries
    GB: 'GBP', // United Kingdom
    GH: 'GHS', // Ghana
    GM: 'GMD', // Gambia
    HU: 'HUF', // Hungary
    IL: 'ILS', // Israel
    IN: 'INR', // India
    JP: 'JPY', // Japan
    KE: 'KES', // Kenya
    MA: 'MAD', // Morocco
    MU: 'MUR', // Mauritius
    MW: 'MWK', // Malawi
    MX: 'MXN', // Mexico
    MY: 'MYR', // Malaysia
    NG: 'NGN', // Nigeria
    NO: 'NOK', // Norway
    NZ: 'NZD', // New Zealand
    PE: 'PEN', // Peru
    PL: 'PLN', // Poland
    QA: 'QAR', // Qatar
    RU: 'RUB', // Russia
    RW: 'RWF', // Rwanda
    SA: 'SAR', // Saudi Arabia
    SE: 'SEK', // Sweden
    SG: 'SGD', // Singapore
    SL: 'SLL', // Sierra Leone
    TH: 'THB', // Thailand
    TR: 'TRY', // Turkey
    TZ: 'TZS', // Tanzania
    UG: 'UGX', // Uganda
    US: 'USD', // United States
    VE: 'VEF', // Venezuela
    VN: 'VND', // Vietnam
    ZA: 'ZAR', // South Africa
    ZM: 'ZMW', // Zambia
};

const currencySymbols: Record<CurrencyCode, string> = {
    AED: 'د.إ',
    ARS: '$',
    AUD: 'A$',
    BGN: 'лв',
    BHD: '.د.ب',
    BRL: 'R$',
    BWP: 'P',
    CAD: 'C$',
    CHF: 'CHF',
    CNY: '¥',
    CZK: 'Kč',
    DKK: 'kr',
    EGP: 'E£',
    ETB: 'Br',
    EUR: '€',
    GBP: '£',
    GHS: 'GH₵',
    GMD: 'D',
    HUF: 'Ft',
    ILS: '₪',
    INR: '₹',
    JPY: '¥',
    KES: 'KSh',
    MAD: 'د.م.',
    MUR: '₨',
    MWK: 'MK',
    MXN: '$',
    MYR: 'RM',
    NGN: '₦',
    NOK: 'kr',
    NZD: 'NZ$',
    PEN: 'S/',
    PLN: 'zł',
    QAR: 'ر.ق',
    RUB: '₽',
    RWF: 'FRw',
    SAR: '﷼',
    SEK: 'kr',
    SGD: 'S$',
    SLL: 'Le',
    THB: '฿',
    TRY: '₺',
    TZS: 'TSh',
    UGX: 'USh',
    USD: '$',
    VEF: 'Bs.',
    VND: '₫',
    XAF: 'FCFA',
    XOF: 'CFA',
    ZAR: 'R',
    ZMK: 'ZK',
    ZMW: 'ZK',
};


/**
 * Convert an amount from one currency to another
 * @param amount The amount to convert
 * @param fromCurrency The source currency code
 * @param toCurrency The target currency code
 * @param exchangeRates Object containing exchange rates relative to a base currency
 * @returns The converted amount
 */
export function convertCurrency(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    exchangeRates: Record<CurrencyCode, number>
): number {
    if (fromCurrency === toCurrency) return amount;
    
    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];
    
    if (!fromRate || !toRate) {
        throw new Error(`Exchange rate not available for ${fromCurrency} or ${toCurrency}`);
    }
    
    return (amount / fromRate) * toRate;
}

/**
 * Get the default currency decimal places
 * @param currencyCode The currency code
 * @returns The number of decimal places typically used for the currency
 */
export function getCurrencyDecimalPlaces(currencyCode: CurrencyCode): number {
    // Currencies that typically don't use decimal places
    const zeroDecimalCurrencies = ['JPY', 'VND', 'KRW', 'CLP', 'PYG', 'ISK', 'HUF'];
    
    if (zeroDecimalCurrencies.includes(currencyCode)) {
        return 0;
    }
    
    return 2; // Most currencies use 2 decimal places
}

/**
 * Parse a currency string into a number
 * @param currencyString The currency string to parse (e.g., "$1,234.56")
 * @returns The parsed number or NaN if parsing fails
 */
export function parseCurrencyString(currencyString: string): number {
    // Remove currency symbol and any non-numeric characters except decimal point
    const numericString = currencyString.replace(/[^\d.-]/g, '');
    return parseFloat(numericString);
}

/**
 * Convert country code to country name
 * @param countryCode ISO country code (e.g., 'US', 'GB') or full country name
 * @param lowercase Whether to return the country name in lowercase
 * @returns The corresponding country name or the original code if not found
 */
export function getCountryNameFromCode(countryCode: string, lowercase: boolean = false): string {
  // If empty or null, return empty string
  if (!countryCode) return '';
  
  const countryNames: Record<string, string> = {
      AE: 'United Arab Emirates',
      AR: 'Argentina',
      AT: 'Austria',
      AU: 'Australia',
      BE: 'Belgium',
      BG: 'Bulgaria',
      BH: 'Bahrain',
      BR: 'Brazil',
      BW: 'Botswana',
      CA: 'Canada',
      CH: 'Switzerland',
      CN: 'China',
      CY: 'Cyprus',
      CZ: 'Czech Republic',
      DE: 'Germany',
      DK: 'Denmark',
      EE: 'Estonia',
      EG: 'Egypt',
      ES: 'Spain',
      ET: 'Ethiopia',
      FI: 'Finland',
      FR: 'France',
      GB: 'United Kingdom',
      GH: 'Ghana',
      GM: 'Gambia',
      GR: 'Greece',
      HU: 'Hungary',
      IE: 'Ireland',
      IL: 'Israel',
      IN: 'India',
      IT: 'Italy',
      JP: 'Japan',
      KE: 'Kenya',
      LT: 'Lithuania',
      LU: 'Luxembourg',
      LV: 'Latvia',
      MA: 'Morocco',
      MT: 'Malta',
      MU: 'Mauritius',
      MW: 'Malawi',
      MX: 'Mexico',
      MY: 'Malaysia',
      NG: 'Nigeria',
      NL: 'Netherlands',
      NO: 'Norway',
      NZ: 'New Zealand',
      PE: 'Peru',
      PL: 'Poland',
      PT: 'Portugal',
      QA: 'Qatar',
      RU: 'Russia',
      RW: 'Rwanda',
      SA: 'Saudi Arabia',
      SE: 'Sweden',
      SG: 'Singapore',
      SI: 'Slovenia',
      SK: 'Slovakia',
      SL: 'Sierra Leone',
      TH: 'Thailand',
      TR: 'Turkey',
      TZ: 'Tanzania',
      UG: 'Uganda',
      US: 'United States',
      USA: 'United States',
      VE: 'Venezuela',
      VN: 'Vietnam',
      ZA: 'South Africa',
      ZM: 'Zambia',
  };
  
  // Handle non-ISO codes and full names
  const normalizedCode = countryCode.trim().toUpperCase();
  
  // If it's already a full country name, just return it
  const allCountryNames = Object.values(countryNames).map(name => name.toUpperCase());
  if (allCountryNames.includes(normalizedCode)) {
      const exactName = Object.values(countryNames).find(
          name => name.toUpperCase() === normalizedCode
      );
      return lowercase ? exactName!.toLowerCase() : exactName!;
  }
  
  // Try to find by ISO code
  const name = countryNames[normalizedCode] || countryCode;
  return lowercase ? name.toLowerCase() : name;
}

/**
 * Get the currency code for a given country code
 * @param countryCode ISO country code (e.g., 'US', 'GB')
 * @returns The corresponding currency code or undefined
 */
export function getCurrencyCodeFromCountry(countryCode: string): CurrencyCode | undefined {
    const countryToCurrency: Record<string, CurrencyCode> = {
        AE: 'AED', // United Arab Emirates
        AR: 'ARS', // Argentina
        AU: 'AUD', // Australia
        BG: 'BGN', // Bulgaria
        BH: 'BHD', // Bahrain
        BR: 'BRL', // Brazil
        BW: 'BWP', // Botswana
        CA: 'CAD', // Canada
        CH: 'CHF', // Switzerland
        CN: 'CNY', // China
        CZ: 'CZK', // Czech Republic
        DK: 'DKK', // Denmark
        EG: 'EGP', // Egypt
        ET: 'ETB', // Ethiopia
        // Euro countries
        AT: 'EUR', DE: 'EUR', ES: 'EUR', FR: 'EUR', IT: 'EUR', NL: 'EUR', 
        PT: 'EUR', IE: 'EUR', FI: 'EUR', SK: 'EUR', LV: 'EUR', LT: 'EUR',
        // Other countries
        GB: 'GBP', // United Kingdom
        GH: 'GHS', // Ghana
        GM: 'GMD', // Gambia
        HU: 'HUF', // Hungary
        IL: 'ILS', // Israel
        IN: 'INR', // India
        JP: 'JPY', // Japan
        KE: 'KES', // Kenya
        MA: 'MAD', // Morocco
        MU: 'MUR', // Mauritius
        MW: 'MWK', // Malawi
        MX: 'MXN', // Mexico
        MY: 'MYR', // Malaysia
        NG: 'NGN', // Nigeria
        NO: 'NOK', // Norway
        NZ: 'NZD', // New Zealand
        PE: 'PEN', // Peru
        PL: 'PLN', // Poland
        QA: 'QAR', // Qatar
        RU: 'RUB', // Russia
        RW: 'RWF', // Rwanda
        SA: 'SAR', // Saudi Arabia
        SE: 'SEK', // Sweden
        SG: 'SGD', // Singapore
        SL: 'SLL', // Sierra Leone
        TH: 'THB', // Thailand
        TR: 'TRY', // Turkey
        TZ: 'TZS', // Tanzania
        UG: 'UGX', // Uganda
        US: 'USD', // United States
        VE: 'VEF', // Venezuela
        VN: 'VND', // Vietnam
        ZA: 'ZAR', // South Africa
        ZM: 'ZMW', // Zambia
    };
    
    return countryToCurrency[countryCode.toUpperCase()];
}

/**
 * Get currency symbol from currency code or ISO country code
 * @param code Currency code (e.g. 'USD') or ISO country code (e.g. 'US')
 * @param fallback Optional fallback symbol if code is not found (defaults to '₦')
 * @returns The currency symbol
 */
function getCurrencySymbol(code: string, fallback = '₦'): string {
    // If it's a currency code
    if (code in currencySymbols) {
        return currencySymbols[code as CurrencyCode];
    }
    
    // If it's a country code
    const currencyCode = countryToCurrency[code];
    if (currencyCode) {
        return currencySymbols[currencyCode];
    }
    
    return fallback;
}

/**
 * Format a number as currency with the appropriate symbol
 * @param amount The amount to format
 * @param code Currency code or ISO country code
 * @param options Intl.NumberFormatOptions to customize formatting
 * @returns Formatted currency string
 */
export function formatCurrency(
    amount: number, 
    code: string, 
    options: Intl.NumberFormatOptions = {}
): string {
    // Determine currency code
    let currencyCode: string;
    
    if (code in currencySymbols) {
        currencyCode = code;
    } else {
        currencyCode = countryToCurrency[code] || 'NGN';
    }
    
    const defaultOptions: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    };
    
    try {
        return new Intl.NumberFormat('en-US', { ...defaultOptions, ...options }).format(amount);
    } catch (error) {
        // Fallback if Intl.NumberFormat fails
        const symbol = getCurrencySymbol(code);
        return `${symbol}${amount.toFixed(2)}`;
    }
}

/**
 * React component to display currency values with proper formatting
 */
export function CurrencyDisplay({
    amount,
    currencyCode,
    options = {},
    className = '',
  }: {
    amount: number;
    currencyCode: string;
    options?: Intl.NumberFormatOptions;
    className?: string;
  }) {
    const formattedValue = formatCurrency(amount, currencyCode, options);
    
    return <span className={className}>{formattedValue}</span>;
  }
  
  /**
   * React component for currency input with proper formatting
   */
  export function CurrencyInput({
    value,
    onChange,
    currencyCode,
    placeholder = '0.00',
    className = '',
    disabled = false,
  }: {
    value: number | string;
    onChange: (value: number) => void;
    currencyCode: string;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
  }) {
    const symbol = getCurrencySymbol(currencyCode);
    const decimalPlaces = getCurrencyDecimalPlaces(currencyCode as CurrencyCode);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^\d.-]/g, '');
      const numericValue = parseFloat(rawValue);
      
      if (!isNaN(numericValue)) {
        onChange(numericValue);
      } else if (rawValue === '' || rawValue === '-') {
        onChange(0);
      }
    };
  
    const displayValue = typeof value === 'number' 
      ? value.toFixed(decimalPlaces) 
      : value;
  
    return (
      <div className={`currency-input-container ${className}`}>
        <span className="currency-symbol">{symbol}</span>
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className="currency-input"
        />
      </div>
    );
  }
  
  /**
   * Get a list of all available currencies with their symbols and names
   */
  export function getAllCurrencies(): Array<{code: CurrencyCode, symbol: string, name: string}> {
    const currencyNames: Record<CurrencyCode, string> = {
      AED: 'UAE Dirham',
      ARS: 'Argentine Peso',
      AUD: 'Australian Dollar',
      BGN: 'Bulgarian Lev',
      BHD: 'Bahraini Dinar',
      BRL: 'Brazilian Real',
      BWP: 'Botswana Pula',
      CAD: 'Canadian Dollar',
      CHF: 'Swiss Franc',
      CNY: 'Chinese Yuan',
      CZK: 'Czech Koruna',
      DKK: 'Danish Krone',
      EGP: 'Egyptian Pound',
      ETB: 'Ethiopian Birr',
      EUR: 'Euro',
      GBP: 'British Pound',
      GHS: 'Ghanaian Cedi',
      GMD: 'Gambian Dalasi',
      HUF: 'Hungarian Forint',
      ILS: 'Israeli New Shekel',
      INR: 'Indian Rupee',
      JPY: 'Japanese Yen',
      KES: 'Kenyan Shilling',
      MAD: 'Moroccan Dirham',
      MUR: 'Mauritian Rupee',
      MWK: 'Malawian Kwacha',
      MXN: 'Mexican Peso',
      MYR: 'Malaysian Ringgit',
      NGN: 'Nigerian Naira',
      NOK: 'Norwegian Krone',
      NZD: 'New Zealand Dollar',
      PEN: 'Peruvian Sol',
      PLN: 'Polish Złoty',
      QAR: 'Qatari Riyal',
      RUB: 'Russian Ruble',
      RWF: 'Rwandan Franc',
      SAR: 'Saudi Riyal',
      SEK: 'Swedish Krona',
      SGD: 'Singapore Dollar',
      SLL: 'Sierra Leonean Leone',
      THB: 'Thai Baht',
      TRY: 'Turkish Lira',
      TZS: 'Tanzanian Shilling',
      UGX: 'Ugandan Shilling',
      USD: 'US Dollar',
      VEF: 'Venezuelan Bolívar',
      VND: 'Vietnamese Đồng',
      XAF: 'Central African CFA Franc',
      XOF: 'West African CFA Franc',
      ZAR: 'South African Rand',
      ZMK: 'Zambian Kwacha (pre-2013)',
      ZMW: 'Zambian Kwacha',
    };
    
    return Object.keys(currencySymbols).map((code) => ({
      code: code as CurrencyCode,
      symbol: currencySymbols[code as CurrencyCode],
      name: currencyNames[code as CurrencyCode] || code
    }));
  }
  
  /**
   * Currency selector component
   */
  export function CurrencySelector({
    value,
    onChange,
    className = '',
  }: {
    value: CurrencyCode;
    onChange: (currency: CurrencyCode) => void;
    className?: string;
  }) {
    const currencies = getAllCurrencies();
    
    return (
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value as CurrencyCode)}
        className={`currency-selector ${className}`}
      >
        {currencies.map(currency => (
          <option key={currency.code} value={currency.code}>
            {currency.symbol} {currency.code} - {currency.name}
          </option>
        ))}
      </select>
    );
  }
  
  /**
   * Component to display currency conversion/comparison
   */
  export function CurrencyComparison({
    amount,
    fromCurrency,
    toCurrency,
    exchangeRates,
    className = '',
  }: {
    amount: number;
    fromCurrency: CurrencyCode;
    toCurrency: CurrencyCode;
    exchangeRates: Record<CurrencyCode, number>;
    className?: string;
  }) {
    const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency, exchangeRates);
    
    return (
      <div className={`currency-comparison ${className}`}>
        <span className="original-amount">
          {formatCurrency(amount, fromCurrency)}
        </span>
        <span className="conversion-symbol">≈</span>
        <span className="converted-amount">
          {formatCurrency(convertedAmount, toCurrency)}
        </span>
      </div>
    );
  }
  
  /**
   * Format a number as currency with the appropriate symbol and locale
   * @param amount The amount to format
   * @param code Currency code or ISO country code
   * @param locale The locale to use for formatting (defaults to 'en-US')
   * @param options Intl.NumberFormatOptions to customize formatting
   * @returns Formatted currency string
   */
  export function formatCurrencyWithLocale(
      amount: number, 
      code: string,
      locale: string = 'en-US',
      options: Intl.NumberFormatOptions = {}
  ): string {
      // Determine currency code
      let currencyCode: string;
      
      if (code in currencySymbols) {
          currencyCode = code;
      } else {
          currencyCode = countryToCurrency[code] || 'NGN';
      }
      
      const defaultOptions: Intl.NumberFormatOptions = {
          style: 'currency',
          currency: currencyCode,
          minimumFractionDigits: getCurrencyDecimalPlaces(currencyCode as CurrencyCode),
          maximumFractionDigits: getCurrencyDecimalPlaces(currencyCode as CurrencyCode),
      };
      
      try {
          return new Intl.NumberFormat(locale, { ...defaultOptions, ...options }).format(amount);
      } catch (error) {
          // Fallback if Intl.NumberFormat fails
          return formatCurrency(amount, code, options);
      }
  }
  
  /**
   * Format currency for compact display (e.g., $1.2K, $1.5M)
   */
  export function formatCompactCurrency(
      amount: number,
      code: string,
      locale: string = 'en-US'
  ): string {
      let currencyCode: string;
      
      if (code in currencySymbols) {
          currencyCode = code;
      } else {
          currencyCode = countryToCurrency[code] || 'NGN';
      }
      
      try {
          return new Intl.NumberFormat(locale, {
              style: 'currency',
              currency: currencyCode,
              notation: 'compact',
              compactDisplay: 'short'
          }).format(amount);
      } catch (error) {
          // Fallback
          const symbol = getCurrencySymbol(code);
          if (Math.abs(amount) >= 1_000_000) {
              return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
          } else if (Math.abs(amount) >= 1_000) {
              return `${symbol}${(amount / 1_000).toFixed(1)}K`;
          }
          return formatCurrency(amount, code);
      }
  }

export default getCurrencySymbol;