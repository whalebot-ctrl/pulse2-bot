bot.on('message', (msg) => {
  console.log(`Chat ID: ${msg.chat.id}`);
  bot.sendMessage(msg.chat.id, `Your Chat ID is: ${msg.chat.id}`);
});
