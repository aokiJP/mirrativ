const config = require("./mirrativ_config");
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

let time = 0;
let repeat = 0;
let repeatLog = "";
let repeatInterval = 60;
const chat = "#app > div > div._root_1cuje_3 > div > div._liveInfoContainer_17x75_110 > div._commentsContainer_17x75_170 > input";
const mirrativLogin = "https://www.mirrativ.com/social/google/web_login_redirect_authorize_url?source=%2Fbroadcast%2Fprepare";
const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: config.executablePath,
    // userDataDir: config.userDataDir,
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--enable-webgl',
      '--window-size=800,800'
    ]
  });

  module.exports = browser;

  const page = await browser.newPage();

  await page.setUserAgent(ua);
  await page.goto(mirrativLogin, { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', config.googleUsername);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);
  await page.type('input[type="password"]', config.googlePassword);
  await page.keyboard.press('Enter');

  await new Promise(resolve => setTimeout(resolve, 4000));

  try {

    const url = await browser.newPage();

    await url.goto("https://www.mirrativ.com/user/" + config.broadcast);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const lists = await url.$$("#app > div > div._root_1cuje_3 > div > div.mrBody > div.mrLiveList > ul > ._root_ubfew_3 > ._image_ubfew_11");

    const Url = await lists[0].evaluate(el => el.getAttribute('href'));

    const page = await browser.newPage();

    await page.goto("https://www.mirrativ.com" + Url);

    // const searchQuery = {
    //   start: `Mirrativ botを起動しました`,
    //   1: "1..",
    //   2: "2..",
    //   3: "3.."
    // };

    // for (const type in searchQuery) {
    //   await new Promise(resolve => setTimeout(resolve, 1000));
    //   await page.type(chat, searchQuery[type]);
    //   await page.keyboard.press('Enter');
    // }

    await new Promise(resolve => setTimeout(resolve, 4000));

    await page.exposeFunction('onNewDivElement', async () => {

      const japanStandardTime = new Date().toLocaleString({ timeZone: 'Asia/Tokyo' });
      const date = new Date(japanStandardTime);

      const timeZone = {
        Hour: date.getHours(),
        Min: date.getMinutes(),
        Sec: date.getSeconds()
      }

      const feedHandle = await page.$$("div._commentBody_6t3be_27");

      const chatLog = await feedHandle[0].$$eval('._commentText_6t3be_37', nodes => nodes.map(n => n.innerText));

      const image = await page.$$('a > ._commentAvatar_6t3be_23');

      const parentElement = await image[0].evaluateHandle(element => element.parentElement);

      const parentHTML = await page.evaluate(el => el.getAttribute("href"), parentElement);

      const id = parentHTML.slice(6);

      if (chatLog[0] && id != config.bot) {
        for (admin of config.admin) {
          if (id == admin && chatLog[0].startsWith("2!onRepeat")) {
            repeat = 1;
            await page.type(chat, `[system] 定期コマンドを起動しました`);
            await page.keyboard.press('Enter');
          } else if (id == admin && chatLog[0].startsWith("2!createRepeat")) {
            repeatLog = chatLog[0].slice(14);
            await page.type(chat, `[system] 定期コマンドを${repeatLog}に設定しました`);
            await page.keyboard.press('Enter');
          } else if (id == admin && chatLog[0].startsWith("2!offRepeat")) {
            repeatLog = "";
            repeat = 0;
            await page.type(chat, `[system] 定期コマンドを終了しました`);
            await page.keyboard.press('Enter');
          } else if (id == admin && chatLog[0].startsWith("2!setRepeat")) {
            repeatInterval = chatLog[0].slice(11);
            await page.type(chat, `[system] 定期コマンドの間隔を${repeatInterval}に設定しました`);
            await page.keyboard.press('Enter');
          } else if (id == admin && chatLog[0].startsWith("2!off")) {
            await page.type(chat, `[system] Mirrativ botを終了しました`);
            await page.keyboard.press('Enter');
            browser.close();
          }
        }
      }
    });

    await page.evaluate(() => {
      const targetNode = document.querySelector("#app > div > div._root_1cuje_3 > div > div._liveInfoContainer_17x75_110 > div._commentsContainer_17x75_170 > div._comments_17x75_170");
      const config = { childList: true, subtree: true };
      const callback = (mutationsList, observer) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList') {
            const newDiv = mutation.addedNodes[0];
            if (newDiv && newDiv.tagName.toLowerCase() === 'div') {
              window.onNewDivElement();
            }
          }
        }
      };

      const observer = new MutationObserver(callback);
      observer.observe(targetNode, config);
    });

    while (true) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (Math.floor(time) % repeatInterval == 0 && repeat == 1) {
        await page.type(chat, repeatLog);
        await page.keyboard.press('Enter');
      }

      console.log(time)
      time = time + 1;
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }

})();

// // id属性を使って指定
// const search = await page.$('#search');
// // class属性を使って指定
// const button = await page.$('.button');
// // name属性を使って指定
// const select = await page.$('[name=language]');