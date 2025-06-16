const puppeteer = require("puppeteer-core");
const chrome = require("chrome-aws-lambda");

const ALLOWED_FILE_TYPES = ["jpeg", "webp", "png"];

module.exports = async (req, res) => {
  try {
    const url = req.query.url;

    const fullPage =  req.query.fullPage ? (req.query.fullPage.toString().toLowerCase() == "true" ? true : false) : false;
    const screenshotFileType = req.query.type ? req.query.type.toString().toLowerCase() : "png";
    const fileType = ALLOWED_FILE_TYPES.includes(screenshotFileType) ? screenshotFileType : "png";

    const browser = await puppeteer.launch({
      args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath,
      ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();

    await page.setViewport({
      width: Number(req.query.width) || 1920,
      height: Number(req.query.height) || 1080,
      deviceScaleFactor: Number(req.query.deviceScaleFactor) || 1,
    });

    await page.goto(url, {
      waitUntil: "networkidle0",
    });
    const file = await page.screenshot({
      type: fileType,
      fullPage: fullPage,
    });
    await browser.close();

    res.statusCode = 200;
    res.setHeader("Content-Type", `image/${fileType}`);
    res.end(file);
  } catch (err) {
    console.log(err);
    res.statusCode = 500;
    res.json({
      error: err.toString(),
    });
    res.end();
  }
};
