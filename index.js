import { BIP32Factory }  from 'bip32'

import mempoolJS from "@mempool/mempool.js"
import { satsTobtc, transactionPSBT } from "./utils.js"
import { ECPairFactory } from 'ecpair'
import * as ecc from 'tiny-secp256k1'
import * as bitcoin from 'bitcoinjs-lib'
import bip39 from 'bip39'
import { sendTx } from './testbtcore.js'




const ECPair = ECPairFactory(ecc)

const SIGNET = bitcoin.networks.testnet
const bip32 = BIP32Factory(ecc)
bitcoin.initEccLib(ecc);



const main = async () => {

    let mn = ""


 

    let prv = ""


    let keyPair = ECPair.fromWIF(prv,SIGNET)
  

    const path = `m/86'/1'/0'/0/0`

    const seed = await bip39.mnemonicToSeed(mn)
    const rootKey = bip32.fromSeed(seed,SIGNET)
    // console.log(rootKey)

    const childNode = rootKey.derivePath(path)
    // console.log(childNode.toBase58())
    console.log(childNode.toWIF())

    const childNodeXOnlyPubkey = childNode.publicKey.subarray(1,33)

    // const { address, output } = bitcoin.payments.p2tr({
    //     pubkey: childNodeXOnlyPubkey,
    //     network: SIGNET
    // });

    // console.log({address})
    // console.log(output)

    const tweakedChildNode = childNode.tweak(
        bitcoin.crypto.taggedHash('TapTweak', childNodeXOnlyPubkey),
    );

    const { address, output } = bitcoin.payments.p2tr({
        pubkey: tweakedChildNode.publicKey.subarray(1,33),
        network: SIGNET
    });

    console.log({ address })
    console.log(output)

    
    // console.log(keyPair.publicKey.toString('hex'))
    // console.log(keyPair.privateKey)
    
    // console.log(keyPair)
    // console.log("prist")
    // console.log(keyPair.privateKey.toString('hex'))
    // console.log("pk.tob")



    const { bitcoin: { addresses, transactions } } = mempoolJS({
        hostname: 'mempool.space',
        network: 'signet'
    });

    console.log(await addresses.getAddressTxsUtxo({ address }))
    const {txid: hash, vout: index, value: amount } = (await addresses.getAddressTxsUtxo({ address }))[0]
    console.log((await addresses.getAddressTxsUtxo({ address }))[0])


    let sendAmount = 1e5
    let feeAmount = 2e4
    console.log(hash)
    console.log(index)
    console.log(amount)
    const psbt = new bitcoin.Psbt({ network: SIGNET })
        .addInput({
            hash,
            index,
            witnessUtxo: { value: amount, script: output },
            tapInternalKey: childNodeXOnlyPubkey,
        })
        .addOutput({
            value: sendAmount,
            address: "",
        })
        .addOutput({
            value: amount - sendAmount - feeAmount,
            address: ""
        })
        .signInput(0, tweakedChildNode).finalizeAllInputs()
    
 

    const txHex = psbt.extractTransaction().toHex();
  

    const txid = await sendTx(txHex)

    console.log(txid)

    
    // let txHex = ""
    // const txid = await transactions.postTx({ txHex });
    // console.log(txid);
    // const { address } = bitcoin.payments.p2wsh({ pubkey: keyPair.publicKey.subarray(1,33), network: SIGNET })
    
    // console.log(address)

    
    // const addressTxsUtxo = await addresses.getAddressTxsUtxo({ address: "tb1pdj6drgzfcz3a459q29k8d6ceurx736pvy70syqapqfrdn2pwkats247w48" })

    // console.log(addressTxsUtxo)


    // const psbt = new bitcoin.Psbt( { network: SIGNET } );





    // let input = { 
    //    hash: addressTxsUtxo[0].txid,
    //    index: 0,
    //    witnessUtxo: {
    //      script: Buffer.from(
    //        '51203489e692489515a6d66f365789f83f9391b00905e8c13c905bd3a65fdccaf719',
    //        'hex',
    //      ),
    //        value: 100000,
    //    },
   
      
    // } 

    // let output = { 
    //     address: "mpkKnRezMPTWh34bXYhNRm9uQcdp8Q6jUA",
    //     value: 0.000001
    // }

    // let output2 = { 
    //     address: address,
    //     value: 100
    // }

//     psbt.addInput(input)

//     psbt.addOutput(output)
//   //  psbt.addOutput(output2)

//     psbt.signInput(0,keyPair)


//     console.log(psbt.toBase64());
//     psbt.finalizeAllInputs();
//     console.log(psbt.toBase64());
    // const txHex = '0200000001fd5b5fcd1cb066c27cfc9fda5428b9be850b81ac440ea51f1ddba2f987189ac1010000008a4730440220686a40e9d2dbffeab4ca1ff66341d06a17806767f12a1fc4f55740a7af24c6b5022049dd3c9a85ac6c51fecd5f4baff7782a518781bbdd94453c8383755e24ba755c01410436d554adf4a3eb03a317c77aa4020a7bba62999df633bba0ea8f83f48b9e01b0861d3b3c796840f982ee6b14c3c4b7ad04fcfcc3774f81bff9aaf52a15751fedfdffffff02416c00000000000017a914bc791b2afdfe1e1b5650864a9297b20d74c61f4787d71d0000000000001976a9140a59837ccd4df25adc31cdad39be6a8d97557ed688ac00000000';

    // const txid = await transactions.postTx({ txhex: txHex });
    // console.log(txid);

};

main();