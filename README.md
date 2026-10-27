# UK Take-Home Calculator

A static web page that breaks down a UK salary for the 2026/27 tax year. It shows income tax by band, National Insurance, student loans, the Child Benefit charge, lost childcare support and allowances, the total tax rate and the total net loss.

The site is plain HTML, CSS and JavaScript. There is no build step, server code or database, and calculations run in the visitor's browser, so no salary data leaves their device.

## Files

| Path | What it is |
|---|---|
| `index.html` | The page |
| `css/styles.css` | All styling, including light and dark themes |
| `js/rates.js` | **Tax-year figures. Update this every April.** |
| `js/calculator.js` | Calculation logic (no page code) |
| `js/app.js` | Reads the form and draws the results |
| `embed-snippet.html` | Code to paste into an existing website to embed the calculator |
| `netlify.toml` | Netlify hosting config and security headers |
| `.github/workflows/pages.yml` | Automatic GitHub Pages deploy |
| `Dockerfile`, `nginx.conf` | Self-hosting on your own server |

## Preview locally

```bash
cd uk-tax-calculator
python3 -m http.server 8000
```

Then open http://localhost:8000. You can also double-click `index.html`.

## Deploying

Pick one option.

### Option 1: Netlify (easiest, free)
1. Go to https://app.netlify.com/drop.
2. Drag the `uk-tax-calculator` folder onto the page.
3. To use your own domain, go to **Domain management → Add a domain** and follow the DNS instructions. HTTPS is set up automatically.

Netlify picks up `netlify.toml` for the security headers.

### Option 2: Cloudflare Pages (free)
**Workers & Pages → Create → Pages → Upload assets**, then upload the folder. Cloudflare Pages ignores `netlify.toml`. To keep the headers, copy them into a `_headers` file (format: https://developers.cloudflare.com/pages/configuration/headers/).

### Option 3: GitHub Pages (free)
```bash
git init && git add . && git commit -m "UK take-home calculator"
git branch -M main
git remote add origin https://github.com/<you>/uk-tax-calculator.git
git push -u origin main
```
In the repo, go to **Settings → Pages → Source: GitHub Actions**. Every push to `main` then redeploys the site. Custom domains go under **Settings → Pages → Custom domain**.

GitHub Pages cannot set custom HTTP headers, so the CSP in `netlify.toml` and `nginx.conf` does not apply there.

### Option 4: Your own server (Docker)
```bash
docker build -t uk-tax-calculator .
docker run -d -p 8080:80 --restart unless-stopped uk-tax-calculator
```
Put this container behind your existing reverse proxy (Caddy, Traefik or nginx with Let's Encrypt) for HTTPS. If you don't use Docker, copy `index.html`, `css/` and `js/` into any web root and use `nginx.conf` as a starting point.

### Option 5: Upload to existing hosting
Upload `index.html`, `css/` and `js/` to a folder on your current host, for example `public_html/tax-calculator/`, using FTP or your host's file manager. It will then be live at `yoursite.co.uk/tax-calculator/`.

## Embedding in an existing site (WordPress, Squarespace, Wix and others)

1. Deploy the calculator using one of the options above.
2. Open `embed-snippet.html` and replace `https://tax.example.com/` with your calculator's address.
3. Paste the snippet into a Custom HTML or Embed block on any page.

The iframe grows to fit the calculator, so there's no inner scrollbar. If the calculator is on a **different domain** from the page embedding it, you must allow that page's domain to frame it. In `netlify.toml` and/or `nginx.conf`, change `frame-ancestors 'self'` to:

```
frame-ancestors 'self' https://www.yoursite.co.uk
```

## Updating for a new tax year

1. Edit `js/rates.js`. It holds the Personal Allowance, rUK and Scottish bands, student loan thresholds, Child Benefit weekly rates, the Marriage Allowance value and the Tax-Free Childcare maximum.
2. The National Insurance rates and thresholds (8% / 2%, £12,570 / £50,270, employer 15% over £5,000), the £60,000 Child Benefit charge threshold and the £100,000 childcare limit are in `js/calculator.js`, inside `calc()`.
3. Update the "Tax year …" label at the top of `index.html` and the rates summary in the notes at the bottom.

Check figures against GOV.UK:
- Income tax rates: https://www.gov.uk/income-tax-rates
- Scottish rates: https://www.gov.uk/scottish-income-tax
- NI rates: https://www.gov.uk/national-insurance-rates-letters
- Student loan thresholds: https://www.gov.uk/repaying-your-student-loan/what-you-pay
- Child Benefit rates: https://www.gov.uk/child-benefit-rates

## Disclaimer

Results are estimates, not tax or financial advice. Consider keeping the disclaimer in the page notes visible on your site.
