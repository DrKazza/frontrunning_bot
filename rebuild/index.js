
require("dotenv").config();
const Web3 = require('web3');
const url = process.env.INFURAURL;
const web3 = new Web3(url);
var subscription;

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

const handleTransaction = async (transaction) =>{
    console.log(`Transaction: ${transaction}`)
    console.log(`**********************`)
    let data = parseTx(transaction['input'])
    console.log(`Method: ${data[0]}`)
    console.log(`Params: ${data[1]}`)
}

const main = async () => {
    console.log(`CP1`)
    subscription = web3.eth.subscribe('pendingTransactions', function (error, result){
    }).on("data", async function (transactionHash) {
        console.log(`CP2`)
        let transaction = await web3.eth.getTransaction(transactionHash);
        await handleTransaction(transaction);
    })
};


/*
DIFF VERSION:

var ethers = require("ethers");
var url = "ADD_YOUR_ETHEREUM_NODE_WSS_URL";

var init = function () {
  var customWsProvider = new ethers.providers.WebSocketProvider(url);
  
  customWsProvider.on("pending", (tx) => {
    customWsProvider.getTransaction(tx).then(function (transaction) {
      console.log(transaction);
    });
  });

  customWsProvider._websocket.on("error", async () => {
    console.log(`Unable to connect to ${ep.subdomain} retrying in 3s...`);
    setTimeout(init, 3000);
  });
  customWsProvider._websocket.on("close", async (code) => {
    console.log(
      `Connection lost with code ${code}! Attempting reconnect in 3s...`
    );
    customWsProvider._websocket.terminate();
    setTimeout(init, 3000);
  });
};

*/


main();