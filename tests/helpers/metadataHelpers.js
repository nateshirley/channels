const { PublicKey} = require('@solana/web3.js');


const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
exports.TOKEN_METADATA_PROGRAM_ID = TOKEN_METADATA_PROGRAM_ID;

const getMetadataAddress = async (mintPubkey) => {
    return await PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintPubkey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
    );
}
exports.getMetadataAddress = getMetadataAddress;