const { Web3 } = require('web3');

const rpcUrl = 'http://localhost:8545';
const web3 = new Web3(rpcUrl);

async function testConnection() {
    try {
        const latestBlock = await web3.eth.getBlockNumber();
        console.log('Latest block number:', latestBlock);
    } catch (error) {
        console.error('Failed to connect to the blockchain:', error);
    }
}

async function getBalance(accountAddress) {
    const balance = await web3.eth.getBalance(accountAddress);
    console.log(`Balance of ${accountAddress}:`, web3.utils.fromWei(balance, 'ether'), 'ETH');
}

getBalance('0x939559e40f6f2fe8820d0951f1f9742437e310e8');
testConnection();

