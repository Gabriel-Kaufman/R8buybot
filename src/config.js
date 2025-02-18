require('dotenv').config();

module.exports = {
    // Solana configuration
    SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    
    // Your token addresses
    YOUR_TOKEN_ADDRESS: process.env.YOUR_TOKEN_ADDRESS,
    VIRTUALS_TOKEN_ADDRESS: process.env.VIRTUALS_TOKEN_ADDRESS,
    
    // Telegram configuration
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHANNEL_ID: process.env.TELEGRAM_CHANNEL_ID
}; 