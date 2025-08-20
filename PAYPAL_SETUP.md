# PayPal Integration Setup

This guide explains how to set up PayPal integration for one-off donations.

## Required Environment Variables

Add the following environment variables to your `.env.local` file:

### PayPal US (USD) Credentials

```bash
# Test/Sandbox
PAYPAL_US_CLIENT_ID_TEST=your_us_sandbox_client_id
PAYPAL_US_CLIENT_SECRET_TEST=your_us_sandbox_client_secret

# Live/Production
PAYPAL_US_CLIENT_ID_LIVE=your_us_live_client_id
PAYPAL_US_CLIENT_SECRET_LIVE=your_us_live_client_secret
```

### PayPal UK (GBP) Credentials

```bash
# Test/Sandbox
PAYPAL_UK_CLIENT_ID_TEST=your_uk_sandbox_client_id
PAYPAL_UK_CLIENT_SECRET_TEST=your_uk_sandbox_client_secret

# Live/Production
PAYPAL_UK_CLIENT_ID_LIVE=your_uk_live_client_id
PAYPAL_UK_CLIENT_SECRET_LIVE=your_uk_live_client_secret
```

## How to Get PayPal Credentials

1. **Create PayPal Developer Account**
   - Go to [PayPal Developer](https://developer.paypal.com/)
   - Sign up or log in with your PayPal account

2. **Create Applications**
   - In the PayPal Developer Dashboard, go to "My Apps & Credentials"
   - Create separate applications for:
     - US Sandbox (for USD testing)
     - US Live (for USD production)
     - UK Sandbox (for GBP testing) 
     - UK Live (for GBP production)

3. **Configure Applications**
   - For each application, enable these features:
     - **Accept Payments** (required for order processing)
     - **Checkout Experience** (for better user experience)
   - Set return URLs to your domain (e.g., `https://yoursite.com/success`)

4. **Copy Credentials**
   - From each application, copy the Client ID and Client Secret
   - Add them to your environment variables following the naming convention above

## Integration Features

### One-Off Donations Only
- PayPal integration is designed for single payments only
- Monthly/recurring donations continue to use Stripe/GoCardless
- PayPal appears as an option alongside credit card payments for one-time donations

### Supported Currencies
- **USD**: For US-based donations
- **GBP**: For UK-based donations

### Payment Flow
1. User selects PayPal as payment method
2. PayPal button renders with the configured client ID
3. User completes payment through PayPal's secure interface
4. Payment is captured and donation data is stored in your CRM
5. User is redirected to success page

## Testing

### Sandbox Testing
- Use test credentials in your development environment
- PayPal provides test accounts for various scenarios
- Test different payment methods and currencies

### Production Deployment
- Switch to live credentials when deploying to production
- Ensure all environment variables are properly set
- Test with small amounts initially

## Security Notes

- **Never commit credentials to version control**
- Use environment variables for all sensitive data
- Client IDs are safe to expose in frontend code
- Client Secrets must remain server-side only
- PayPal handles all sensitive payment data - no PCI compliance required

## Troubleshooting

### Common Issues
1. **"PayPal is currently unavailable"**
   - Check that environment variables are set correctly
   - Verify client ID matches the currency being used

2. **"Failed to create PayPal order"**
   - Check client secret is correct
   - Ensure PayPal application has required permissions

3. **Payment capture fails**
   - Verify webhook endpoints are configured
   - Check PayPal application settings

### Debug Mode
Set `VERCEL_ENV=development` to use sandbox credentials and enable detailed logging.
