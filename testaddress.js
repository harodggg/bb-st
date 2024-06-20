import mempoolJS from "@mempool/mempool.js"
import { satsTobtc } from "./utils.js"
import { ECPairFactory } from 'ecpair'
import * as ecc from 'tiny-secp256k1'
import * as bitcoin from 'bitcoinjs-lib'
import bip39 from 'bip39'
import bip32 from 'bip32'


const test = async () => { 
    console.log("start")
    const mnemonic = bip39.generateMnemonic()


    console.log(mnemonic)

    const seed = bip39.mnemonicToSeedSync(mnemonic)
    console.log(seed)

  //  const root = bip32.fromSeed(seed);
    var hdWallet = hdkey.fromMasterSeed(seed)
    console.log(hdWallet)

    var key1 = hdWallet.derivePath("m/44'/60'/0'/0/0")
    console.log(key1)

    Buffer.from("ll")
}

test()