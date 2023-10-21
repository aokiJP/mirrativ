const config = require("./mirrativ_config");
const { Client, GatewayIntentBits } = require('discord.js');
const { exec } = require('child_process');

const on = ['node scraping'];

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.setMaxListeners(10000);

client.login(config.token);

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const messageContent = await message.content;

  if (message.channelId !== "1164950934393196665") return;

  if (messageContent === "!start") {
    message.reply("botを起動しました");
    on.forEach(a => {
      exec(a, (error, stdout, stderr) => {
        if (error) {
          console.error(`エラーが発生しました: ${error}`);
          return;
        }
        console.log(`標準出力:\n${stdout}`);
        console.error(`標準エラー出力:\n${stderr}`);
      });
    });
  }
});