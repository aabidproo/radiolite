# Radiolite Render Deployment Guide 🚀

Follow these exact steps to host your backend and frontend on Render.

## 1. Prepare your GitHub Repo
Ensure all your project files (backend, frontend, landing) are pushed to a **public or private GitHub repository**.

---

## 2. Deploy the Backend (API + Landing Page)
This is your "Web Service". It handles the API data AND renders your dynamic Landing Page/Blog.

> [!IMPORTANT]
> Do NOT create a separate "Static Site" for the landing page. The Backend already serves it at the root `/`.

1.  Log in to [Render.com](https://dashboard.render.com).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository.
4.  **Service Name**: `radiolite-api` (or similar).
5.  **Root Directory**: `backend` (CRITICAL: ensure it points to the backend folder).
6.  **Language/Runtime**: `Python 3`.
7.  **Build Command**: `pip install -r requirements.txt`.
8.  **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
    > [!CAUTION]
    > Make sure there are **no extra quotes or backticks** at the end of the command in the Render box. The error in your log (`unexpected EOF`) happened because of an extra character at the end.
9.  **Environment Variables**:
    *   Click the **Environment** tab on the left.
    *   Add these variables:
        *   `PROJECT_NAME`: `Radiolite`
        *   `RADIO_BROWSER_URL`: `https://de1.api.radio-browser.info/json`
        *   `CACHE_TTL`: `86400`
        *   `GITHUB_REPO`: `yourname/radiolite` (CRITICAL for private repo downloads)
        *   `GITHUB_TOKEN`: `ghp_your_secret_token` ([Generate a PAT](https://github.com/settings/tokens) with `repo` scope)
10. Click **Create Web Service**. 
11. **Wait for deployment**: Once complete, Render will give you a URL like `https://radiolite-api.onrender.com`. **Copy this URL.**

---

## 3. Deploy the Frontend (Vite App)
This is the static site used for your web view and downloads.

1.  Click **New +** and select **Static Site**.
2.  Connect the same GitHub repository.
3.  **Service Name**: `radiolite-web`.
4.  **Root Directory**: `frontend`.
5.  **Build Command**: `npm run build`.
6.  **Publish Directory**: `dist`.
7.  **Environment Variables**:
    *   Add a variable named **`VITE_API_URL`**.
    *   **Value**: Paste your Backend URL followed by `/api/v1` (e.g., `https://radiolite-api.onrender.com/api/v1`).
8.  Click **Create Static Site**.

---

6.  Now, the next time you create a Release on GitHub, the apps will automatically use your Render backend!

---

## 5. Deploy the Admin Panel (Separate Static Site)
The Admin Panel is a separate project that should be hosted as a **Static Site**.

1.  Click **New +** and select **Static Site**.
2.  Connect the same GitHub repository.
3.  **Service Name**: `radiolite-admin`.
4.  **Root Directory**: `admin`.
5.  **Build Command**: `npm install && npm run build`.
6.  **Publish Directory**: `dist`.
7.  **Environment Variables**:
    *   Add `VITE_API_URL` = `https://your-backend-url.onrender.com/api/v1`
8.  Click **Create Static Site**.

---

## 5. Landing Page Final Step
Open [landing/script.js](file:///Users/aabid/Documents/radiolite/landing/script.js).
1.  Find `const GITHUB_REPO = "PLACEHOLDER_GITHUB_REPO";`.
2.  Replace the placeholder with your repo (e.g., `"yourname/radiolite"`).
3.  Commit and push this change.
