# Panini FIFA World Cup 2026 Sticker App

A simple Version 1 web app for managing a Panini FIFA World Cup 2026 sticker collection.

- Next.js app
- Google Sheets as the database
- Danish by default, Bosnian as second language
- Admin page for changing your own collection
- Public read-only sharing page with trade proposals
- Statistics always use **980 total stickers**

## Sticker Structure

The app uses exactly 980 stickers:

- `1-20`: 🏆 FIFA World Cup stickers (FWC)
- `21-980`: 48 teams, 20 stickers per team

FWC is shown outside the groups. Groups A-L are shown as separate groups, and every country shows flag, full country name, and abbreviation.

The country flags are saved locally in `public/flags` so they render even when the app is offline. The SVG flag files are from [FlagCDN](https://flagcdn.com/).

## Pages

- Admin: `http://localhost:3000/`
- Public sharing page: `http://localhost:3000/share`

## Google Sheet Setup

You only need one Google Sheet. The app will create these tabs automatically the first time it can connect:

- `Collection`
- `TradeProposals`

### 1. Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com).
2. Create a blank spreadsheet.
3. Copy the Sheet ID from the URL.

Example URL:

```txt
https://docs.google.com/spreadsheets/d/THIS_IS_THE_SHEET_ID/edit
```

### 2. Create Google credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project, or select an existing project.
3. Go to **APIs & Services**.
4. Click **Enable APIs and Services**.
5. Search for **Google Sheets API**.
6. Click **Enable**.

### 3. Create a service account

1. In Google Cloud Console, go to **IAM & Admin**.
2. Open **Service Accounts**.
3. Click **Create service account**.
4. Give it a name, for example `panini-sticker-app`.
5. Finish the setup. You do not need to give it extra Google Cloud roles.
6. Open the service account you created.
7. Go to **Keys**.
8. Click **Add key**.
9. Choose **Create new key**.
10. Choose **JSON**.
11. Download the JSON file.

### 4. Share the Google Sheet with the service account

1. Open the JSON key file.
2. Find `client_email`.
3. Copy that email address.
4. Open your Google Sheet.
5. Click **Share**.
6. Paste the service account email.
7. Give it **Editor** access.
8. Click **Send**.

This step is important. Without sharing the Sheet, the app cannot read or write data.

### 5. Create `.env.local`

Create a file named `.env.local` in the project folder:

```env
GOOGLE_SHEET_ID=your_google_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nPASTE_THE_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
ADMIN_PASSWORD=choose-a-private-password
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PUBLIC_SITE_URL=http://localhost:3000
```

Where to find the values:

- `GOOGLE_SHEET_ID`: from the Google Sheet URL.
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: `client_email` from the JSON key file.
- `GOOGLE_PRIVATE_KEY`: `private_key` from the JSON key file.
- `ADMIN_PASSWORD`: the password you want to use on the admin page.

Keep the `\n` line breaks in the private key. The value should stay on one line inside quotes.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

Enter your admin password, click stickers in **MANGLER** and **BYTTES VÆK**, then click **Gem til Google Sheets**.

## Public Trade Proposals

Visitors use:

```txt
http://localhost:3000/share
```

They can:

- Select stickers they have for you.
- Select stickers they want from your trade stickers.
- Submit only after selecting at least 5 stickers in total.

Trade proposals are saved in the `TradeProposals` tab in Google Sheets.

## Deploying

For deployment, add the same environment variables in your hosting provider, for example Vercel.

Set these to your real website URL:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.dk
PUBLIC_SITE_URL=https://your-domain.dk
```

Then your public sharing page will be:

```txt
https://your-domain.dk/share
```
