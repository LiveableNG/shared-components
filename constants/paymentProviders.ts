interface Country {
    code: string;
    name: string;
    currency: string;
    currencyName: string;
}

interface PaymentProvider {
    id: string;
    name: string;
    countries: Country[];
}

export const paymentProviders: PaymentProvider[] = [
    {
        id: "paystack",
        name: "Paystack",
        countries: [
            { code: "NG", name: "Nigeria", currency: "NGN", currencyName: "Nigerian Naira" },
        ]
    },
    {
        id: "flutterwave",
        name: "Flutterwave",
        countries: [
            { code: "BF", name: "Burkina Faso", currency: "XOF", currencyName: "West African CFA Franc" },
            { code: "CM", name: "Cameroon", currency: "XAF", currencyName: "Central African CFA Franc" },
            { code: "CI", name: "Cote d'Ivoire", currency: "XOF", currencyName: "West African CFA Franc" },
            { code: "GH", name: "Ghana", currency: "GHS", currencyName: "Ghanaian Cedi" },
            { code: "KE", name: "Kenya", currency: "KES", currencyName: "Kenyan Shilling" },
            { code: "NG", name: "Nigeria", currency: "NGN", currencyName: "Nigerian Naira" },
            { code: "RW", name: "Rwanda", currency: "RWF", currencyName: "Rwandan Franc" },
            { code: "SN", name: "Senegal", currency: "XOF", currencyName: "West African CFA Franc" },
            { code: "TZ", name: "Tanzania", currency: "TZS", currencyName: "Tanzanian Shilling" },
            { code: "UG", name: "Uganda", currency: "UGX", currencyName: "Ugandan Shilling" },
            { code: "ZM", name: "Zambia", currency: "ZMW", currencyName: "Zambian Kwacha" }
        ]
    }
];

export type { Country, PaymentProvider };