

import Client from 'bitcoin-core'


const client = new Client({
    network: 'testnet',
    username: 'root',
    password: 'root',
    port: 38332,
    host: "34.92.217.101",
  
});

export async function sendTx(txhex) {
    let txhash = await client.sendRawTransaction(txhex)
    return txhash 
}

const main = async () => { 
   let chaininfo  = await client.getBlockchainInfo()
   console.log(chaininfo)

   let txhex = "020000000001010d459571dc88ec47348c2ffb9fdb8f1183cacf96122f5fafb81ca9b0e3ffec1f0100000000ffffffff02a086010000000000225120ac1718d0d7a7f900bdd0000397a3bc4b414828941df3dc5fc94680bbde9e0de000d6830000000000225120d1da4f8f3d4069bb757ca066f67c213632811956921547885420d1a53959203a0140baf317de15049446bcfb0931a77eb5fae3d9337c3ac5380b5a60ebbad03d4c0bc3cdc46c11b08d281101e85d2a50149ba4194eed5b9c57c591e0549a149ad3e500000000"
   let txhash = await client.sendRawTransaction(txhex)
   console.log(txhash)

}

//main()