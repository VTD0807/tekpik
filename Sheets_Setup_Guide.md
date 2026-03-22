# TekPik Beta Waitlist - Google Sheets Setup Guide

Follow these simple steps exactly as written to connect your \`/beta\` waitlist page to Google Sheets. 

---

### Step 1: Prepare Your Google Sheet
1. Go to [Google Sheets](https://sheets.google.com) and create a **Blank spreadsheet**.
2. Name the file whatever you want (e.g., "TekPik Beta Waitlist").
3. In the first row, type these exactly as your column headers:
   - Cell **A1**: `Timestamp`
   - Cell **B1**: `Name`
   - Cell **C1**: `Email`
   - Cell **D1**: `Phone`
4. Make the first row bold so it looks like a header section.

---

### Step 2: Add the Apps Script
1. In the top menu of your Google Sheet, click **Extensions** > **Apps Script**.
2. A new tab will open with a code editor. Delete all the default code there (`function myFunction()...`).
3. **Paste this exact code** into the editor:

\`\`\`javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rowData = [];
    
    // Column A: Add the current date and time
    rowData.push(new Date()); 
    // Column B: Name from form
    rowData.push(e.parameter.Name);
    // Column C: Email from form
    rowData.push(e.parameter.Email);
    // Column D: Phone from form
    rowData.push(e.parameter.Phone);
    
    // Insert the row into your sheet
    sheet.appendRow(rowData);
    
    // Return a success response back to the website
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
    
  } catch(error) {
    return ContentService.createTextOutput("Error").setMimeType(ContentService.MimeType.TEXT);
  }
}
\`\`\`

4. Click the **Save** icon (the floppy disk) at the top. You can rename the project to "TekPik Waitlist Script" at the top left if you are prompted.

---

### Step 3: Deploy as a Web App (Getting the URL)
1. At the top right of the Apps Script window, click the blue **Deploy** button > **New deployment**.
2. Click the **Gear icon** next to "Select type" and check **Web app**.
3. Fill out the configuration exactly like this:
   - **Description**: `Version 1`
   - **Execute as**: `Me (<your email>)`
   - **Who has access**: `Anyone`  *(CRITICAL: It must say "Anyone" so your website can talk to it without logging in).*
4. Click **Deploy**.

---

### Step 4: Authorize the Script
1. Because this script writes to your own Google Sheet, Google will ask for your permission. Click **Authorize access**.
2. Choose your Google account.
3. You will see a warning screen saying "Google hasn’t verified this app." 
4. Click **Advanced** at the bottom left.
5. Click the link that says **Go to Untitled project (unsafe)** or whatever you named it.
6. Click **Allow**.

---

### Step 5: Copy the URL to Your App
1. You will now see a screen that gives you a **Web app URL** (it starts with `https://script.google.com/macros/s/...`). 
2. Click **Copy** under the URL.
3. Open your TekPik code in VS Code.
4. Go to the file: `pages/beta.jsx`
5. On **Line 13**, you will see this line of code:
   `const scriptURL = '<YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL>';`
6. Replace `<YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL>` with the URL you just copied, so it looks like this:
   `const scriptURL = 'https://script.google.com/macros/s/AKfycb.../exec';`
7. Save the file!

---

🎉 **You're Done!** Go to \`http://localhost:3000/beta\`, fill out the form, and click Join. Then look at your Google Sheet — the data will appear instantly!
