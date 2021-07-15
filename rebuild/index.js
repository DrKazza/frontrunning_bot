
require("dotenv").config();
const Web3 = require('web3');
const url = process.env.INFURAURL;
const wss = process.env.INFURAWS;
const web3 = new Web3(new Web3.providers.HttpProvider(url));
const web3WS = new Web3(new Web3.providers.WebsocketProvider(wss));
var subscription;

const UNISWAP_V3_ROUTER = '0xe592427a0aece92de3edee1f18e0157c05861564';
const UNISWAP_V2_ROUTER = '0x7a250d5630b4cf539739df2c5dacb4c659f2488d';
const FRONTRUNNER_1 = '0x0000001ea7022cd5d3666beb277c9dc323adc3d9';

const GAS_INCREMENT = 2; // in GWEI - this will be multiplied by 1e9
const MAX_GAS_PRICE = 55 * (10 ** 9); // in WEI

//Trade methods:
//  0x414bf389   Uniswap v3  exactInputSingle (tokenIn, tokenOut, recipient, deadline, amountIn, amountOutMinimum, sqrtPriceLimitX96)
//  0xbd3e2198   Uniswap v3  exactOutputSingle (tokenIn, tokenOut, recipient, deadline, amountOut, amountInMaximum, sqrtPriceLimitX96)
//  0xac9650d8   Uniswap v3  multicall
    // from ETH to Token   ->  exactInputSingle/exactOutputSingle + refundETH - used 130k, limit 180k
    // from Token to ETH   ->  exactInputSingle/exactOutputSingle + unwrapWETH - used 125k, limit 190k
    // from Token to Token ->  selfPermit + exactInput - used 220k, limit 315k
    // from Token to Token ->  selfPermitAllowed + exactInput - used 240k, limit 330k
    // from Token to Token ->  selfPermit + exactOutput - used 270k, limit 330k
//  0x12210e8a   Uniswap v3  refundETH - no arguments
//  0x49404b7c   Uniswap v3  unwrapWETH9 (amountMinimum, recipient)
//  0xf3995c67   Uniswap v3  selfPermit (token, value, dealine, v, ???, ???)
    // selfPermit refers to the floating (non-exact) amount
//  0x4659a494   Uniswap v3  selfPermitAllowed (token, nonce, expiry, v, ???, ???)
//  0xc04b8d59   Uniswap v3  exactInput (path, recipient, deadline, amountIn, amountOutMinimum) - multi ccy change

//  Swap Exact Eth for Tokens   Uniswap v2
//  Swap Eth for Exact Tokens   Uniswap v2


// 2) find out what the dividers are in PATH
// 3) parse the data correctly for a multicall function
// 4) look through previous transactions for non listed methods here 


// Parse Tx
// take the header and check if it's a multicall
// if not then process as normal
// if it is then process as multicall

const parseTx = (input) => {
console.log(`input: ${input}`)
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
  if (transaction == null) {
//    console.log(`Null transaction`)  
    return
  } else {
    if ((transaction['to'] == UNISWAP_V2_ROUTER || transaction['to'] == UNISWAP_V3_ROUTER) && await isPending(transaction['hash'])) {
        console.log(`Found a Uniswap Pending transaction`)
    } else {
      return
    }
    console.log(`Transaction['hash']: ${transaction['hash']}`)
    let data = parseTx(transaction['input'])
    console.log(`Method: ${data[0]}`)
    console.log(`Params: ${data[1]}\n`)
    let gasPrice = parseInt(transaction['gasPrice']);
    let newGasPrice = gasPrice + (GAS_INCREMENT * 10 ** 9)
    if (newGasPrice > MAX_GAS_PRICE) {
      console.log(`Gas Price too High`)
      return
    } 

    // trigger frontrun
    // are they the right currencies?
    // is the size correct?
    // is the gas going to fail the original trade? 
    // Send a purchase with new gas
    // send a sale with the old gas - 1 (subject to a floor)


  }
}


const main = async () => {
    subscription = web3WS.eth.subscribe('pendingTransactions', function (error, result){
    }).on("data", async function (transactionHash) {
        let transaction = await web3.eth.getTransaction(transactionHash);
        handleTransaction(transaction);
    })
};


main();







const parseTxWithMulticall = (input) => {
  if (input == '0x') {
      return ['0x', []]
  }
  if ((input.length - 8 - 2) % 64 != 0) {
      throw "Data size misaligned with parse request."
  }
  let method = input.substring(0, 10);
  switch (method) {
    case '0xac9650d8':
      // handle multicall
      break;
    case '0x414bf389':
      // Uniswap 3 exactInputSingle (tokenIn, tokenOut, recipient, deadline, amountIn, amountOutMinimum, sqrtPriceLimitX96)
      break;
    case '0xbd3e2198':
      // Uniswap 3 exactOutputSingle (tokenIn, tokenOut, recipient, deadline, amountOut, amountInMaximum, sqrtPriceLimitX96)
      break;
    case '0xc04b8d59':
      // multihop
      // Uniswap v3  exactInput (path, recipient, deadline, amountIn, amountOutMinimum)
      break;
    case '0xf28c0498':
      // multihop
      // Uniswap v3  exactOutput (path, recipient, deadline, amountOut, amountInMaximum)
      break;
    case '0x7ff36ab5':
      // Uniswap v2 swapExactETHForTokens (amountOutMin, [path], to, deadline)
      break;
    case '0xfb3bdb41':
      // Uniswap v2 swapETHForExactTokens (amountOut, [path], to, deadline)
      break;
    
    // swapExactTokensForETH??
    // swapTokensForExactETH??
    // swapExactTokensForTokens??
    // swapTokensForExactTokens??



    default:
      // some other method...

  }

}

















/*
DIFF VERSION OF QUERYING THE PENDING TRANSACTIONS:
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
