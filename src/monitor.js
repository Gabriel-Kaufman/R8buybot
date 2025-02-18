const { Connection, PublicKey } = require('@solana/web3.js');
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');

class TokenMonitor {
    constructor() {
        // Initialize Solana connection without WebSocket
        this.connection = new Connection(
            config.SOLANA_RPC_URL,
            { commitment: 'confirmed' }
        );
        
        // Initialize Telegram bot
        this.bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: false });
        
        // Initialize addresses
        this.yourTokenAddress = new PublicKey(config.YOUR_TOKEN_ADDRESS);
        this.virtualsTokenAddress = new PublicKey(config.VIRTUALS_TOKEN_ADDRESS);
        this.poolAddress = new PublicKey('6xWD98hkRS8oD6umr82GAcseBnpyXYGyKrR9Y2gC76tP');
        
        // Track last signature to avoid duplicates
        this.lastSignature = null;
    }

    async start() {
        console.log('Starting token monitor...');
        
        try {
            await this.bot.sendMessage(config.TELEGRAM_CHANNEL_ID, 'Bot is now monitoring R8 token trades...');
            console.log('Successfully sent test message to Telegram');
        } catch (error) {
            console.error('Error sending test message to Telegram:', error);
        }
        
        // Start polling
        console.log('Starting to poll pool address:', this.poolAddress.toString());
        this.startPolling();
    }

    async startPolling() {
        while (true) {
            try {
                const signatures = await this.connection.getSignaturesForAddress(
                    this.poolAddress,
                    { limit: 1 },
                    'confirmed'
                );

                if (signatures && signatures.length > 0) {
                    const signature = signatures[0].signature;
                    
                    // Check if this is a new transaction
                    if (signature !== this.lastSignature) {
                        console.log('\nNew pool transaction detected:', signature);
                        this.lastSignature = signature;
                        await this.handleTransaction(signature);
                    }
                }

                // Wait 2 seconds before next poll
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.error('Error polling transactions:', error);
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    async handleTransaction(signature) {
        try {
            const transaction = await this.connection.getTransaction(signature, {
                maxSupportedTransactionVersion: 0,
                commitment: 'confirmed'
            });
            
            if (!transaction) {
                console.log('No transaction data found');
                return;
            }

            // Check token balances
            const postBalances = transaction.meta?.postTokenBalances || [];
            const preBalances = transaction.meta?.preTokenBalances || [];
            
            // Get SOL changes from native balances
            const nativeBalances = transaction.meta?.postBalances || [];
            const preNativeBalances = transaction.meta?.preBalances || [];
            
            // Calculate SOL changes for each account
            const solChanges = preNativeBalances.map((preBalance, index) => {
                const postBalance = nativeBalances[index];
                return {
                    accountIndex: index,
                    change: (preBalance - postBalance) / 1e9 // Convert lamports to SOL
                };
            });

            // Find the largest SOL decrease (amount spent)
            const solSpent = solChanges.reduce((max, current) => 
                current.change > max ? current.change : max, 0
            );

            console.log('SOL changes:', solChanges.filter(change => change.change !== 0));
            console.log('Total SOL spent:', solSpent);

            // Find R8 token balance changes
            const r8Balances = postBalances
                .filter(balance => 
                    balance.mint === this.yourTokenAddress.toString() &&
                    balance.accountIndex !== 3  // Exclude pool account by index instead of balance size
                )
                .map(postBalance => {
                    const preBalance = preBalances.find(pre => 
                        pre.accountIndex === postBalance.accountIndex
                    );

                    const change = (postBalance.uiTokenAmount.uiAmount || 0) - 
                                 (preBalance?.uiTokenAmount.uiAmount || 0);

                    return {
                        accountIndex: postBalance.accountIndex,
                        change: change
                    };
                });

            r8Balances.forEach(balance => {
                console.log(`Account ${balance.accountIndex} R8 change:`, balance.change);
            });

            // Find the largest positive change (buy)
            const largestPositiveChange = r8Balances.reduce((max, current) => 
                current.change > max.change ? current : max,
                { change: 0 }
            );

            if (largestPositiveChange.change > 100) {
                console.log('Buy detected:', largestPositiveChange.change, 'R8 tokens');
                console.log('SOL spent:', solSpent);
                await this.sendBuyNotification(largestPositiveChange.change, solSpent, signature);
            } else {
                console.log('No buys detected in this transaction');
            }

        } catch (error) {
            console.error('Error processing transaction:', error);
        }
    }

    async sendBuyNotification(amount, solSpent, signature) {
        // Add one green circle for every 0.1 SOL spent (rounded down)
        const numCircles = Math.floor(solSpent / 0.04);
        const circles = numCircles > 0 ? '🟢'.repeat(numCircles) : '🟢'; // At least one circle

        const caption = `🚀 New R8 Token Buy! 🚀\n\n` +
                       `${circles}\n\n` +
                       `Value: ${solSpent.toFixed(3)} SOL\n` +
                       `Buy Amount: ${amount.toLocaleString()} R8\n` +
                       `[txn hash](https://solscan.io/tx/${signature})`;

        try {
            // Send photo with caption, using Telegram's image resizing
            await this.bot.sendPhoto(
                config.TELEGRAM_CHANNEL_ID, 
                'https://freeimage.host/i/r8buybot.2yhsSzG',
                {
                    caption: caption,
                    parse_mode: 'Markdown'
                }
            );
            console.log('Buy notification sent for transaction:', signature);
        } catch (error) {
            console.error('Error sending Telegram notification:', error);
        }
    }
}

module.exports = TokenMonitor; 