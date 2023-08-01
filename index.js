import dotenv from "dotenv";
dotenv.config();
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());
import { writeFile } from "fs";

const url = "https://unsplash.com/";
const searchTermCLI =
  process.argv.length >= 3 ? process.argv[2] : process.env.SEARCH_TERM
const log = console.log;

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    page.on("response", async (response) => {
      const headers = response.headers();
      const url = new URL(response.url());
      const isMatch =
        headers["content-type"]?.includes("image/avif") &&
        url.href.startsWith("https://images.unsplash.com/photo-") &&
        headers["content-length"] > 30000;

      if (isMatch) {
        // log("Response URL: ", url.pathname);

        await response.buffer().then((buffer) => {
          writeFile(`./images/${url.pathname}.avif`, buffer, (err) => {
            if (err) {
              log("Error occured: ", err.message);
            }
          });
        });
      }
    });

    await page.goto(url);
    await page.screenshot({ path: "./images/unshpash-home.jpeg" });

    const btn = await page.waitForSelector(
      'button[data-test="nav-bar-search-form-button"]'
    );

    await page.type(
      'input[data-test="nav-bar-search-form-input"]',
      searchTermCLI,
      {
        delay: 100,
      }
    );

    await Promise.all([page.waitForNavigation({ timeout: 6000 }), btn.click()]);

    await page.waitForNetworkIdle();

    await page.screenshot({ path: "./images/unshpash-search.jpeg" });

    await browser.close();
  } catch (error) {
    log("Error occured: ", error.message);
  }
})();
