# Browser Cache Troubleshooting Guide

## The Issue
Changes to `script.js` may not be visible because your browser has cached the old version.

## Solutions (Try in Order):

### 1. **Hard Refresh (Recommended)**
   - **Chrome/Edge/Firefox on Windows:**
     - Press: `Ctrl + Shift + Delete` (Opens Cache Clear)
     - Or: `Ctrl + F5` (Hard refresh)
     - Or: `Ctrl + Shift + R` (Hard refresh)
   
   - **Firefox:**
     - Press: `Ctrl + Shift + Delete`

### 2. **DevTools Disable Cache**
   - Open DevTools: `F12`
   - Go to "Settings" (gear icon bottom right)
   - Check: ✓ "Disable cache (while DevTools open)"
   - Refresh page

### 3. **Manual Cache Clearing**
   - **Chrome:** Settings → Privacy → Clear browsing data
   - **Edge:** Settings → Privacy → Clear browsing data
   - **Firefox:** Preferences → Privacy → Clear Data
   - Select "Cached images and files"
   - Click "Clear"

### 4. **Local Server (Best Option)**
   If static file caching persists, use a local server:
   
   ```bash
   # Python 3.x
   python -m http.server 8000
   
   # Or Node.js (if installed)
   npx http-server
   ```
   
   Then visit: `http://localhost:8000`

## What You Should See NOW:

1. ✅ **Modal enhancements:**
   - Click "View Details" on any event card
   - See a rotating 3D wireframe icon next to the event name
   - Watch the event rules text "decode" from random characters to actual text over 1 second

2. ✅ **Blue dot particles:**
   - Plain blue dots continuously moving on all pages
   - Faster movement when you scroll
   - 2x faster when hovering over committee members
   - Cyan color change when hovering over member cards

## Verify Changes in Code:
- Open DevTools → Sources → script.js
- Search for "scrambleText" or "create3DModalIcon"
- If found, your cache was the issue
- If NOT found, files weren't saved properly

## Need Help?
- Check the browser console for errors: `F12` → Console tab
- Look for red error messages about script loading

---
**Last Updated:** Commit `4a0f980`
