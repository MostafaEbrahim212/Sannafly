# Payment Gateways Setup Guide

Never hardcode API keys in source files. Configure all gateways from **Admin → Payment Methods (`/admin/payment-methods`)**.

## Webhook / Callback URL
All gateways use:
`https://yourdomain.com/payments/callback/{driver}`
(`payments/callback/*` is excluded from CSRF verification and validated using each provider's cryptographic signature/API lookup.)

## Supported Providers
1. **MyFatoorah (`myfatoorah`):** Set `API Key`, `Country` (`EGY`, `KWT`, `SAU`, etc.), and toggle `Sandbox Mode` off for live payments.
2. **Fawry Pay (`fawry`):** Set `Merchant Code` and `Security Key`. Requires `EGP` currency.
3. **Paymob (`paymob`):** Set `API Key`, `Integration ID`, `Iframe ID`, and `HMAC Secret`.
4. **Kashier (`kashier`):** Set `Merchant ID` and `API Key` (used for HPP signature & callback HMAC verification).
5. **InstaPay / Vodafone Cash (`wallet_transfer`):** Set `InstaPay Address`, `Wallet Number`, and customer instructions. Customers upload a transfer receipt image, which admins verify on the Order page.
6. **COD / Cash / Bank Transfer:** Configurable instructions and corporate bank details.
