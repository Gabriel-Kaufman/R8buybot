const TokenMonitor = require('./monitor');

async function main() {
    const monitor = new TokenMonitor();
    await monitor.start();
}

main().catch(console.error); 