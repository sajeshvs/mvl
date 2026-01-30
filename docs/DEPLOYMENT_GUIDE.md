# Supplier Marketplace Dashboard - Deployment Guide

This guide explains how to deploy the Supplier Marketplace Dashboard to a shared hosting service or GitHub Pages.

---

## 📁 Project Structure

```
v2/
├── index.html                    # Main landing page
├── shared/
│   ├── styles.css               # Common styles
│   └── utils.js                 # Utility functions
├── supplier-marketplace/
│   ├── index.html               # Dashboard HTML
│   ├── app.js                   # Dashboard JavaScript
│   └── data.json                # Data file (6.23 MB)
├── global-spend-analysis/
│   └── ...
└── disciplines-consolidated/
    └── ...
```

---

## 🌐 Option 1: Deploy to Shared Hosting (cPanel, Plesk, etc.)

### Prerequisites
- FTP client (FileZilla, WinSCP, or Cyberduck)
- Shared hosting account with FTP access

### Step-by-Step Instructions

#### 1. Connect to Your Hosting via FTP

| Setting | Value |
|---------|-------|
| Host | Your FTP hostname (e.g., `ftp.yourdomain.com`) |
| Username | Your FTP username |
| Password | Your FTP password |
| Port | 21 (or 22 for SFTP) |

#### 2. Navigate to the Web Root
- Usually `public_html/` or `www/` or `htdocs/`

#### 3. Create a Folder (Optional)
```
public_html/
└── dashboard/          ← Create this folder
```

#### 4. Upload All Files
Upload the entire contents of the `v2/` folder:

```
public_html/dashboard/
├── index.html
├── shared/
│   ├── styles.css
│   └── utils.js
├── supplier-marketplace/
│   ├── index.html
│   ├── app.js
│   └── data.json
└── ...
```

#### 5. Access Your Dashboard
```
https://yourdomain.com/dashboard/supplier-marketplace/
```

### ⚠️ Important Notes for Shared Hosting

1. **File Size**: The `data.json` file is **6.23 MB**. Ensure your hosting allows large files.

2. **MIME Types**: If JSON files don't load, add this to `.htaccess`:
   ```apache
   AddType application/json .json
   ```

3. **CORS Issues**: If loading data fails, add to `.htaccess`:
   ```apache
   <IfModule mod_headers.c>
       Header set Access-Control-Allow-Origin "*"
   </IfModule>
   ```

4. **Compression**: Enable Gzip for faster loading. Add to `.htaccess`:
   ```apache
   <IfModule mod_deflate.c>
       AddOutputFilterByType DEFLATE application/json
       AddOutputFilterByType DEFLATE text/html
       AddOutputFilterByType DEFLATE text/css
       AddOutputFilterByType DEFLATE application/javascript
   </IfModule>
   ```

---

## 🐙 Option 2: Deploy to GitHub Pages (Free Hosting)

### Prerequisites
- GitHub account
- Git installed on your computer

### Step-by-Step Instructions

#### 1. Create a New GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `supplier-marketplace-dashboard`
3. Set to **Public** (required for free GitHub Pages)
4. Click **Create repository**

#### 2. Initialize Git and Push Files

Open PowerShell in the `v2` folder and run:

```powershell
# Navigate to the v2 folder
cd "c:\Users\Sajesh\Documents\Apps\Rita\PowerBI\v2"

# Initialize Git repository
git init

# Add all files
git add .

# Commit the files
git commit -m "Initial commit - Supplier Marketplace Dashboard"

# Add your GitHub repository as remote (replace with your username)
git remote add origin https://github.com/YOUR_USERNAME/supplier-marketplace-dashboard.git

# Push to GitHub
git branch -M main
git push -u origin main
```

#### 3. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (left sidebar)
3. Under "Source", select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**

#### 4. Access Your Dashboard

After a few minutes, your dashboard will be live at:
```
https://YOUR_USERNAME.github.io/supplier-marketplace-dashboard/supplier-marketplace/
```

### ⚠️ Important Notes for GitHub Pages

1. **File Size Limit**: GitHub has a 100 MB file limit per file. Your `data.json` (6.23 MB) is fine.

2. **Repository Size**: GitHub recommends repositories under 1 GB.

3. **No Server-Side Processing**: GitHub Pages is static-only (no PHP, Python, etc.) - this dashboard is pure HTML/JS so it works perfectly.

4. **Custom Domain** (Optional):
   - Go to Settings → Pages
   - Add your custom domain
   - Create a `CNAME` file in the root with your domain

---

## 🔄 Updating the Dashboard

### For Shared Hosting
1. Modify files locally
2. Re-upload changed files via FTP

### For GitHub Pages
```powershell
# Make your changes, then:
git add .
git commit -m "Updated dashboard"
git push
```
Changes will be live within 1-2 minutes.

---

## 📊 Updating the Data

### Regenerate Data from CSV Files

If you have new CSV data, run the data generation script:

```powershell
cd "c:\Users\Sajesh\Documents\Apps\Rita\PowerBI\v2"
python generate_full_data.py
```

This will regenerate `supplier-marketplace/data.json` from:
- `Quotation Reports/*.csv` (5 files)
- `PO_List_Jan-23-2026.csv`
- `MVL_Clients_List_Jan-23-2026.csv`

Then upload/push the new `data.json` file.

---

## 🔒 Security Considerations

1. **Sensitive Data**: The `data.json` contains business data. If sensitive:
   - Use private hosting instead of GitHub Pages
   - Add password protection via `.htaccess`
   - Consider a login system

2. **Password Protection** (Shared Hosting):
   ```apache
   # .htaccess
   AuthType Basic
   AuthName "Restricted Area"
   AuthUserFile /path/to/.htpasswd
   Require valid-user
   ```

3. **Private GitHub Repository**:
   - Requires GitHub Pro/Team for GitHub Pages
   - Or use Netlify/Vercel with private repo (free tier available)

---

## 🚀 Alternative Hosting Options

| Platform | Free Tier | Custom Domain | Notes |
|----------|-----------|---------------|-------|
| **GitHub Pages** | ✅ Unlimited | ✅ Yes | Best for public projects |
| **Netlify** | ✅ 100 GB/month | ✅ Yes | Drag & drop upload |
| **Vercel** | ✅ 100 GB/month | ✅ Yes | Fast global CDN |
| **Cloudflare Pages** | ✅ Unlimited | ✅ Yes | Fastest CDN |
| **Firebase Hosting** | ✅ 10 GB/month | ✅ Yes | Google infrastructure |

### Quick Deploy to Netlify (Drag & Drop)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the entire `v2` folder onto the page
3. Your site is live instantly!

---

## 📝 Summary

| Deployment Method | URL Format |
|-------------------|------------|
| **Local** | `http://localhost:8080/supplier-marketplace/` |
| **Shared Hosting** | `https://yourdomain.com/dashboard/supplier-marketplace/` |
| **GitHub Pages** | `https://username.github.io/repo-name/supplier-marketplace/` |
| **Netlify** | `https://random-name.netlify.app/supplier-marketplace/` |

---

## 📞 Support

For issues:
1. Check browser console (F12) for JavaScript errors
2. Verify `data.json` loads correctly
3. Check network tab for failed requests
4. Ensure all files were uploaded correctly
