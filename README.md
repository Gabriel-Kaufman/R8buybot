# R8 Token Buy Bot

A Telegram bot that monitors and notifies about R8 token purchases on Solana.

## Features
- Monitors R8 token pool transactions
- Detects buy transactions
- Sends notifications with:
  - Buy amount in R8 tokens
  - Value in SOL
  - Transaction link
  - Visual indicators for trade size

## Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Create a .env file with:
   ```
   SOLANA_RPC_URL=your_rpc_url
   YOUR_TOKEN_ADDRESS=your_token_address
   VIRTUALS_TOKEN_ADDRESS=your_virtuals_address
   TELEGRAM_BOT_TOKEN=your_bot_token
   TELEGRAM_CHANNEL_ID=your_channel_id
   ```
4. Run the bot: `node src/index.js`

## Dependencies
- @solana/web3.js
- node-telegram-bot-api
- dotenv