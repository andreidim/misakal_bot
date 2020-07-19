import TelegramBot from 'node-telegram-bot-api';
import RetroAchiCommand from './retro-achievement-client.js';

// replace the value below with the Telegram token you receive from @BotFather
const token = '1356899881:AAHF4AWoZVg3Vsp4WogcIsqTDy5Cjst3mGo';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

const retroAchiClient = new RetroAchiCommand();

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

// Listen for any kind of message. There are different kinds of
// messages.

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  // send a message to the chat acknowledging receipt of their message
  let parts = msg.text.trim().split(' ');
  let cmd = parts[0];

  let args = null;
  if(parts.length > 1)
     args = parts.slice(1);
 console.log(cmd + ' ' + args);
  let resp =  await retroAchiClient.runCommand(cmd, args);
  bot.sendMessage(chatId, resp);
 // console.log(resp);

});
