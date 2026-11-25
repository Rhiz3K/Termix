import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({
  executablePath: process.env.CHROME || "/usr/bin/google-chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 412, height: 300 }, deviceScaleFactor: 2 });
await page.goto("file://" + path.join(dir, "tab-fixture.html"), { waitUntil: "networkidle" });
// wait for tailwind cdn
await page.waitForTimeout(1500);
await page.locator("#before").screenshot({ path: path.join(dir, "before-412.png") });
await page.locator("#after").screenshot({ path: path.join(dir, "after-412.png") });
await page.screenshot({ path: path.join(dir, "both-412.png"), fullPage: true });
// measurements
const metrics = await page.evaluate(() => {
  function info(id) {
    const root = document.getElementById(id);
    const strip = root.querySelector(".overflow-x-auto");
    const tab = strip.querySelector(".group\\/tab, [class*=group]");
    const title = tab.querySelector("span.min-w-0, span.truncate") || tab;
    return {
      id,
      stripClient: strip.clientWidth,
      stripScroll: strip.scrollWidth,
      overflows: strip.scrollWidth > strip.clientWidth + 1,
      tabWidth: tab.getBoundingClientRect().width,
      titleText: (title.innerText || title.textContent || "").trim(),
      titleTitle: title.getAttribute && title.getAttribute("title"),
    };
  }
  return { before: info("before"), after: info("after") };
});
console.log(JSON.stringify(metrics, null, 2));
await browser.close();
