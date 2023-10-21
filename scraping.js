const config = require("./mirrativ_config");
const { messages } = require('./message');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { Client, GatewayIntentBits } = require('discord.js');

puppeteer.use(StealthPlugin());

const chat = "#app > div > div._root_1cuje_3 > div > div._liveInfoContainer_17x75_110 > div._commentsContainer_17x75_170 > input";
const mirrativLogin = "https://www.mirrativ.com/social/google/web_login_redirect_authorize_url?source=%2Fbroadcast%2Fprepare";
const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.setMaxListeners(10000);

client.login(config.token);

(async () => {
  const browser = await puppeteer.launch({
    headless: false
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


    for (const type in config.searchQuery) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.type(chat, searchQuery[type]);
      await page.keyboard.press('Enter');
    }

    // await new Promise(resolve => setTimeout(resolve, 4000));

    client.on('messageCreate', async (message) => {
      if (message.author.bot) return;

      if (message.channelId !== config.chat) return;

      const messageContent = await message.content;

      const senderName = await message.author.globalName;

      await page.type(chat, `${senderName} > ${messageContent}`);
      await page.keyboard.press('Enter');
    });

    await page.exposeFunction('onNewDivElement', async () => {

      const japanStandardTime = new Date().toLocaleString({ timeZone: 'Asia/Tokyo' });
      const date = new Date(japanStandardTime);

      const timeZone = {
        Hour: date.getHours(),
        Min: date.getMinutes(),
        Sec: date.getSeconds()
      }

      const user = await page.$$("div._commentBody_6t3be_27");

      const name = await user[0].$$eval('._commentUserName_6t3be_32', nodes => nodes.map(n => n.innerText));

      const chatLog = await user[0].$$eval('._commentText_6t3be_37', nodes => nodes.map(n => n.innerText));

      const image = await page.$$('a > ._commentAvatar_6t3be_23');

      const stylePropertyValue = await image[0].evaluate(element => {
        const style = window.getComputedStyle(element);
        return style.getPropertyValue('background-image'); // 例: 'color' を指定
      });

      const url = stylePropertyValue.slice(5).split('")');

      const destinationChannel = client.channels.cache.get(config.destinationChannelId);
      const destinationChannel2 = client.channels.cache.get(config.destinationChannelId2);

      if (!chatLog[0].includes("が入室しました")) {
        destinationChannel2.send(`${name[0]} >> ${chatLog[0]} [${timeZone.Hour}時${timeZone.Min}分${timeZone.Sec}秒]`);
      }

      const parentElement = await image[0].evaluateHandle(element => element.parentElement);

      const parentHTML = await page.evaluate(el => el.getAttribute("href"), parentElement);

      const id = parentHTML.slice(6);

      if (!chatLog[0].includes("が入室しました")) {
        if (!chatLog) return;
        destinationChannel.send(
          {
            embeds: [{
              author: {
                name: `${name[0]}`
              },
              title: "**コメント情報**",
              description: "```" + chatLog[0] + "```[Mirrativ url](https://www.mirrativ.com/user/" + id + ")",
              thumbnail: {
                url: url[0]
              },
              color: 0x29CCB1,
              footer: {
                text: "Mirrativ bot",
                icon_url: client.user.avatarURL
              },
              timestamp: new Date()
            }]
          }
        );
      }

      if (chatLog[0] && id != config.bot) {
        for (admin of config.admin) {
          if (id == admin && chatLog[0].startsWith("/on")) {
            config.repeat = 1;
            await page.type(chat, `[system] 定期コマンドを起動しました`);
            await page.keyboard.press('Enter');
          } else if (id == admin && chatLog[0].startsWith("/create")) {
            config.repeatLog = chatLog[0].slice(14);
            await page.type(chat, `[system] 定期コマンドを${config.repeatLog}に設定しました`);
            await page.keyboard.press('Enter');
          } else if (id == admin && chatLog[0].startsWith("/off")) {
            config.repeatLog = "";
            config.repeat = 0;
            await page.type(chat, `[system] 定期コマンドを終了しました`);
            await page.keyboard.press('Enter');
          } else if (id == admin && chatLog[0].startsWith("/set")) {
            config.repeatInterval = chatLog[0].slice(11);
            await page.type(chat, `[system] 定期コマンドの間隔を${config.repeatInterval}に設定しました`);
            await page.keyboard.press('Enter');
          } else if (id == admin && chatLog[0].startsWith("/finish")) {
            await page.type(chat, `[system] Mirrativ botを終了しました`);
            await page.keyboard.press('Enter');
            browser.close();
          }
        }

        if (!name[0]?.includes("くん") && !name[0]?.includes("ちゃん")) {
          if (chatLog[0] == "が入室しました" && config.a.includes(name[0]) && !name[0].includes("くん")) {
            await page.type(chat, `${name} さんおかえりなさい💖`);
            await page.keyboard.press('Enter');
          } else if (chatLog[0] == "が入室しました" && !config.a.includes(name[0]) && !name[0].includes("くん")) {
            await page.type(chat, `${name} さんいらっしゃい💖`);
            await page.keyboard.press('Enter');
          }
        } else if (name[0]?.includes("くん")) {
          if (chatLog[0] == "が入室しました" && !config.a.includes(name[0]) && name[0].includes("くん")) {
            await page.type(chat, `${name} いらっしゃい💖`);
            await page.keyboard.press('Enter');
          } else if (chatLog[0] == "が入室しました" && config.a.includes(name[0]) && name[0].includes("くん")) {
            await page.type(chat, `${name} おかえりなさい💖`);
            await page.keyboard.press('Enter');
          }
        } else if (name[0]?.includes("ちゃん")) {
          if (chatLog[0] == "が入室しました" && !config.a.includes(name[0]) && name[0].includes("ちゃん")) {
            await page.type(chat, `${name} いらっしゃい💖`);
            await page.keyboard.press('Enter');
          } else if (chatLog[0] == "が入室しました" && config.a.includes(name[0]) && name[0].includes("ちゃん")) {
            await page.type(chat, `${name} おかえりなさい💖`);
            await page.keyboard.press('Enter');
          }
        }

        if (chatLog[0]?.includes("おはよう") || chatLog[0].includes("おはようございます")) {
          await page.type(chat, `${name} おはようございます`);
          await page.keyboard.press('Enter');
        } else if (chatLog[0]?.includes("こんにちは") || chatLog[0].includes("こんにちわ")) {
          await page.type(chat, `${name} こんにちは`);
          page.keyboard.press('Enter');
        } else if (chatLog[0]?.includes("こんばんは") || chatLog[0].includes("こんばんわ")) {
          await page.type(chat, `${name} こんばんは`);
          await page.keyboard.press('Enter');
        } else if (chatLog[0]?.includes("初見です")) {
          if (config.timeZone.Hour < 12) {
            await page.type(chat, `${name} 初見さんおはようございます`);
            await page.keyboard.press('Enter');
          } else if (18 > timeZone.Hour >= 12) {
            await page.type(chat, `${name} 初見さんこんにちは`);
            await page.keyboard.press('Enter');
          } else if (config.timeZone.Hour >= 18) {
            await page.type(chat, `${name} 初見さんこんばんは`);
            await page.keyboard.press('Enter');
          }
        }

        for (const chat of messages) {
          if (chatLog[0] == "/" + chat.message) {
            await page.type(chat, chat.message);
            await page.keyboard.press('Enter');
          }
        }

        if (chatLog[0] == "が入室しました") {
          if (!config.a.some(a => a == name)) {
            config.a.push(String(name));
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

    // const observeDOM = async () => {
    //   // Mutation Observerを作成
    //   const observer = await page.evaluate(() => {
    //     const targetNode = document.body;
    //     const config = { childList: true, subtree: true };

    //     const callback = (mutationsList) => {
    //       for (const mutation of mutationsList) {
    //         if (mutation.type === 'childList') {
    //           for (const addedNode of mutation.addedNodes) {
    //             if (addedNode instanceof HTMLElement && addedNode.nodeValue === 'DIV') {
    //               console.log('新しいdiv要素が追加されました。');
    //               // ここで新しいdiv要素に対するアクションを実行
    //             }
    //           }
    //         }
    //       }
    //     };document.querySelector("body > div:nth-child(12) > div")

    //     const observer = new MutationObserver(callback);
    //     observer.observe(targetNode, config);

    //     return observer;
    //   });

    //   return observer;
    // };

    // // DOM変更を監視
    // const mutationObserver = await observeDOM();

    while (true) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (Math.floor(config.time) % config.repeatInterval == 0 && repeat == 1) {
        await page.type(chat, config.repeatLog);
        await page.keyboard.press('Enter');
      }

      console.log(config.time)
      time = time + 1;
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }

})();