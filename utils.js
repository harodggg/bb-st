import mempoolJS from "@mempool/mempool.js"

export function satsTobtc(num) { 
    return  num / Math.pow(10,8)
}

export async function transactionPSBT(txHex) {
    const { bitcoin: { transactions } } = mempoolJS({
        hostname: 'mempool.space'
    });
    const txid = await transactions.postTx({ txHex });
    console.log(txid);
}

export function toXOnly(pubkey) {
    return pubkey.subarray(1, 33)
}



