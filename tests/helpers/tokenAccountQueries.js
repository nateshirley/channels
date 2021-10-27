const web3 = require('@solana/web3.js');
const { PublicKey } = web3;
const { TOKEN_PROGRAM_ID, AccountLayout, u64 } = require("@solana/spl-token");
const { BN } = require('bn.js');

const getAllTokenAccounts = async (mintKey, connection) => {
    //https://solana-labs.github.io/solana-web3.js/modules.html#MemcmpFilter
    let config = {
        filters: [
            {
                dataSize: 165
            },
            {
                memcmp:
                {
                    bytes: mintKey.toBase58(),
                    offset: 0
                }
            },
        ]
    }
    //https://solana-labs.github.io/solana-web3.js/classes/Connection.html#getProgramAccounts
    let accounts = await connection.getProgramAccounts(
        TOKEN_PROGRAM_ID,
        config
    );
    return accounts;
}
exports.getAllTokenAccounts = getAllTokenAccounts;

const getTokenAccountInfo = async (publicKey, connection) => {
    const info = await connection.getAccountInfo(publicKey);
    if (info === null) {
        throw new Error(FAILED_TO_FIND_ACCOUNT);
    }
    if (!info.owner.equals(TOKEN_PROGRAM_ID)) {
        throw new Error("INVALID_ACCOUNT_OWNER");
    }
    if (info.data.length != AccountLayout.span) {
        throw new Error(`Invalid account size`);
    }
    const data = Buffer.from(info.data);
    const accountInfo = AccountLayout.decode(data);
    accountInfo.address = publicKey;
    accountInfo.mint = new PublicKey(accountInfo.mint);
    accountInfo.owner = new PublicKey(accountInfo.owner);
    accountInfo.amount = u64.fromBuffer(accountInfo.amount);

    if (accountInfo.delegateOption === 0) {
        accountInfo.delegate = null;
        accountInfo.delegatedAmount = new u64();
    } else {
        accountInfo.delegate = new PublicKey(accountInfo.delegate);
        accountInfo.delegatedAmount = u64.fromBuffer(accountInfo.delegatedAmount);
    }

    accountInfo.isInitialized = accountInfo.state !== 0;
    accountInfo.isFrozen = accountInfo.state === 2;

    if (accountInfo.isNativeOption === 1) {
        accountInfo.rentExemptReserve = u64.fromBuffer(accountInfo.isNative);
        accountInfo.isNative = true;
    } else {
        accountInfo.rentExemptReserve = null;
        accountInfo.isNative = false;
    }

    if (accountInfo.closeAuthorityOption === 0) {
        accountInfo.closeAuthority = null;
    } else {
        accountInfo.closeAuthority = new PublicKey(accountInfo.closeAuthority);
    }
    return accountInfo;
}
exports.getTokenAccountInfo = getTokenAccountInfo;


const getlAllTokenAccountsWithAtLeastOneToken = async (mintKey, connection) => {
    let one = new BN(1);
    let tokenHoldingResponses = [];
    let allResponses = await getAllTokenAccounts(mintKey, connection);
    allResponses.forEach((response) => {
        //buffer that represents u8 token account amount (balance)
        let amountBuffer = Buffer.from(response.account.data.slice(64, 72));
        let amount = u64.fromBuffer(amountBuffer);
        console.log(amount.toNumber());
        if (amount.gte(one)) {
            tokenHoldingResponses.push(response);
        }
    })
    return tokenHoldingResponses;
}
exports.getlAllTokenAccountsWithAtLeastOneToken = getlAllTokenAccountsWithAtLeastOneToken;


exports.getAssociatedTokenAccountAddress = async (owner, mint) => {
    let associatedProgramId = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
    return (
        await PublicKey.findProgramAddress(
        [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
        associatedProgramId
        )
    )[0];
};