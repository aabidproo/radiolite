# Render Deployment Guide

Since you already have the Backend deployed, follow these steps to update it and deploy the new Admin Panel.

## Phase 1: Update Existing Backend Service

Your backend needs to be updated with the new Analytics changes and Environment Variables.

1.  **Redeploy**: Go to your existing Backend Web Service on Render and click **Manual Deploy** -> **Deploy latest commit**.
    *   *Note: If you have "Auto-Deploy" on, this might have happened automatically when I pushed code. Check the "Events" tab.*

2.  **Add Environment Variables**:
    Go to the **Environment** tab of your Backend Service and **Add** these variables. The app will crash or fail to protect the admin panel without them.

    | Key | Value Recommendation |
    | :--- | :--- |
    | `SECRET_KEY` | Generate a random string (e.g. `openssl rand -hex 32` in terminal). |
    | `ADMIN_USERNAME` | Your desired login username (e.g. `admin`). |
    | `ADMIN_PASSWORD` | Your desired login password. |
    | `DATABASE_URL` | Check this is set to your production PostgreSQL connection string. |

    *The service will restart automatically after saving.*

## Phase 2: Deploy Admin Panel (New Static Site)

The Admin Panel is a separate React application that needs its own "Static Site" service on Render.

1.  **New Service**: On Render Dashboard, click **New +** -> **Static Site**.
2.  **Repository**: Select the same `radiolite` repo.
3.  **Name**: `radiolite-admin` (or similar).
4.  **Branch**: `main`.
5.  **Build Settings**:
    *   **Root Directory**: `admin`
    *   **Build Command**: `npm install && npm run build`
    *   **Publish Directory**: `dist`
6.  **Environment Variables** (Critical):
    *   Add `VITE_API_URL` = `https://your-backend-service-name.onrender.com/api/v1`
    *(Replace with your ACTUAL backend URL)*.

7.  **Click Create Static Site**.

## Phase 3: Final Security Check

- [ ] **CORS**: Ensure your new Admin Panel URL (e.g. `https://radiolite-admin.onrender.com`) is allowed in `backend/app/main.py`.
    *   *I have already added `https://radiolite-admin.onrender.com` to the allowed origins. If Render gives you a different domain, you may need to update `backend/app/main.py` and redeploy the backend.*
- [ ] **Wait**: It may take a few minutes for the database to update on the backend stats.
