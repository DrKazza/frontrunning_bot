
require("dotenv").config();
const Web3 = require('web3');
const url = process.env.INFURAURL;
const wss = process.env.INFURAWS;
const web3 = new Web3(new Web3.providers.HttpProvider(url));
const web3WS = new Web3(new Web3.providers.WebsocketProvider(wss));
var subscription;

//Trade methods:
//  0x414bf389   Uniswap v3  exactInputSingle WETH-LIMIT
//  0xc04b8d59   Uniswap v3  exactInputSingle USDT-LIMIT 
//  Swap Exact Eth for Tokens   Uniswap v2
//  Swap Eth for Exact Tokens   Uniswap v2

const parseTx = (input) => {
    if (input == '0x') {
        return ['0x', []]
    }
    if ((input.length - 8 - 2) % 64 != 0) {
        throw "Data size misaligned with parse request."
    }
    let method = input.substring(0, 10);
    let numParams = (input.length - 8 - 2) / 64;
    var params = [];
    for (i = 0; i < numParams; i += 1) {
        let param = parseInt(input.substring(10 + 64 * i, 10 + 64 * (i + 1)), 16);
        params.push(param);
    }
    return [method, params]
}

const isPending = async (transactionHash) => {
    return await web3.eth.getTransactionReceipt(transactionHash) == null;
}

const handleTransaction = async (transaction) =>{
    console.log(`Transaction: ${transaction}`)
    console.log(`**********************`)
    if (await isPending(transaction['hash'])) {
        console.log(`Transaction['to']: ${transaction['to']}`)
        let data = parseTx(transaction['input'])
        console.log(`Method: ${data[0]}`)
        console.log(`Params: ${data[1]}`)
    }
    return true;
}


const main = async () => {
    console.log(`CP1`)
    subscription = web3WS.eth.subscribe('pendingTransactions', function (error, result){
    }).on("data", async function (transactionHash) {
        console.log(`CP2`)
        let transaction = await web3.eth.getTransaction(transactionHash);
        handleTransaction(transaction);
    })
};

//****  HANDLE NULL TRANSACTION

/*
DIFF VERSION:
const ethers = require("ethers");

const main = () => {
  var customWsProvider = new ethers.providers.WebSocketProvider(url);
  
  customWsProvider.on("pending", (tx) => {
    customWsProvider.getTransaction(tx).then(function (transaction) {
      handleTransaction(transaction);
    });
  });

  customWsProvider._websocket.on("error", async () => {
    console.log(`Unable to connect retrying in 3s...`);
//    console.log(`Unable to connect to ${ep.subdomain} retrying in 3s...`);
    setTimeout(main, 3000);
  });
  customWsProvider._websocket.on("close", async (code) => {
    console.log(
      `Connection lost with code ${code}! Attempting reconnect in 3s...`
    );
    customWsProvider._websocket.terminate();
    setTimeout(main, 3000);
  });
};
*/


main();