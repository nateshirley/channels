import { Provider, utils } from '@project-serum/anchor';
import { PublicKey, SystemProgram, Connection, AccountInfo } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { decodeMetadata } from "./decodeMetadata";
import { CHANNEL_PROGRAM_ID, TOKEN_METADATA_PROGRAM_ID, getMetadataAddress, toDisplayString } from './utils'
import * as BufferLayout from "@solana/buffer-layout";



const publicKey = (property: string) => {
    return BufferLayout.blob(32, property);
};
const AttributionLayoutFromSubscription = BufferLayout.struct([
    BufferLayout.seq(BufferLayout.u8(), 8, "discriminator"),
    publicKey("creator"),
    publicKey("subscription"),
    BufferLayout.blob(4, "string setup"),
    BufferLayout.seq(BufferLayout.u8(), 16, "name"),
]);
const AttributionLayoutFromName = BufferLayout.struct([
    BufferLayout.seq(BufferLayout.u8(), 8, "discriminator"),
    publicKey("creator"),
    publicKey("subscription"),
]);
export const getDecodedAttributionFromName = async (
    attributionAddress: PublicKey,
    connection: Connection
) => {
    let rawAttribution = await connection.getAccountInfo(attributionAddress);
    if (rawAttribution) {
        return decodeAttributionFromName(rawAttribution.data);
    }
};
export const decodeAttributionFromName = (rawAttributionData: Buffer) => {
    let decodedAttribution = AttributionLayoutFromName.decode(
        rawAttributionData
    );
    return {
        creator: new PublicKey(decodedAttribution.creator),
        subscriptionMint: new PublicKey(decodedAttribution.subscription),
    };
}
export const getDecodedAttributionFromSubscription = async (
    attributionAddress: PublicKey,
    connection: Connection
) => {
    let rawAttribution = await connection.getAccountInfo(attributionAddress);
    if (rawAttribution) {
        return decodeAttributionFromSubscription(rawAttribution.data);
    }
};
export const decodeAttributionFromSubscription = (rawAttributionData: Buffer) => {
    let decodedAttribution = AttributionLayoutFromSubscription.decode(
        rawAttributionData
    );
    let nameChars = new Uint8Array(decodedAttribution.name);
    while (nameChars[nameChars.length - 1] === 0) {
        nameChars = nameChars.slice(0, -1);
    }
    let name = new TextDecoder("utf-8").decode(
        new Uint8Array(nameChars)
    );
    return {
        creator: new PublicKey(decodedAttribution.creator),
        subscriptionMint: new PublicKey(decodedAttribution.subscription),
        name: name
    };
}


export interface ChannelAttribution {
    creator: PublicKey,
    subscriptionMint: PublicKey
}
export interface ChannelAttributionWithName {
    creator: PublicKey,
    subscriptionMint: PublicKey,
    name: string
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
                dataSize: 92
            },
            {
                memcmp:
                {
                    bytes: walletAddress.toBase58(),
                    offset: 8
                }
            },
        ]
    }
    let responses = await connection.getProgramAccounts(
        CHANNEL_PROGRAM_ID,
        config
    );
    let decodedResponses = responses.map((response) => {
        return decodeAttributionFromSubscription(response.account.data);
    })
    return decodedResponses;
}

export const getAttributionAddressBySubscription = async (mint: PublicKey) => {
    return await PublicKey.findProgramAddress(
        [
            utils.bytes.utf8.encode("subscription"),
            mint.toBuffer(),
        ],
        CHANNEL_PROGRAM_ID
    );
}
export const getAttributionAddressByName = async (name: string) => {
    return await PublicKey.findProgramAddress(
        [utils.bytes.utf8.encode("name"),
        utils.bytes.utf8.encode(name.toLowerCase())],
        CHANNEL_PROGRAM_ID
    );
}

//need to take a search string and say if it's a channel or a subscription
export const fetchChannelAttributionBySubscription = async (tokenMint: PublicKey, connection: Connection) => {
    let [attributionAddress, _bump] = await getAttributionAddressBySubscription(tokenMint);
    return getDecodedAttributionFromSubscription(attributionAddress, connection);
}
export const fetchChannelAttributionByName = async (name: string, connection: Connection) => {
    let [attributionAddress, _bump] = await getAttributionAddressByName(name);
    return getDecodedAttributionFromName(attributionAddress, connection);
}

const getTokenAccountsForWallet = async (walletKey: PublicKey, connection: Connection) => {
    let tokenAccountResponses = await connection.getTokenAccountsByOwner(walletKey, {
        programId: TOKEN_PROGRAM_ID
    });
    return tokenAccountResponses.value
}


export const fetchSubscriptionsForWallet = async (walletKey: PublicKey, connection: Connection) => {
    let tokenAccountResponses = await getTokenAccountsForWallet(walletKey, connection);
    let walletSubscriptions: ChannelAttributionWithName[] = [];
    var promises: Promise<void>[] = [];
    tokenAccountResponses.forEach((tokenAccountResponse) => {
        let mint = new PublicKey(tokenAccountResponse.account.data.slice(0, 32));
        promises.push(getAttributionAddressBySubscription(mint).then(result => getDecodedAttributionFromSubscription(result[0], connection).then((attribution) => {
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
export const fetchChannelOverview = async (subscriptionMint: PublicKey, connection: Connection) => {
    let accountData: any = (await connection.getParsedAccountInfo(subscriptionMint)).value?.data;
    if (accountData) {
        let parsedAccountInfo = accountData.parsed.info;
        const [metadataAddress, _bump] = await getMetadataAddress(subscriptionMint);
        const accountInfo = await connection.getAccountInfo(metadataAddress);
        if (accountInfo && isMetadataV1Account(accountInfo)) {
            const metadata = decodeMetadata(accountInfo.data);
            let overview: ChannelOverview = {
                name: metadata.data.name,
                symbol: metadata.data.symbol,
                subscriberCount: parsedAccountInfo.supply,
                subscriberMintDisplayString: toDisplayString(subscriptionMint),
                uri: metadata.data.uri
            }
            return overview
        }
    }
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
