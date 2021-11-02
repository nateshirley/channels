import { Provider, utils } from '@project-serum/anchor';
import { PublicKey, SystemProgram, Connection } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as BufferLayout from "@solana/buffer-layout"
export const CHANNEL_PROGRAM_ID = new PublicKey("WczqDK2L6bHkQVwrZuSmKFyUvgVTHtgE4zsGfQ1wmfi")

export const getAttributionAddress = async (publicKey: PublicKey) => {
    return await PublicKey.findProgramAddress(
        [
            utils.bytes.utf8.encode("channel"),
            publicKey.toBuffer(),
        ],
        CHANNEL_PROGRAM_ID
    );
}

const publicKey = (property: string) => {
    return BufferLayout.blob(32, property);
};
export const AttributionLayout = BufferLayout.struct([
    BufferLayout.seq(BufferLayout.u8(), 8, "discriminator"),
    publicKey("creator"),
    publicKey("subscription"),
]);

interface Channel {
    creator: PublicKey,
    subscription: PublicKey
}

//need to take a search string and say if it's a channel or a subscription
export const getChannelAttribtion = async (tokenMintKey: PublicKey, connection: Connection): Promise<[string, Channel] | undefined> => {
    let [attributionAddress, _bump] = await getAttributionAddress(tokenMintKey);
    let rawAttribution = await connection.getAccountInfo(
        attributionAddress
    );
    if (rawAttribution) {
        let decoded = AttributionLayout.decode(
            rawAttribution.data
        );
        let attribution: Channel = {
            creator: new PublicKey(decoded.creator),
            subscription: new PublicKey(decoded.subscription)
        }
        if (tokenMintKey.equals(attribution.subscription)) {
            return ["subscription", attribution];
        } else {
            return ["creator", attribution];
        }
    }
}