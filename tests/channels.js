const anchor = require('@project-serum/anchor');
const { web3 } = anchor;
const { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } = web3;
const { TOKEN_PROGRAM_ID, Token, AccountLayout, MintLayout, u64 } = require("@solana/spl-token");
const { BN, min } = require('bn.js');
const { getlAllTokenAccountsWithAtLeastOneToken, getAssociatedTokenAccountAddress } = require("./helpers/tokenAccountQueries")
const { createAssociatedTokenAccountInstruction } = require('./helpers/tokenAccountInstructions');
const BufferLayout = require('buffer-layout');
const { getMetadataAddress, TOKEN_METADATA_PROGRAM_ID } = require('./helpers/metadataHelpers')
const assert = require("assert");


//5J8jLVz5YY5uc9sJuWtx42VVMUanLGYWoPXMRu7GsNEJ - my wallet

const publicKey = (property) => {
  return BufferLayout.blob(32, property);
};
const AttributionLayout = BufferLayout.struct(
  [
    BufferLayout.seq(BufferLayout.u8(), 8, 'discriminator'),
    publicKey('channel'),
    publicKey('subscription')
  ]
);

describe('channels', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Channels;

  let creator = provider.wallet.payer;
  let channel = Keypair.generate();
  let subscriber = Keypair.generate();
  let subscription = Keypair.generate();
  let mintAuth = null;
    
  it('create a channel', async () => {
    let channelTokenAccount = await getAssociatedTokenAccountAddress(creator.publicKey, channel.publicKey)
    let [_channelAttribution, _channelAttributionBump] = await PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("channel"), channel.publicKey.toBuffer()],
      program.programId
    );
    let [_subscriptionAttribution, _subscriptionAttributionBump] = await PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("channel"), subscription.publicKey.toBuffer()],
      program.programId
    );
    let [_mintAuth, _mintAuthBump] = await PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("authority")],
      program.programId
    );
    let [_channelMetadata, _channelMetadataBump] = await getMetadataAddress(channel.publicKey);
    let [_subscriptionMetadata, _subscriptionMetadataBump] = await getMetadataAddress(subscription.publicKey);

    mintAuth = _mintAuth;
    const metadataInputs = {
      name: "Big Channel",
      symbol: "BCBB",
      uri: "https://nateshirley.github.io/data/default.json"
    };

    const ctx = await program.rpc.createChannel( _channelAttributionBump, _subscriptionAttributionBump, _mintAuthBump, metadataInputs, {
      accounts: {
        creator: creator.publicKey,
        channelTokenAccount: channelTokenAccount,
        channel: channel.publicKey,
        channelAttribution: _channelAttribution,
        channelMetadata: _channelMetadata,
        subscription: subscription.publicKey,
        subscriptionAttribution: _subscriptionAttribution,
        subscriptionMetadata: _subscriptionMetadata,
        mintAuth: mintAuth,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      }, 
      instructions: [
        //create channel mint account
        SystemProgram.createAccount({
          fromPubkey: creator.publicKey,
          newAccountPubkey: channel.publicKey,
          space: MintLayout.span,
          lamports: await provider.connection.getMinimumBalanceForRentExemption(165),
          programId: TOKEN_PROGRAM_ID
        }),
        //init channel mint account
        Token.createInitMintInstruction(
          TOKEN_PROGRAM_ID,
          channel.publicKey,
          0,
          mintAuth,
          null
        ),
        //create subscription mint account
        SystemProgram.createAccount({
          fromPubkey: creator.publicKey,
          newAccountPubkey: subscription.publicKey,
          space: MintLayout.span,
          lamports: await provider.connection.getMinimumBalanceForRentExemption(165),
          programId: TOKEN_PROGRAM_ID
        }),
        //init subscription mint account
        Token.createInitMintInstruction(
          TOKEN_PROGRAM_ID,
          subscription.publicKey,
          0,
          mintAuth,
          null
        ),
        //create associated token account for the channel creator
        createAssociatedTokenAccountInstruction(
          channel.publicKey,
          channelTokenAccount,
          creator.publicKey,
          creator.publicKey,
        ),
      ], 
      signers: [
        creator, channel, subscription
      ]
    });
    console.log("create signature", ctx);
   
    //check for attribution pda data
    let rawChannelAttribution = await provider.connection.getAccountInfo(_channelAttribution);
    let channelAttributionDecoded = AttributionLayout.decode(rawChannelAttribution.data);
    // //console.log(channelDecoded);
    readableAttribution(channelAttributionDecoded, channel.publicKey, subscription.publicKey);
 
    let rawSubAttribution = await provider.connection.getAccountInfo(_subscriptionAttribution);
    let subAttributionDecoded = AttributionLayout.decode(rawSubAttribution.data);
    //console.log(channelDecoded);
    readableAttribution(subAttributionDecoded, channel.publicKey, subscription.publicKey);

    //check for creator token amount
    let channelTokenAccountBalance = await provider.connection.getTokenAccountBalance(channelTokenAccount);
    assert.ok(channelTokenAccountBalance.value.uiAmount === 1);

    let ChannelToken = new Token(
      provider.connection,
      channel.publicKey,
      TOKEN_PROGRAM_ID,
      new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
      creator
    );
    let channelInfo = await ChannelToken.getMintInfo();
    assert.ok(channelInfo.mintAuthority === null);
  
  });

  /*
  it('subscribe to a channel', async () => {
    
    
    let subscriberTokenAccount = await getAssociatedTokenAccountAddress(subscriber.publicKey, subscription.publicKey);
    let [_mintAuth, _mintAuthBump] = await PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("authority")],
      program.programId
    );


    const tx = await program.rpc.subscribe( _mintAuthBump, {
      accounts: {
        subscriber: subscriber.publicKey,
        subscriberTokenAccount: subscriberTokenAccount,
        subscription: subscription.publicKey,
        mintAuth: mintAuth,
        tokenProgram: TOKEN_PROGRAM_ID
      },
      instructions: [
        //create associated token account for the subscriber
        createAssociatedTokenAccountInstruction(
          subscription.publicKey,
          subscriberTokenAccount,
          subscriber.publicKey,
          subscriber.publicKey,
        ),
      ],
      signers: [
        subscriber
      ]
    });

    //check for subscriber token amount
    let subscriberTokenAccountBalance = await provider.connection.getTokenAccountBalance(subscriberTokenAccount);
    assert.ok(subscriberTokenAccountBalance.value.uiAmount === 1);

  });
  */

  /*
  it('update the metadata', async () => {
    let channelTokenAccount = await getAssociatedTokenAccountAddress(creator.publicKey, channel.publicKey)
    let [_mintAuth, _mintAuthBump] = await PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("authority")],
      program.programId
    );

    const tx = await program.rpc.updateMetadata( _mintAuthBump, {
      accounts: {
        creator: creator.publicKey,
        channel: channel.publicKey,
        channelTokenAccount: channelTokenAccount,
        subscription: subscription.publicKey,
        mintAuth: _mintAuth,
        systemProgram: SystemProgram.programId,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID
      }, 
      signers: [
        creator
      ]
    });  
  });
  */

});




const readableAttribution = (decodedAttribution, channel, subscription) => {
  let channelPk = new PublicKey(decodedAttribution.channel);
  let subscriptionPk = new PublicKey(decodedAttribution.subscription);
  //console.log("channel is ", channelPk.toBase58());
  //console.log("subscription is", subscriptionPk.toBase58());
  //console.log(channel.toBase58());
  assert.ok(channelPk.equals(channel));
  assert.ok(subscriptionPk.equals(subscription));
}









  /*

  it('get em all', async () => {
    let tokenHoldingResponses = await getlAllTokenAccountsWithAtLeastOneToken(mint.publicKey, provider.connection);
    console.log("there are " + tokenHoldingResponses.length + " accounts that hold at least 1 token.");
  })
    */


//LEFTOVERS
  /*


    //9*16 = 144
    //16*16 = 256
    //mint accounts are 82 bytes
    //token accounts are 165 bytes
  
    let walletTokenAccountInfo = await provider.connection.getAccountInfo(walletTokenAccount);
    console.log(walletTokenAccountInfo);

    let buffer = Buffer.from(walletTokenAccountInfo.data);
    let mintBytes = buffer.slice(0, 32);
    let mintKey = new PublicKey(mintBytes);
    console.log(mintBytes);

    console.log("the actual mint key")
    console.log(mint.publicKey.toBase58())
    console.log("the derived public key")
    console.log(mintKey.toBase58());


        //the way to get the largest. i need all 
    let largestAccounts = await provider.connection.getTokenLargestAccounts(mint.publicKey);
    console.log(largestAccounts);

        //let sampleMint = new PublicKey("8BSsK1bLBzYQuw1cChwuDpN5prq22xsG6Pv6cWv1UcQP");
    // let sampleAccount = await provider.connection.getAccountInfo(new PublicKey('E8M3C1CZrUoSehNB97o1ku7pqvhAq5wDjEqrUBtYdu2'))
    // console.log(sampleAccount);
    // console.log(sampleAccount.data.length);



  */