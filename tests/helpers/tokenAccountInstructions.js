const { PublicKey, TransactionInstruction, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair } = require('@solana/web3.js');
const SPLToken = require("@solana/spl-token");
const { TOKEN_PROGRAM_ID } = SPLToken;

const ASSOCIATED_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');



exports.createAssociatedTokenAccountInstruction = (
    mint,
    associatedAccount,
    owner,
    payer,
  ) => {
    const data = Buffer.alloc(0);
    let keys = [
      {pubkey: payer, isSigner: true, isWritable: true},
      {pubkey: associatedAccount, isSigner: false, isWritable: true},
      {pubkey: owner, isSigner: false, isWritable: false},
      {pubkey: mint, isSigner: false, isWritable: false},
      {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
      {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
      {pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false},
    ];
    return new TransactionInstruction({
        keys,
        programId: ASSOCIATED_PROGRAM_ID,
        data,
    });
}