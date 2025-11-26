import express from "express";
import * as http from "http";
import os from "os";
import path from "path";
import fs from "fs";
import puppeteer from "puppeteer-core";

const PORT = process.env.PORT || 8090;

// ✅ Detect chromium path for local & Cloud Run
function getChromePath() {
  // ✅ Cloud Run (Docker)
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  // ✅ Windows local - Chrome installed via puppeteer browsers
  if (os.platform() === "win32") {
    const base = path.join(os.homedir(), ".cache", "puppeteer", "chrome");
    try {
      const versions = fs.readdirSync(base);
      const latest = versions[versions.length - 1];

      return path.join(base, latest, "chrome-win64", "chrome.exe");
    } catch (e) {
      console.warn("⚠️ Puppeteer Chrome not found, falling back to system Chrome");
      return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    }
  }

  // ✅ macOS
  if (os.platform() === "darwin") {
    return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  }

  // ✅ Linux (local or Cloud)
  return "/usr/bin/chromium";
}

const CHROME_PATH = getChromePath();

const app = express();
app.use(express.json({ limit: "20mb" }));

// ✅ Health check
app.get("/health", (_req, res) => res.status(200).send("✅ PDF Service Online"));

// 🚀 PDF endpoint
app.post("/pdf", async (req, res) => {
  const html = req.body?.html || "";
  const key = req.body?.key || "";

  // Security key (your logic)
  if (key !== "cudjocdh^&6dudm") {
    if (!html.trim()) return res.status(400).json({ error: "Lol, go away" });
  }
  if (!html.trim()) return res.status(400).json({ error: "html required" });

  let browser: any;
  const isWin = os.platform() === "win32";

  try {
    console.log("🚀 Launching Chrome:", CHROME_PATH);

    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: isWin
        ? [
            "--disable-gpu",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--allow-file-access-from-files",
            "--enable-local-file-accesses",
            "--disable-dev-shm-usage",
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process"
          ]
        : [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage",
            "--no-zygote",
            "--single-process",
            "--allow-file-access-from-files",
            "--enable-local-file-accesses"
          ],
    });

    const page = await browser.newPage();
    await page.setBypassCSP(true);

    await page.setContent(html, { waitUntil: ["networkidle0", "domcontentloaded"] });

    // ✅ Wait for images
    await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((res) => {
                img.onload = img.onerror = res;
              })
        )
      );
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=output.pdf");
    return res.send(Buffer.from(pdf));
  } catch (err) {
    console.error("❌ PDF Error:", err);
    return res.status(500).json({ error: "PDF failed" });
  } finally {
    if (browser) await browser.close().catch(() => null);
  }
});

app.post("/pdf-58mm", async (req, res) => {
  const html = req.body?.html || "";
  const key = req.body?.key || "";

  // Security key
  if (key !== "cudjocdh^&6dudm") {
    if (!html.trim()) return res.status(400).json({ error: "Lol, go away" });
  }
  if (!html.trim()) return res.status(400).json({ error: "html required" });

  let browser: any;
  const isWin = os.platform() === "win32";

  try {
    console.log("🚀 Launching Chrome:", CHROME_PATH);

    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: isWin
        ? [
            "--disable-gpu",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--allow-file-access-from-files",
            "--enable-local-file-accesses",
            "--disable-dev-shm-usage",
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process"
          ]
        : [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage",
            "--no-zygote",
            "--single-process",
            "--allow-file-access-from-files",
            "--enable-local-file-accesses"
          ],
    });

    const page = await browser.newPage();
    await page.setBypassCSP(true);

    await page.setContent(html, {
      waitUntil: ["networkidle0", "domcontentloaded"]
    });

    // Wait for all images
    await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((res) => {
                img.onload = img.onerror = res;
              })
        )
      );
    });

    // -------------------------------------------
    // 📏 STEP 1: Measure actual rendered height
    // -------------------------------------------
    const heightPx = await page.evaluate(() => {
      const body = document.body;
      return body.scrollHeight;
    });

    // Convert PX → MM (1 px = 0.264583 mm)
    const heightMm = heightPx * 0.264583;

    // Add a little safe padding (thermal printers like breathing room)
    const finalMm = heightMm + 5;

    console.log("📏 Receipt Height:", {
      px: heightPx,
      mm: finalMm.toFixed(2)
    });

    // -------------------------------------------
    // 📄 STEP 2: Generate exact-sized 58mm PDF
    // -------------------------------------------
    const pdf = await page.pdf({
      width: "48mm",             // Printable width for 58mm paper
      height: `${finalMm}mm`,    // ✔ Auto-calculated height
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" }
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=receipt.pdf");
    return res.send(Buffer.from(pdf));

  } catch (err) {
    console.error("❌ PDF Error:", err);
    return res.status(500).json({ error: "PDF failed" });
  } finally {
    if (browser) await browser.close().catch(() => null);
  }
});

app.post("/pdf-80mm", async (req, res) => {
  const html = req.body?.html || "";
  const key = req.body?.key || "";

  // Security key
  if (key !== "cudjocdh^&6dudm") {
    if (!html.trim()) return res.status(400).json({ error: "Lol, go away" });
  }
  if (!html.trim()) return res.status(400).json({ error: "html required" });

  let browser: any;
  const isWin = os.platform() === "win32";

  try {
    console.log("🚀 Launching Chrome:", CHROME_PATH);

    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: isWin
        ? [
            "--disable-gpu",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--allow-file-access-from-files",
            "--enable-local-file-accesses",
            "--disable-dev-shm-usage",
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process"
          ]
        : [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage",
            "--no-zygote",
            "--single-process",
            "--allow-file-access-from-files",
            "--enable-local-file-accesses"
          ],
    });

    const page = await browser.newPage();
    await page.setBypassCSP(true);

    await page.setContent(html, {
      waitUntil: ["networkidle0", "domcontentloaded"]
    });

    // Wait for all images
    await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((res) => {
                img.onload = img.onerror = res;
              })
        )
      );
    });

    // -------------------------------------------
    // 📏 STEP 1: Measure actual rendered height
    // -------------------------------------------
    const heightPx = await page.evaluate(() => {
      const body = document.body;
      return body.scrollHeight;
    });

    // Convert PX → MM (1 px = 0.264583 mm)
    const heightMm = heightPx * 0.264583;

    // Add safety padding
    const finalMm = heightMm + 5;

    console.log("📏 80mm Receipt Height:", {
      px: heightPx,
      mm: finalMm.toFixed(2)
    });

    // -------------------------------------------
    // 📄 STEP 2: Generate exact-sized 80mm PDF
    // -------------------------------------------
    const pdf = await page.pdf({
      width: "72mm",             // Printable width for 80mm thermal printers
      height: `${finalMm}mm`,    // Auto-measured height
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" }
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=receipt-80mm.pdf");
    return res.send(Buffer.from(pdf));

  } catch (err) {
    console.error("❌ PDF Error:", err);
    return res.status(500).json({ error: "PDF failed" });
  } finally {
    if (browser) await browser.close().catch(() => null);
  }
});

app.post("/pdf-76mm", async (req, res) => {
  const html = req.body?.html || "";
  const key = req.body?.key || "";

  // Security key
  if (key !== "cudjocdh^&6dudm") {
    if (!html.trim()) return res.status(400).json({ error: "Lol, go away" });
  }
  if (!html.trim()) return res.status(400).json({ error: "html required" });

  let browser: any;
  const isWin = os.platform() === "win32";

  try {
    console.log("🚀 Launching Chrome:", CHROME_PATH);

    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: isWin
        ? [
            "--disable-gpu",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--allow-file-access-from-files",
            "--enable-local-file-accesses",
            "--disable-dev-shm-usage",
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process"
          ]
        : [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage",
            "--no-zygote",
            "--single-process",
            "--allow-file-access-from-files",
            "--enable-local-file-accesses"
          ],
    });

    const page = await browser.newPage();
    await page.setBypassCSP(true);

    await page.setContent(html, {
      waitUntil: ["networkidle0", "domcontentloaded"]
    });

    // Wait for image loading
    await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((res) => {
                img.onload = img.onerror = res;
              })
        )
      );
    });

    // -------------------------------------------
    // 📏 STEP 1: Measure actual rendered height
    // -------------------------------------------
    const heightPx = await page.evaluate(() => {
      const body = document.body;
      return body.scrollHeight;
    });

    // Convert PX → mm
    const heightMm = heightPx * 0.264583;

    // Add safety padding for dot-matrix
    const finalMm = heightMm + 6;

    console.log("📏 DotMatrix 76mm Height:", {
      px: heightPx,
      mm: finalMm.toFixed(2)
    });

    // -------------------------------------------
    // 📄 STEP 2: Generate exact-sized 76mm PDF
    // -------------------------------------------
    const pdf = await page.pdf({
      width: "70mm",            // Printable width for 76mm dot-matrix
      height: `${finalMm}mm`,   // Auto-measured height
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" }
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=receipt-76mm.pdf");

    return res.send(Buffer.from(pdf));

  } catch (err) {
    console.error("❌ PDF Error:", err);
    return res.status(500).json({ error: "PDF failed" });
  } finally {
    if (browser) await browser.close().catch(() => null);
  }
});

app.post("/pdf-custom", async (req, res) => {
  const html = req.body?.html || "";
  const key = req.body?.key || "";
  const width = req.body?.width || "";
  const height = req.body?.height || "";

  // Security key
  if (key !== "cudjocdh^&6dudm") {
    if (!html.trim()) return res.status(400).json({ error: "Lol, go away" });
  }
  if (!html.trim()) return res.status(400).json({ error: "html required" });

  let browser: any;
  const isWin = os.platform() === "win32";

  try {

    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: isWin
        ? [
            "--disable-gpu",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--allow-file-access-from-files",
            "--enable-local-file-accesses",
            "--disable-dev-shm-usage",
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process"
          ]
        : [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage",
            "--no-zygote",
            "--single-process",
            "--allow-file-access-from-files",
            "--enable-local-file-accesses"
          ],
    });

    const page = await browser.newPage();
    await page.setBypassCSP(true);

    await page.setContent(html, {
      waitUntil: ["networkidle0", "domcontentloaded"]
    });

    // Wait for image loading
    await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((res) => {
                img.onload = img.onerror = res;
              })
        )
      );
    });

    // -------------------------------------------
    // 📏 STEP 1: Measure actual rendered height
    // -------------------------------------------
    // const heightPx = await page.evaluate(() => {
    //   const body = document.body;
    //   return body.scrollHeight;
    // });

    // Convert PX → mm
    // const heightMm = heightPx * 0.264583;

    // Add safety padding for dot-matrix
    // const finalMm = heightMm + 6;

    // -------------------------------------------
    // 📄 STEP 2: Generate exact-sized 76mm PDF
    // -------------------------------------------
    const pdf = await page.pdf({
      width: `${width}mm`,            // Printable width for 76mm dot-matrix
      height: `${Number(height) + 1}mm`,   // Auto-measured height
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" }
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=receipt-76mm.pdf");

    return res.send(Buffer.from(pdf));

  } catch (err) {
    console.error("❌ PDF Error:", err);
    return res.status(500).json({ error: "PDF failed" });
  } finally {
    if (browser) await browser.close().catch(() => null);
  }
});

http.createServer(app).listen(PORT, () => {
  console.log(`✅ PDF Service Ready @ localhost:${PORT}`);
  console.log(`🧠 Chrome Path: ${CHROME_PATH}`);
});
