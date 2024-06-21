import { networks } from "bitcoinjs-lib";
import { BIP32Factory } from 'bip32'

import mempoolJS from "@mempool/mempool.js"
import { satsTobtc, transactionPSBT } from "./utils.js"
import { ECPairFactory } from 'ecpair'
import * as ecc from 'tiny-secp256k1'
import * as bitcoin from 'bitcoinjs-lib'
import bip39 from 'bip39'
import { sendTx } from './testbtcore.js'
import { StakingScriptData } from "btc-staking-ts";
import { stakingTransaction } from "btc-staking-ts";
import { Psbt, Transaction } from "bitcoinjs-lib";





const ECPair = ECPairFactory(ecc)

const SIGNET = bitcoin.networks.testnet
const bip32 = BIP32Factory(ecc)
bitcoin.initEccLib(ecc);

const covenant_pks = [
    "03fa9d882d45f4060bdb8042183828cd87544f1ea997380e586cab77d5fd698737",
    "020aee0509b16db71c999238a4827db945526859b13c95487ab46725357c9a9f25",
    "0217921cf156ccb4e73d428f996ed11b245313e37e27c978ac4d2cc21eca4672e4",
    "02113c3a32a9d320b72190a04a020a0db3976ef36972673258e9a38a364f3dc3b0",
    "0379a71ffd71c503ef2e2f91bccfc8fcda7946f4653cef0d9f3dde20795ef3b9f0",
    "023bb93dfc8b61887d771f3630e9a63e97cbafcfcc78556a474df83a31a0ef899c",
    "03d21faf78c6751a0d38e6bd8028b907ff07e9a869a43fc837d6b3f8dff6119a36",
    "0340afaf47c4ffa56de86410d8e47baa2bb6f04b604f4ea24323737ddc3fe092df",
    "03f5199efae3f28bb82476163a7e458c7ad445d9bffb0682d10d3bdb2cb41f8e8e"
]

const covenantPks = covenant_pks.map((pk) => Buffer.from(pk, "hex").subarray(1,33));

// console.log("covenant_pks: " + covenantPks.map((pk) => pk.length + "\n") )
const covenantThreshold = 6;
const minUnbondingTime = 101;
const magicBytes = Buffer.from("62627434", "hex"); // "bbt4" tag
// Optional field. Value coming from current global param activationHeight
const lockHeight = 0;

// 2. Define the user selected parameters of the staking contract:
//    - `stakerPk: Buffer`: The public key without the coordinate of the
//       staker.
//    - `finalityProviders: Buffer[]`: A list of public keys without the
//       coordinate corresponding to the finality providers. Currently,
//       a delegation to only a single finality provider is allowed,
//       so the list should contain only a single item.
//    - `stakingDuration: number`: The staking period in BTC blocks.
//    - `stakingAmount: number`: The amount to be staked in satoshis.
//    - `unbondingTime: number`: The unbonding time. Should be `>=` the
//      `minUnbondingTime`.
let mn = ""
const path = `m/86'/1'/0'/0/0`

const seed = await bip39.mnemonicToSeed(mn)
const rootKey = bip32.fromSeed(seed, SIGNET)

const childNode = rootKey.derivePath(path)
console.log("prv:  " + childNode.toWIF())

const childNodeXOnlyPubkey = childNode.publicKey.subarray(1, 33)

const tweakedChildNode = childNode.tweak(
    bitcoin.crypto.taggedHash('TapTweak', childNodeXOnlyPubkey),
);

console.log("publicKey: " + tweakedChildNode.publicKey.toString('hex') + " length: " + tweakedChildNode.publicKey.length)
console.log("publicKeynocoord: " + tweakedChildNode.publicKey.toString('hex') + " length: " + tweakedChildNode.publicKey.subarray(1, 33).length)

const { address, output } = bitcoin.payments.p2tr({
    pubkey: tweakedChildNode.publicKey.subarray(1, 33),
    network: SIGNET
});


const stakerPk = tweakedChildNode.publicKey.subarray(1, 33)

const finalityProviders  = [
    Buffer.from("f4940b238dcd00535fde9730345bab6ff4ea6d413cc3602c4033c10f251c7e81", "hex"),
];
const stakingDuration = 144;
const stakingAmount = 50_000;
const unbondingTime = minUnbondingTime;

// 3. Define the parameters for the staking transaction that will contain the
//    staking contract:
//    - `inputUTXOs: UTXO[]`: The list of UTXOs that will be used as an input
//       to fund the staking transaction.
//    - `feeRate: number`: The fee per tx byte in satoshis.
//    - `changeAddress: string`: BTC wallet change address, Taproot or Native
//       Segwit.
//    - `network: network to work with, either networks.testnet
//       for BTC Testnet and BTC Signet, or networks.bitcoin for BTC Mainnet.

// Each object in the inputUTXOs array represents a single UTXO with the following properties:
// - txid: transaction ID, string
// - vout: output index, number
// - value: value of the UTXO, in satoshis, number
// - scriptPubKey: script which provides the conditions that must be fulfilled for this UTXO to be spent, string

const { bitcoin: { addresses, transactions } } = mempoolJS({
    hostname: 'mempool.space',
    network: 'signet'
});


const { txid: hash, vout: index, value: amount } = (await addresses.getAddressTxsUtxo({ address }))[0]
// console.log((await addresses.getAddressTxsUtxo({ address }))[0])


let sendAmount = 1e5
let feeAmount = 3e4
console.log("txid: " + hash)
console.log("index: " + index)
console.log("amount: " + amount)

const inputUTXOs = [
    {
        txid: hash,
        vout: index,
        value: amount,
        scriptPubKey: output,
    },
];

const feeRate = 100;
const changeAddress = address;
const network = networks.testnet;

console.log("address: " + changeAddress)

const stakingScriptData = new StakingScriptData(
    stakerPk,
    finalityProviders,
    covenantPks,
    covenantThreshold,
    stakingDuration,
    minUnbondingTime,
    magicBytes,
)

const {
    timelockScript,
    unbondingScript,
    slashingScript,
    dataEmbedScript,
    unbondingTimelockScript,
} = stakingScriptData.buildScripts()

const scripts = {
    timelockScript,
    unbondingScript,
    slashingScript,
    dataEmbedScript,
    unbondingTimelockScript,
}

const unsignedStakingPsbt = stakingTransaction(
    scripts,
    stakingAmount,
    changeAddress,
    inputUTXOs,
    SIGNET,
    feeRate,
    stakerPk,
    lockHeight,
);



const signPsbt = unsignedStakingPsbt.psbt.signInput(0, tweakedChildNode).finalizeAllInputs()
const txHex = signPsbt.extractTransaction().toHex()
console.log(txHex)

const main = async() => { 
    const txid = await sendTx(txHex)

    console.log(txid)

}

main()
