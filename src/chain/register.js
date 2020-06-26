const Web3 = require('web3');
const Election = require('./abi/Election.json');
const config = require('../../config.json');

async function Register(address, account) {
    const web3 = new Web3(config.RPC_URL);
    const electionContract = getElectionContract(web3, address);
    registerAccount(web3, electionContract.methods.registerVoter(account));
    sendEther(web3, account);
}

async function registerAccount(web3, transaction) {
    const options = {
        to: transaction._parent._address,
        data: transaction.encodeABI(),
        gas: (await web3.eth.getBlock('latest')).gasLimit
    };
    const signed = await web3.eth.accounts.signTransaction(options, config.REG_PRIVATE_KEY);
    await web3.eth.sendSignedTransaction(signed.rawTransaction);
    return;
}

async function sendEther(web3, address) {
    const options = {
        to: address,
        from: config.REG_PUBLIC_KEY,
        value: 100000000000000000,
	gas: 200000
    };
    const signed = await web3.eth.accounts.signTransaction(options, config.REG_PRIVATE_KEY);
    await web3.eth.sendSignedTransaction(signed.rawTransaction);
    return;
}

function getElectionContract(web3, address){
    const contract = new web3.eth.Contract(Election.abi, address);
    return contract;
}

module.exports = Register;
