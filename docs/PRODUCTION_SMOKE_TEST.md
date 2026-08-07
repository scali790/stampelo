# Production Smoke Test Checklist

Use this checklist after every production deployment or infrastructure change.

## AUTH

- [ ] Google sign-in completes and redirects to `https://www.stampelo.com`
- [ ] Resend magic link email is received and sign-in completes
- [ ] User with `ADMIN_EMAIL` is promoted to admin on sign-in
- [ ] Normal authenticated user cannot access `/admin` (403)
- [ ] Unauthenticated user cannot access protected tRPC procedures

## EDITOR

- [ ] `/editor` loads without errors
- [ ] Default stamp (38 mm round) renders centered and fills ~75% of workspace
- [ ] Text-on-path renders without clipping
- [ ] Clicking a layer shows properties in the Properties panel
- [ ] Color picker changes stamp color
- [ ] Effects (Shabby, Gold, Silver) toggle correctly
- [ ] Preview modal shows stamp with watermark
- [ ] Save design persists across page reload
- [ ] Share link loads the saved design

## TEMPLATES

- [ ] Template drawer opens and shows SVG previews for all templates
- [ ] Category filter works
- [ ] Search returns relevant results
- [ ] Loading a template replaces the current editor state

## PAYMENTS

- [ ] Download modal shows all four plans with correct prices (CHF 2.50 / 3.50 / 4.50 / 5.50)
- [ ] Stripe test checkout completes with card `4242 4242 4242 4242`
- [ ] Fulfillment email is received after payment
- [ ] Download link in email works
- [ ] `/download?orderId=X` shows correct download files for the purchased plan

## EXPORT

- [ ] PNG download: transparent background, high resolution (~898 px for 38 mm at 600 DPI)
- [ ] SVG download: valid SVG, scalable
- [ ] PDF download: opens in PDF viewer, stamp visible
- [ ] DOCX download: opens in Word, stamp visible

Note: EPS is not a customer-facing export and is not included in any plan. It is not tested here.

## PDF EDITOR

- [ ] `/pdf-editor` loads without errors
- [ ] PDF upload succeeds
- [ ] Stamp placement UI renders
- [ ] Merge produces a downloadable PDF with stamp applied

## DOMAIN

- [ ] `https://www.stampelo.com` returns HTTP 200
- [ ] `https://stampelo.com` returns HTTP 308 redirect to `https://www.stampelo.com`
- [ ] SSL certificate is valid
- [ ] `/api/health` returns `{"status":"ok",...}`
- [ ] `/api/auth/providers` returns providers with `https://` URLs
