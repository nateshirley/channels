import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  Connection,
  Commitment,
  clusterApiUrl,
} from "@solana/web3.js";
import { Provider } from "@project-serum/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
export const CHANNEL_MINT_AUTH = new PublicKey(
  "6Hugr12bLkn62Yn732ej6PNrkFuvgVTdiQh4gp2g2NMp"
);
export const CHANNEL_PROGRAM_ID = new PublicKey(
  "B289W9c9eYntT2hpX4e3bE1F6tib2kfffvov7pPZ8w2Q"
);
export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);
export const toDisplayString = (
  publicKey: PublicKey,
  sliceLength: number = 4
) => {
  let b58 = publicKey.toBase58();
  return (
    b58.slice(0, sliceLength) +
    "..." +
    b58.slice(b58.length - sliceLength, b58.length)
  );
};

export const getProvider = (withWallet: WalletContextState) => {
  const commitment: Commitment = "processed";
  let confirmOptions = { preflightCommitment: commitment };
  let wallet: any = withWallet;
  const provider = new Provider(getConnection(), wallet, confirmOptions);
  return provider;
};

export const getAirdropProvider = (withWallet: WalletContextState) => {
  const commitment: Commitment = "processed";
  let confirmOptions = { preflightCommitment: commitment };
  let wallet: any = withWallet;
  const provider = new Provider(getAirdropConnection(), wallet, confirmOptions);
  return provider;
};

export const getAirdropConnection = () => {
  const network = clusterApiUrl("devnet");
  const commitment: Commitment = "processed";
  return new Connection(network, commitment);
};

export const getConnection = () => {
  const network =
    "https://lingering-lingering-mountain.solana-devnet.quiknode.pro/fbbd36836095686bd9f580212e675aaab88204c9/"; //clusterApiUrl('devnet');
  const commitment: Commitment = "processed";
  return new Connection(network, commitment);
};

export const getMetadataAddress = async (mint: PublicKey) => {
  return await PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
};

export const createAssociatedTokenAccountInstruction = (
  mint: PublicKey,
  associatedAccount: PublicKey,
  owner: PublicKey,
  payer: PublicKey
) => {
  const data = Buffer.alloc(0);
  let keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: associatedAccount, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: false, isWritable: false },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    keys,
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data,
  });
};
