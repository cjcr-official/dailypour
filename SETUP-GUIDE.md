# DAILY POUR — COMPLETE SETUP GUIDE

Follow these steps IN ORDER. Each step takes 2-5 minutes.

---

## STEP 1: Create GitHub Repository (5 minutes)

1. Go to https://github.com/new
2. Repository name: `daily-pour`
3. Make it **Public** (or Private if you prefer)
4. **DO NOT** check "Add a README file"
5. Click **Create repository**
6. You'll see a page with commands. **STOP.** Don't run those yet.

---

## STEP 2: Upload Code to GitHub (3 minutes)

1. Download and unzip `daily-pour.zip` to your computer
2. On the GitHub page from Step 1, find the section that says **"…or create a new repository on the command line"**
3. **OPTION A — If you're comfortable with command line:**
   ```bash
   cd path/to/unzipped/daily-pour
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/daily-pour.git
   git push -u origin main
   ```
   Replace `YOUR-USERNAME` with your actual GitHub username.

4. **OPTION B — If you prefer clicking:**
   - Go back to your repo page: `https://github.com/YOUR-USERNAME/daily-pour`
   - Click **uploading an existing file**
   - Drag ALL the files from the unzipped folder (package.json, src folder, public folder, etc.) into the upload box
   - **IMPORTANT:** Make sure files are at the ROOT level, not inside a `daily-pour` folder
   - Scroll down, click **Commit changes**

5. Refresh the repo page — you should see `package.json`, `src/`, `public/`, etc. at the top level

---

## STEP 3: Set Up Supabase (5 minutes)

### 3A: Create Project (if you haven't already)
1. Go to https://supabase.com/dashboard
2. Click **New project**
3. Pick any name, set a database password (save it somewhere), pick a region close to you
4. Click **Create new project**
5. Wait 2 minutes for it to provision

### 3B: Create Database Tables
1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the `supabase-schema.sql` file from the zip
4. Copy EVERYTHING in that file
5. Paste it into the Supabase SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see "Success. No rows returned" — that's good!

### 3C: Turn Off Email Confirmation
1. Click **Authentication** in the left sidebar
2. Click **Providers**
3. Find **Email** in the list, click it
4. **UNCHECK** the box that says **"Confirm email"**
5. Click **Save**

### 3D: Get Your API Keys
1. Click the **Settings** gear icon (bottom left)
2. Click **API**
3. You'll see two things you need:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **Project API keys** section → find the key labeled `anon` `public`

**COPY THESE TWO VALUES.** You'll need them in Step 4.

---

## STEP 4: Deploy to Cloudflare Pages (5 minutes)

### 4A: Connect GitHub
1. Go to https://dash.cloudflare.com
2. Click **Workers & Pages** in the left sidebar
3. Click **Create application**
4. Click **Pages** tab at the top
5. Click **Connect to Git**
6. Click **Connect GitHub**
7. Authorize Cloudflare if prompted
8. Select **daily-pour** from the repo list
9. Click **Begin setup**

### 4B: Configure Build Settings
On the setup page:

1. **Project name:** leave as `daily-pour` (or change if you want)
2. **Production branch:** `main`
3. **Framework preset:** Select **Vite** from the dropdown
4. **Build command:** should auto-fill to `npm run build` — leave it
5. **Build output directory:** should auto-fill to `dist` — leave it
6. **Root directory:** LEAVE THIS EMPTY (very important!)

### 4C: Add Environment Variables
Still on the same setup page, scroll down to **Environment variables**:

1. Click **Add variable**
2. **Variable name:** `VITE_SUPABASE_URL`
3. **Value:** Paste your Project URL from Step 3D (the `https://abcdefgh.supabase.co` one)
4. Click **Add variable** again
5. **Variable name:** `VITE_SUPABASE_ANON_KEY`
6. **Value:** Paste your anon public key from Step 3D (the long `eyJhbGci...` string)
7. Make sure both variables show **Production** is checked

### 4D: Deploy
1. Click **Save and Deploy** at the bottom
2. Wait 2-3 minutes
3. You'll see a **Success!** message with a URL like `daily-pour-abc.pages.dev`
4. Click **Continue to project**

---

## STEP 5: Test It (2 minutes)

1. Click the **Visit site** button (or open the `.pages.dev` URL)
2. You should see the login screen
3. Try creating an account:
   - Username: `test` (or anything)
   - Password: at least 6 characters
   - Click **create account**
4. If it works, you'll see the coffee app!
5. Try spinning the roulette, logging a coffee, adding a favorite

---

## IF SOMETHING FAILS

### "Build failed" in Cloudflare
1. Go to your Pages project
2. Click **Settings** → **Builds & deployments** → **Build configurations**
3. Double-check:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: **(empty)**
4. Click **Save**
5. Go to **Deployments** → click the failed one → **Retry deployment**

### "Invalid credentials" when signing up
1. Go to Supabase → **Authentication** → **Providers** → **Email**
2. Make sure **"Confirm email"** is UNCHECKED
3. Try signing up again

### Files are in wrong place on GitHub
Your repo should look like this at the top level:
```
package.json
index.html
vite.config.js
src/
public/
supabase-schema.sql
```

NOT like this:
```
daily-pour/
  daily-pour/
    package.json
    ...
```

If it's nested, delete the repo and re-upload the files directly to the root.

---

## DONE!

Your app is now live at your `.pages.dev` URL. You can:
- Add it to your iPhone home screen (Safari → Share → Add to Home Screen)
- Set up a custom domain in Cloudflare Pages settings
- Share the link with anyone (they'll need to create their own account)

Each user gets their own private favorites and calendar — the data is partitioned by user ID in Supabase.
