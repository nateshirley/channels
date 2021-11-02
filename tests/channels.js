const anchor = require("@project-serum/anchor");
const { web3 } = anchor;
const { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } = web3;
const {
  TOKEN_PROGRAM_ID,
  Token,
  AccountLayout,
  MintLayout,
  u64,
} = require("@solana/spl-token");
const { BN, min } = require("bn.js");
const {
  getlAllTokenAccountsWithAtLeastOneToken,
  getAssociatedTokenAccountAddress,
} = require("./helpers/tokenAccountQueries");
const {
  createAssociatedTokenAccountInstruction,
} = require("./helpers/tokenAccountInstructions");
const BufferLayout = require("buffer-layout");
const {
  getMetadataAddress,
  TOKEN_METADATA_PROGRAM_ID,
} = require("./helpers/metadataHelpers");
const assert = require("assert");


const publicKey = (property) => {
  return BufferLayout.blob(32, property);
};
const ChannelAttributionLayout = BufferLayout.struct([
  BufferLayout.seq(BufferLayout.u8(), 8, "discriminator"),
  publicKey("creation"),
  publicKey("subscription"),
]);
const terminalWalletKey = new PublicKey("5J8jLVz5YY5uc9sJuWtx42VVMUanLGYWoPXMRu7GsNEJ");

describe("channels", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Channels;

  let creator = provider.wallet.payer;
  let channel = Keypair.generate();
  let subscriber = Keypair.generate();
  let subscription = Keypair.generate();
  let mintAuth = null;
  const channelProgramId = new PublicKey('WczqDK2L6bHkQVwrZuSmKFyUvgVTHtgE4zsGfQ1wmfi');




  it("give a little to the subscriber", async () => {
    let signature = await web3.sendAndConfirmTransaction(
      provider.connection,
      new web3.Transaction().add(
        web3.SystemProgram.transfer({
          fromPubkey: creator.publicKey,
          lamports: web3.LAMPORTS_PER_SOL * 0.006,
          toPubkey: subscriber.publicKey,
        })
      ),
      [creator]
    );
  });

  it("create a channel", async () => {
    let channelTokenAccount = await getAssociatedTokenAccountAddress(
      creator.publicKey,
      channel.publicKey
    );
    let [_channelAttribution, _channelAttributionBump] =
      await PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("channel"),
          channel.publicKey.toBuffer(),
        ],
        program.programId
      );
    let [_subscriptionAttribution, _subscriptionAttributionBump] =
      await PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("channel"),
          subscription.publicKey.toBuffer(),
        ],
        program.programId
      );
    let [_mintAuth, _mintAuthBump] = await PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("authority")],
      program.programId
    );
    let [_channelMetadata, _channelMetadataBump] = await getMetadataAddress(
      channel.publicKey
    );
    let [_subscriptionMetadata, _subscriptionMetadataBump] =
      await getMetadataAddress(subscription.publicKey);
    console.log(_channelAttribution.toBase58(), " the channel attr")


    mintAuth = _mintAuth;
    const metadataInputs = {
      name: "Big Channel",
      symbol: "BCBB",
      uri: "https://nateshirley.github.io/data/default.json",
    };

    const ctx = await program.rpc.createChannel(
      _channelAttributionBump,
      _subscriptionAttributionBump,
      _mintAuthBump,
      metadataInputs,
      {
        accounts: {
          creator: creator.publicKey,
          creationTokenAccount: channelTokenAccount,
          creationMint: channel.publicKey,
          creationAttribution: _channelAttribution,
          creationMetadata: _channelMetadata,
          subscriptionMint: subscription.publicKey,
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
            lamports:
              await provider.connection.getMinimumBalanceForRentExemption(165),
            programId: TOKEN_PROGRAM_ID,
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
            lamports:
              await provider.connection.getMinimumBalanceForRentExemption(165),
            programId: TOKEN_PROGRAM_ID,
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
            creator.publicKey
          ),
        ],
        signers: [creator, channel, subscription],
      }
    );
    console.log("create signature", ctx);

    //check for attribution pda data
    let rawCreationAttribution = await provider.connection.getAccountInfo(
      _channelAttribution
    );
    let creationAttributionDecoded = ChannelAttributionLayout.decode(
      rawCreationAttribution.data
    );
    // //console.log(channelDecoded);
    readableAttribution(
      creationAttributionDecoded,
      channel.publicKey,
      subscription.publicKey
    );

    let rawSubAttribution = await provider.connection.getAccountInfo(
      _subscriptionAttribution
    );
    let subAttributionDecoded = ChannelAttributionLayout.decode(
      rawSubAttribution.data
    );
    //console.log(channelDecoded);
    readableAttribution(
      subAttributionDecoded,
      channel.publicKey,
      subscription.publicKey
    );

    //check for creator token amount
    let channelTokenAccountBalance =
      await provider.connection.getTokenAccountBalance(channelTokenAccount);
    assert.ok(channelTokenAccountBalance.value.uiAmount === 1);

    let ChannelToken = new Token(
      provider.connection,
      channel.publicKey,
      TOKEN_PROGRAM_ID,
      new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
      creator
    );
    let channelInfo = await ChannelToken.getMintInfo();
    assert.ok(channelInfo.mintAuthority === null);
  });


  it("subscribe to a channel", async () => {
    let subscriberTokenAccount = await getAssociatedTokenAccountAddress(
      subscriber.publicKey,
      subscription.publicKey
    );
    let [_mintAuth, _mintAuthBump] = await PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("authority")],
      program.programId
    );
    const tx = await program.rpc.subscribe(_mintAuthBump, {
      accounts: {
        subscriber: subscriber.publicKey,
        subscriberTokenAccount: subscriberTokenAccount,
        subscriptionMint: subscription.publicKey,
        mintAuth: mintAuth,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      instructions: [
        //create associated token account for the subscriber
        createAssociatedTokenAccountInstruction(
          subscription.publicKey,
          subscriberTokenAccount,
          subscriber.publicKey,
          subscriber.publicKey
        ),
      ],
      signers: [subscriber],
    });

    //check for subscriber token amount
    let subscriberTokenAccountBalance =
      await provider.connection.getTokenAccountBalance(subscriberTokenAccount);
    assert.ok(subscriberTokenAccountBalance.value.uiAmount === 1);
  });


  it("get the channels for my wallet", async () => {

    //get token accounts for my wallet
    //for each token account, run a query to see if there's an attribution pda that matches the mint
    const getDecodedAttribution = async (attributionKey) => {
      let rawAttribution = await provider.connection.getAccountInfo(
        attributionKey
      );
      if (rawAttribution) {
        return ChannelAttributionLayout.decode(
          rawAttribution.data
        );
      }
    }

    const getAttributionAddress = async (mint) => {
      return await web3.PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("channel"),
          mint.toBuffer(),
        ],
        channelProgramId
      );
    }

    const getTokenAccountsForWallet = async (walletKey, connection) => {
      let tokenAccountResponses = await connection.getTokenAccountsByOwner(walletKey, {
        programId: TOKEN_PROGRAM_ID
      });
      return tokenAccountResponses.value
    }

  });





  it('update the metadata', async () => {
    let channelTokenAccount = await getAssociatedTokenAccountAddress(creator.publicKey, channel.publicKey)
    let [_channelMetadata, _channelMetadataBump] = await getMetadataAddress(
      channel.publicKey
    );
    let [_subscriptionMetadata, _subscriptionMetadataBump] =
      await getMetadataAddress(subscription.publicKey);
    let [_subscriptionAttribution, _subscriptionAttributionBump] =
      await PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("channel"),
          subscription.publicKey.toBuffer(),
        ],
        program.programId
      );
    let [_mintAuth, _mintAuthBump] = await PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("authority")],
      program.programId
    );
    const updateMetadataInputs = {
      name: "updated Channel",
      symbol: "BCBB",
      uri: "https://nateshirley.github.io/data/default.json",
    };

    const tx = await program.rpc.updateChannelMetadata(_mintAuthBump, _subscriptionAttributionBump, updateMetadataInputs, {
      accounts: {
        creator: creator.publicKey,
        creationMint: channel.publicKey,
        creationTokenAccount: channelTokenAccount,
        creationMetadata: _channelMetadata,
        subscriptionMint: subscription.publicKey,
        subscriptionAttribution: _subscriptionAttribution,
        subscriptionMetadata: _subscriptionMetadata,
        mintAuth: _mintAuth,
        systemProgram: SystemProgram.programId,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID
      },
      signers: [
        creator
      ]
    });
  });

});

const readableAttribution = (decodedAttribution, creation, subscription) => {
  let creationPk = new PublicKey(decodedAttribution.creation);
  let subscriptionPk = new PublicKey(decodedAttribution.subscription);
  //console.log("channel is ", channelPk.toBase58());
  //console.log("subscription is", subscriptionPk.toBase58());
  //console.log(channel.toBase58());
  assert.ok(creationPk.equals(creation));
  assert.ok(subscriptionPk.equals(subscription));
};

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
