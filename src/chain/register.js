const Web3 = require('web3');
const Election = require('./abi/Election.json');
const config = require('../../config.json');

async function Register(address, account) {
    const web3 = new Web3(config.RPC_URL);
    const electionContract = getElectionContract(web3, address);
    await registerAccount(web3, electionContract.methods.registerVoter(account));
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

function getElectionContract(web3, address){
    const contract = new web3.eth.Contract(Election.abi, address);
    return contract;
}

module.exports = Register;
