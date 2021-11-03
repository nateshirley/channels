import { Provider, Program, utils } from '@project-serum/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { CHANNEL_PROGRAM_ID, createAssociatedTokenAccountInstruction } from './utils'
import idl from '../idl.json';


export const subscribeToChannel = async (subscriptionMint: PublicKey, provider: Provider) => {
    const subscriber = provider.wallet.publicKey;
    const program = new Program(idl as any, CHANNEL_PROGRAM_ID, provider);

    let subscriberTokenAccount = await getAssociatedTokenAccountAddress(
        subscriber,
        subscriptionMint
    );
    let [_mintAuth, _mintAuthBump] = await PublicKey.findProgramAddress(
        [utils.bytes.utf8.encode("authority")],
        program.programId
    );
    console.log(_mintAuth.toBase58(), _mintAuthBump)
    const subscribe: any = program.rpc.subscribe;
    return await subscribe(_mintAuthBump, {
        accounts: {
            subscriber: subscriber,
            subscriberTokenAccount: subscriberTokenAccount,
            subscriptionMint: subscriptionMint,
            mintAuth: _mintAuth,
            tokenProgram: TOKEN_PROGRAM_ID,
        },
        instructions: [
            //create associated token account for the subscriber
            createAssociatedTokenAccountInstruction(
                subscriptionMint,
                subscriberTokenAccount,
                subscriber,
                subscriber
            ),
        ],
    });
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