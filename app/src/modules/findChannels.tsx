import { Provider, utils } from '@project-serum/anchor';
import { PublicKey, SystemProgram, Connection, AccountInfo } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { decodeMetadata } from "./decodeMetadata";
import { CHANNEL_PROGRAM_ID, TOKEN_METADATA_PROGRAM_ID, getMetadataAddress } from './utils'
import * as BufferLayout from "@solana/buffer-layout";



const publicKey = (property: string) => {
    return BufferLayout.blob(32, property);
};
export const ChannelAttributionLayout = BufferLayout.struct([
    BufferLayout.seq(BufferLayout.u8(), 8, "discriminator"),
    publicKey("creator"),
    publicKey("subscription"),
    BufferLayout.blob(1, "fromName"),
]);
export const getDecodedAttribution = async (
    attributionAddress: PublicKey,
    connection: Connection
) => {
    let rawAttribution = await connection.getAccountInfo(attributionAddress);
    if (rawAttribution) {
        return decodeAttribution(rawAttribution.data);
    }
};
export const decodeAttribution = (rawAttributionData: Buffer) => {
    let decodedAttribution = ChannelAttributionLayout.decode(
        rawAttributionData
    );
    return {
        creator: new PublicKey(decodedAttribution.creator),
        subscriptionMint: new PublicKey(decodedAttribution.subscription),
    };
}

// export interface WalletSubscription {
//     mint: PublicKey,
//     tokenAccount: PublicKey,
//     attribution: ChannelAttribution
// }
export interface ChannelAttribution {
    creator: PublicKey,
    subscriptionMint: PublicKey
}
export interface ChannelOverview {
    name: string,
    symbol: string,
    subscriberCount: string,
    subscriberMintDisplayString: string,
    uri: string
}


export const fetchCreatedChannelsForWallet = async (walletAddress: PublicKey, connection: Connection) => {
    let config = {
        filters: [
            {
                dataSize: 73
            },
            {
                memcmp:
                {
                    bytes: walletAddress.toBase58(),
                    offset: 8
                }
            },
            {
                memcmp:
                {
                    bytes: "1",
                    offset: 72
                }
            },
        ]
    }
    let responses = await connection.getProgramAccounts(
        CHANNEL_PROGRAM_ID,
        config
    );
    let decodedResponses = responses.map((response) => {
        return decodeAttribution(response.account.data);
    })
    return decodedResponses;
}

export const getAttributionAddressByMint = async (mint: PublicKey) => {
    return await PublicKey.findProgramAddress(
        [
            utils.bytes.utf8.encode("channel"),
            mint.toBuffer(),
        ],
        CHANNEL_PROGRAM_ID
    );
}
export const getAttributionAddressByName = async (name: string) => {
    return await PublicKey.findProgramAddress(
        [utils.bytes.utf8.encode(name.toLowerCase())],
        CHANNEL_PROGRAM_ID
    );
}
//need to take a search string and say if it's a channel or a subscription
export const fetchChannelAttributionByMint = async (tokenMint: PublicKey, connection: Connection) => {
    let [attributionAddress, _bump] = await getAttributionAddressByMint(tokenMint);
    return getDecodedAttribution(attributionAddress, connection);
}
export const fetchChannelAttributionByName = async (name: string, connection: Connection) => {
    let [attributionAddress, _bump] = await getAttributionAddressByName(name);
    return getDecodedAttribution(attributionAddress, connection);
}

const getTokenAccountsForWallet = async (walletKey: PublicKey, connection: Connection) => {
    let tokenAccountResponses = await connection.getTokenAccountsByOwner(walletKey, {
        programId: TOKEN_PROGRAM_ID
    });
    return tokenAccountResponses.value
}


export const fetchSubscriptionsForWallet = async (walletKey: PublicKey, connection: Connection) => {
    let tokenAccountResponses = await getTokenAccountsForWallet(walletKey, connection);
    let walletSubscriptions: ChannelAttribution[] = [];
    var promises: Promise<void>[] = [];
    tokenAccountResponses.forEach((tokenAccountResponse) => {
        let mint = new PublicKey(tokenAccountResponse.account.data.slice(0, 32));
        promises.push(getAttributionAddressByMint(mint).then(result => getDecodedAttribution(result[0], connection).then((attribution) => {
            if (attribution) {
                walletSubscriptions.push(attribution);
            }
        })));
    });
    await Promise.all(promises)
    return walletSubscriptions
}


export const isMetadataV1Account = (accountInfo: AccountInfo<Buffer>) => {
    return accountInfo.owner.equals(TOKEN_METADATA_PROGRAM_ID) && accountInfo.data[0] === 4;
}
/* parsed struct
decimals: 0
freezeAuthority: null
isInitialized: true
mintAuthority: null
supply: "1"
*/
export const fetchChannelOverview = async (subscriberMint: PublicKey, connection: Connection) => {
    let accountData: any = (await connection.getParsedAccountInfo(subscriberMint)).value?.data;
    if (accountData) {
        let parsedAccountInfo = accountData.parsed.info;
        const [metadataAddress, _bump] = await getMetadataAddress(subscriberMint);
        const accountInfo = await connection.getAccountInfo(metadataAddress);
        if (accountInfo && isMetadataV1Account(accountInfo)) {
            const metadata = decodeMetadata(accountInfo.data);
            let overview: ChannelOverview = {
                name: metadata.data.name,
                symbol: metadata.data.symbol,
                subscriberCount: parsedAccountInfo.supply,
                subscriberMintDisplayString: toDisplayString(subscriberMint),
                uri: metadata.data.uri
            }
            return overview
        }
    }
}
export const toDisplayString = (publicKey: PublicKey, sliceLength: number = 4) => {
    let b58 = publicKey.toBase58();
    return (b58.slice(0, sliceLength) + "..." + b58.slice(b58.length - sliceLength, b58.length));
}

export const fetchDataObjectAtUri = async (uri: string): Promise<any | undefined> => {
    try {
        let response = await fetch(uri);
        let data = await response.json();
        return data
    } catch (ex) {
        console.error(ex);
    }
    console.log("waiting")
}
