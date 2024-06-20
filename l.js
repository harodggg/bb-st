var bitcoin = require('bitcoinjs-lib')

var testnet = bitcoin.networks.testnet;
var bitcoin = require('bitcoinjs-lib')
var privateKey = ''
var keyPair = bitcoin.ECPair.fromWIF(privateKey, testnet);
const RawTransaction = new bitcoin.Psbt(testnet)
RawTransaction.addInput({ hash: '', index: 0 })
RawTransaction.addOutput({ address: '', value: 0.00001 })


RawTransaction.sign(0, keyPair)

var Transaction = RawTransaction.build().toHex();
console.log(Transaction)