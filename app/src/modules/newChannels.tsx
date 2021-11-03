/* eslint-disable @typescript-eslint/no-unused-vars */
import { PublicKey, SystemProgram, Keypair, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { Program, utils as anchorUtils, Provider } from '@project-serum/anchor';
import { Token, TOKEN_PROGRAM_ID, MintLayout } from '@solana/spl-token';
import { CHANNEL_PROGRAM_ID, TOKEN_METADATA_PROGRAM_ID, getMetadataAddress, createAssociatedTokenAccountInstruction } from './utils'
import idl from '../idl.json';

export const createChannelFromProgram = async (name: string, symbol: string, provider: Provider) => {

    const defaultUri = "https://nateshirley.github.io/data/channels-default.json";
    const creation = Keypair.generate();
    const subscription = Keypair.generate();
    const program = new Program(idl as any, CHANNEL_PROGRAM_ID, provider);
    const creator = provider.wallet.publicKey;

    let creationTokenAccount = await getAssociatedTokenAccountAddress(
        creator,
        creation.publicKey
    );
    let [_creationAttribution, _creationAttributionBump] =
        await PublicKey.findProgramAddress(
            [
                anchorUtils.bytes.utf8.encode("channel"),
                creation.publicKey.toBuffer(),
            ],
            program.programId
        );
    let [_subscriptionAttribution, _subscriptionAttributionBump] =
        await PublicKey.findProgramAddress(
            [
                anchorUtils.bytes.utf8.encode("channel"),
                subscription.publicKey.toBuffer(),
            ],
            program.programId
        );
    let [_mintAuth, _mintAuthBump] = await PublicKey.findProgramAddress(
        [anchorUtils.bytes.utf8.encode("authority")],
        program.programId
    );
    console.log(_mintAuth, _mintAuthBump);
    let [_nameAttribution, _nameAttributionBump] =
        await PublicKey.findProgramAddress(
            [
                anchorUtils.bytes.utf8.encode(name),
            ],
            program.programId
        );
    let [_creationMetadata, _creationMetadataBump] = await getMetadataAddress(creation.publicKey);
    let [_subscriptionMetadata, _subscriptionMetadataBump] = await getMetadataAddress(subscription.publicKey);

    const createChannel: any = program.rpc.createChannel;
    const tx = await createChannel(
        _creationAttributionBump,
        _subscriptionAttributionBump,
        _mintAuthBump,
        _nameAttributionBump,
        name,
        symbol,
        defaultUri,
        {
            accounts: {
                creator: creator,
                creationTokenAccount: creationTokenAccount,
                creationMint: creation.publicKey,
                creationAttribution: _creationAttribution,
                creationMetadata: _creationMetadata,
                subscriptionMint: subscription.publicKey,
                subscriptionAttribution: _subscriptionAttribution,
                subscriptionMetadata: _subscriptionMetadata,
                nameAttribution: _nameAttribution,
                mintAuth: _mintAuth,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
                rent: SYSVAR_RENT_PUBKEY,
            },
            instructions: [
                //create channel mint account
                SystemProgram.createAccount({
                    fromPubkey: creator,
                    newAccountPubkey: creation.publicKey,
                    space: MintLayout.span,
                    lamports:
                        await provider.connection.getMinimumBalanceForRentExemption(MintLayout.span),
                    programId: TOKEN_PROGRAM_ID,
                }),
                //init creation mint account
                Token.createInitMintInstruction(
                    TOKEN_PROGRAM_ID,
                    creation.publicKey,
                    0,
                    _mintAuth,
                    null
                ),
                //create subscription mint account
                SystemProgram.createAccount({
                    fromPubkey: creator,
                    newAccountPubkey: subscription.publicKey,
                    space: MintLayout.span,
                    lamports:
                        await provider.connection.getMinimumBalanceForRentExemption(MintLayout.span),
                    programId: TOKEN_PROGRAM_ID,
                }),
                //init subscription mint account
                Token.createInitMintInstruction(
                    TOKEN_PROGRAM_ID,
                    subscription.publicKey,
                    0,
                    _mintAuth,
                    null
                ),
                //create associated token account for the creation creator
                createAssociatedTokenAccountInstruction(
                    creation.publicKey,
                    creationTokenAccount,
                    creator,
                    creator
                ),
            ],
            signers: [creation, subscription],
        }
    );
    return tx
}

export const getAssociatedTokenAccountAddress = async (owner: PublicKey, mint: PublicKey) => {
    let associatedProgramId = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
    return (
        await PublicKey.findProgramAddress(
            [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
            associatedProgramId
        )
    )[0];
};