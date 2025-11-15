# 📄 HTML to PDF Service

Convert HTML to PDF using Puppeteer on Google Cloud Run.

---

## 🎉 **SERVICE IS LIVE!**

**Your Service URL:**
```
https://html-to-pdf-672986594761.us-central1.run.app
```

**Project ID:** `leafy-respect-477410-m3`  
**Region:** `us-central1`

---

## 📡 API Usage

### Endpoint: `POST /pdf`

**Request:**
```json
{
  "html": "<h1>Hello World</h1><p>This is a test.</p>",
  "key": "cudjocdh^&6dudm"
}
```

**Response:** PDF file (application/pdf)

### Examples

#### PowerShell:
```powershell
$url = "https://html-to-pdf-672986594761.us-central1.run.app/pdf"
$body = @{html="<h1>Test</h1>"; key="cudjocdh^&6dudm"} | ConvertTo-Json
Invoke-WebRequest -Uri $url -Method POST -Body $body -ContentType "application/json" -OutFile "output.pdf"
```

#### cURL:
```bash
curl -X POST https://html-to-pdf-672986594761.us-central1.run.app/pdf \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Test</h1>","key":"cudjocdh^&6dudm"}' \
  --output output.pdf
```

#### Python:
```python
import requests

url = "https://html-to-pdf-672986594761.us-central1.run.app/pdf"
data = {"html": "<h1>Test</h1>", "key": "cudjocdh^&6dudm"}

response = requests.post(url, json=data)
with open("output.pdf", "wb") as f:
    f.write(response.content)
```

#### JavaScript/Node.js:
```javascript
const axios = require('axios');
const fs = require('fs');

const url = 'https://html-to-pdf-672986594761.us-central1.run.app/pdf';
const data = {html: '<h1>Test</h1>', key: 'cudjocdh^&6dudm'};

axios.post(url, data, {responseType: 'arraybuffer'})
  .then(response => fs.writeFileSync('output.pdf', response.data));
```

---

## 🔄 Deploy Updates

After making code changes:

```bash
deploy.bat
```

Enter project ID when prompted: `leafy-respect-477410-m3`

---

## 💰 Cost (Basically FREE!)

- ✅ **2 million requests/month: FREE**
- ✅ **When idle: $0** (scales to zero)
- ✅ After free tier: ~$0.40 per million requests

**Monitor costs:** https://console.cloud.google.com/billing

---

## 📊 Monitoring

**Dashboard:**
```
https://console.cloud.google.com/run/detail/us-central1/html-to-pdf
```

**View Logs:**
```bash
gcloud run services logs read html-to-pdf --region us-central1
```

**Health Check:**
```
https://html-to-pdf-672986594761.us-central1.run.app/health
```

---

## 🔒 Security

⚠️ **IMPORTANT:** Change the API key in `src/server.ts` (line 54) before production:

```typescript
if (key !== "YOUR_SECRET_KEY_HERE") {  // ← Change this!
```

Then redeploy: `deploy.bat`

---

## 🛠️ Local Development

```bash
# Install dependencies
yarn install

# Build
yarn build

# Run locally
yarn start

# Development mode
yarn dev
```

Test locally:
```bash
curl -X POST http://localhost:8090/pdf \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Test</h1>","key":"cudjocdh^&6dudm"}' \
  --output test.pdf
```

---

## ⚙️ Configuration

### Increase Memory/CPU:
```bash
gcloud run services update html-to-pdf --memory 4Gi --cpu 4 --region us-central1
```

### Keep Service Warm (no cold starts):
```bash
gcloud run services update html-to-pdf --min-instances 1 --region us-central1
```
*Note: Min instances costs ~$10-15/month*

---

## 📦 Tech Stack

- **Runtime**: Node.js 18
- **Framework**: Express
- **PDF Engine**: Puppeteer + Chromium
- **Platform**: Google Cloud Run
- **Container**: Docker

---

## 📁 Project Files

- `src/server.ts` - Main application code
- `Dockerfile` - Container definition
- `deploy.bat` - Deployment script
- `package.json` - Dependencies
- `.gcloudignore` - Files to ignore during deployment

---

## 🗑️ Delete Service

To stop all costs:
```bash
gcloud run services delete html-to-pdf --region us-central1
```

---

## License

MIT

