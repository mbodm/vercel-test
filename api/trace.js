const puppeteer = require("puppeteer-core");
const chrome = require("chrome-aws-lambda");
const fs = require("fs");

module.exports = async (req, res) => {
  try {
    const url = req.query.url;

    const browser = await puppeteer.launch({
      args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath,
      ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();
    const trace = `/tmp/trace-${new URL(url).hostname}.json`;
    await page.tracing.start({ path: trace, screenshots: true });

    await page.goto(url, {
      waitUntil: "networkidle0",
    });

    await page.tracing.stop();

    await browser.close();

    res.statusCode = 200;
    const rs = fs.createReadStream(trace);
    res.setHeader("Content-Type", `application/json`);
    res.setHeader("Content-Disposition", `attachment; ${trace}`);
    rs.pipe(res);
  } catch (err) {
    console.log(err);
    res.statusCode = 500;
    res.json({
      error: err.toString(),
    });
    res.end();
  }
};
