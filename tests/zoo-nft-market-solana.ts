import * as anchor from "@project-serum/anchor";
import { AnchorError, Program } from "@project-serum/anchor";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  MINT_SIZE,
  createMintToInstruction,
} from "@solana/spl-token";
import { BN } from "bn.js";
import { assert, expect } from "chai";
import { ZooNftMarketSolana } from "../target/types/zoo_nft_market_solana";

const { LAMPORTS_PER_SOL } = anchor.web3;

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const mainProgram = anchor.workspace
  .ZooNftMarketSolana as Program<ZooNftMarketSolana>;

async function getAccountBalance(pubKey) {
  let account = await provider.connection.getAccountInfo(pubKey);
  return (account?.lamports ?? 0) / LAMPORTS_PER_SOL;
}

const createUser = async (airdropBalance: number) => {
  airdropBalance = airdropBalance * LAMPORTS_PER_SOL;
  let user = anchor.web3.Keypair.generate();
  const sig = await provider.connection.requestAirdrop(
    user.publicKey,
    airdropBalance
  );
  await provider.connection.confirmTransaction(sig);

  let wallet = new anchor.Wallet(user);
  let userProvider = new anchor.AnchorProvider(
    provider.connection,
    wallet,
    provider.opts
  );

  return {
    key: user,
    wallet,
    provider: userProvider,
  };
};

const programForUser = async (user) => {
  return new anchor.Program(
    mainProgram.idl,
    mainProgram.programId,
    user.provider
  );
};

const createMint = async (user) => {
  let mintKey = anchor.web3.Keypair.generate();
  const lamports =
    await mainProgram.provider.connection.getMinimumBalanceForRentExemption(
      MINT_SIZE
    );
  let associatedTokenAccount = await getAssociatedTokenAddress(
    mintKey.publicKey,
    user.key.publicKey
  );

  const mint_tx = new anchor.web3.Transaction().add(
    anchor.web3.SystemProgram.createAccount({
      fromPubkey: user.key.publicKey,
      newAccountPubkey: mintKey.publicKey,
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
      lamports,
    }),
    createInitializeMintInstruction(
      mintKey.publicKey,
      0,
      user.key.publicKey,
      user.key.publicKey
    )
  );

  try {
    const userProgram = await programForUser(user);
    const signature = await userProgram.provider.sendAndConfirm(mint_tx, [
      user.key,
      mintKey,
    ]);
  } catch (e) {
    console.log("createMint() failed!", e);
    return null;
  }

  return mintKey;
};

const createAssociateTokenAccount = async (
  mintKey: anchor.web3.PublicKey,
  user
) => {
  let associatedTokenAccount = await getAssociatedTokenAddress(
    mintKey,
    user.key.publicKey
  );

  const tx = new anchor.web3.Transaction().add(
    createAssociatedTokenAccountInstruction(
      user.key.publicKey,
      associatedTokenAccount,
      user.key.publicKey,
      mintKey
    )
  );

  try {
    const userProgram = await programForUser(user);
    const signature = await userProgram.provider.sendAndConfirm(tx, [user.key]);
  } catch (e) {
    console.log("createAssociateTokenAccount() failed!", e);
    return null;
  }

  return associatedTokenAccount;
};

const mintToken = async (mintKey: anchor.web3.Keypair, user) => {
  let associatedTokenAccount = await getAssociatedTokenAddress(
    mintKey.publicKey,
    user.key.publicKey
  );

  const tx = new anchor.web3.Transaction().add(
    createAssociatedTokenAccountInstruction(
      user.key.publicKey,
      associatedTokenAccount,
      user.key.publicKey,
      mintKey.publicKey
    ),
    createMintToInstruction(
      mintKey.publicKey,
      associatedTokenAccount,
      user.key.publicKey,
      1
    )
  );

  try {
    const userProgram = await programForUser(user);
    const signature = await userProgram.provider.sendAndConfirm(tx, [user.key]);
  } catch (e) {
    console.log("mintTo() failed!", e);
    return null;
  }

  return associatedTokenAccount;
};

const createOrder = async (
  user,
  mintKey: anchor.web3.Keypair,
  owner: anchor.web3.Keypair,
  ownerTokenAccount: anchor.web3.PublicKey,
  memo: String,
  price: number
) => {
  let program = await programForUser(user);
  const [orderAccount, bump] = await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("order"), mintKey.publicKey.toBytes()],
    program.programId
  );

  const orderTokenAccount = await getAssociatedTokenAddress(
    mintKey.publicKey,
    orderAccount,
    true
  );

  await program.methods
    .createOrder(memo, new BN(price))
    .accounts({
      order: orderAccount,
      orderTokenAccount: orderTokenAccount,
      mintKey: mintKey.publicKey,
      creator: owner.publicKey,
      creatorTokenAccount: ownerTokenAccount,
    })
    .rpc();

  let order = await program.account.order.fetch(orderAccount);
  return {
    order,
    orderAccount,
    orderTokenAccount,
  };
};

const cancelOrder = async (
  user,
  mintKey: anchor.web3.Keypair,
  owner: anchor.web3.Keypair,
  ownerTokenAccount: anchor.web3.PublicKey
) => {
  let program = await programForUser(user);
  const [orderAccount, bump] = await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("order"), mintKey.publicKey.toBytes()],
    program.programId
  );

  const orderTokenAccount = await getAssociatedTokenAddress(
    mintKey.publicKey,
    orderAccount,
    true
  );

  await program.methods
    .cancelOrder()
    .accounts({
      order: orderAccount,
      orderTokenAccount: orderTokenAccount,
      mintKey: mintKey.publicKey,
      creator: owner.publicKey,
      creatorTokenAccount: ownerTokenAccount,
    })
    .rpc();

  return {
    orderAccount,
    orderTokenAccount,
  };
};

const fillOrder = async (
  mintKey: anchor.web3.PublicKey,
  ownerKey: anchor.web3.PublicKey,
  buyer
) => {
  let program = await programForUser(buyer);
  const [orderAccount, bump] = await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("order"), mintKey.toBytes()],
    program.programId
  );

  const orderTokenAccount = await getAssociatedTokenAddress(
    mintKey,
    orderAccount,
    true
  );

  const buyerTokenAccount = await createAssociateTokenAccount(mintKey, buyer);

  await program.methods
    .fillOrder()
    .accounts({
      order: orderAccount,
      orderTokenAccount: orderTokenAccount,
      mintKey: mintKey,
      creator: ownerKey,
      buyer: buyer.key.publicKey,
      buyerTokenAccount: buyerTokenAccount,
    })
    .rpc();

  return buyerTokenAccount;
};

describe("market logic test", () => {
  it("create order", async () => {
    let user = await createUser(1);
    console.log("User Account: ", user.key.publicKey.toString());

    //
    // Create mint.
    //
    const mintKey = await createMint(user);
    console.log("Mint key: ", mintKey.publicKey.toString());

    //
    // Mint a token.
    //
    const tokenAccount = await mintToken(mintKey, user);
    console.log("Owner Token Account: ", tokenAccount.toString());

    var balance = await mainProgram.provider.connection.getTokenAccountBalance(
      tokenAccount
    );
    console.log("Owner Token Account Balance: ", balance.value.uiAmount);
    expect(balance.value.uiAmount).equals(1);

    //
    // Create an order.
    //
    let order = await createOrder(
      user,
      mintKey,
      user.key,
      tokenAccount,
      "This is test order.",
      1 * LAMPORTS_PER_SOL
    );
    console.log("[Order Created]");
    console.log("Order Account: ", order.orderAccount.toString());
    console.log("Order Token Account: ", order.orderTokenAccount.toString());
    console.log("Order.creator: ", order.order.creator.toString());
    console.log("Order.mintKey: ", order.order.mintKey.toString());
    console.log("Order.memo: ", order.order.memo);
    console.log("Order.price: ", order.order.price.toNumber());

    //
    // Check result.
    //
    balance = await mainProgram.provider.connection.getTokenAccountBalance(
      tokenAccount
    );
    console.log("Owner Token Account Balance: ", balance.value.uiAmount);
    expect(balance.value.uiAmount).equals(0);

    balance = await mainProgram.provider.connection.getTokenAccountBalance(
      order.orderTokenAccount
    );
    console.log("Order Token Account Balance: ", balance.value.uiAmount);
    expect(balance.value.uiAmount).equals(1);

    expect(order.order.creator.toString()).equals(
      user.key.publicKey.toString()
    );
    expect(order.order.mintKey.toString()).equals(mintKey.publicKey.toString());
    expect(order.order.memo).equals("This is test order.");
    expect(order.order.price.toNumber()).equals(1 * LAMPORTS_PER_SOL);
  });

  it("cancel order", async () => {
    let user = await createUser(1);
    console.log("User Account: ", user.key.publicKey.toString());

    //
    // Create mint.
    //
    const mintKey = await createMint(user);
    console.log("Mint key: ", mintKey.publicKey.toString());

    //
    // Mint a token.
    //
    const tokenAccount = await mintToken(mintKey, user);
    console.log("Owner Token Account: ", tokenAccount.toString());

    var balance = await mainProgram.provider.connection.getTokenAccountBalance(
      tokenAccount
    );
    console.log("Owner Token Account Balance: ", balance.value.uiAmount);
    expect(balance.value.uiAmount).equals(1);

    //
    // Create an order.
    //
    var order = await createOrder(
      user,
      mintKey,
      user.key,
      tokenAccount,
      "This is test order.",
      1 * LAMPORTS_PER_SOL
    );
    console.log("[Order Created]");
    console.log("Order Account: ", order.orderAccount.toString());
    console.log("Order Token Account: ", order.orderTokenAccount.toString());

    //
    // Check result.
    //
    balance = await mainProgram.provider.connection.getTokenAccountBalance(
      tokenAccount
    );
    console.log("Owner Token Account Balance: ", balance.value.uiAmount);
    expect(balance.value.uiAmount).equals(0);

    balance = await mainProgram.provider.connection.getTokenAccountBalance(
      order.orderTokenAccount
    );
    console.log("Order Token Account Balance: ", balance.value.uiAmount);
    expect(balance.value.uiAmount).equals(1);

    //
    // Cancel order.
    //
    order = await cancelOrder(user, mintKey, user.key, tokenAccount);
    console.log("[Order Canceled]");

    //
    // Check result.
    //
    balance = await mainProgram.provider.connection.getTokenAccountBalance(
      tokenAccount
    );
    console.log("Owner Token Account Balance: ", balance.value.uiAmount);
    expect(balance.value.uiAmount).equals(1);

    let orderAccountInfo = await mainProgram.provider.connection.getAccountInfo(
      order.orderAccount
    );
    console.log("Order Account: ", orderAccountInfo);
    expect(orderAccountInfo).equals(null);

    try {
      balance = await mainProgram.provider.connection.getTokenAccountBalance(
        order.orderTokenAccount
      );
      assert(false, "Order token account should be closed by cancel program.");
    } catch (e) {
      expect(e.toString()).contain("could not find account");
    }
  });

  it("fill order", async () => {
    let user = await createUser(1);
    console.log("User Account: ", user.key.publicKey.toString());

    let buyer = await createUser(2);
    console.log("Buyer Account: ", buyer.key.publicKey.toString());

    //
    // Create mint.
    //
    const mintKey = await createMint(user);
    console.log("Mint key: ", mintKey.publicKey.toString());

    //
    // Mint a token.
    //
    const tokenAccount = await mintToken(mintKey, user);
    console.log("Owner Token Account: ", tokenAccount.toString());

    var balance = await mainProgram.provider.connection.getTokenAccountBalance(
      tokenAccount
    );
    expect(balance.value.uiAmount).equals(1);

    //
    // Create an order.
    //
    var order = await createOrder(
      user,
      mintKey,
      user.key,
      tokenAccount,
      "This is test order.",
      1 * LAMPORTS_PER_SOL
    );
    console.log("[Order Created]");
    console.log("Order Account: ", order.orderAccount.toString());
    console.log("Order Token Account: ", order.orderTokenAccount.toString());

    console.log(
      "Creator Account Balance: ",
      await getAccountBalance(user.key.publicKey)
    );
    console.log(
      "Buyer Account Balance: ",
      await getAccountBalance(buyer.key.publicKey)
    );

    //
    // Fill order.
    //
    let buyerTokenAccount = await fillOrder(
      mintKey.publicKey,
      user.key.publicKey,
      buyer
    );
    console.log("[Order Filled]");
    console.log("Buyer Token Account: ", buyerTokenAccount.toString());
    console.log(
      "Creator Account Balance: ",
      await getAccountBalance(user.key.publicKey)
    );
    console.log(
      "Buyer Account Balance: ",
      await getAccountBalance(buyer.key.publicKey)
    );

    //
    // Check result.
    //
    balance = await mainProgram.provider.connection.getTokenAccountBalance(
      tokenAccount
    );
    console.log("Owner Token Account Balance: ", balance.value.uiAmount);
    expect(balance.value.uiAmount).equals(0);

    balance = await mainProgram.provider.connection.getTokenAccountBalance(
      buyerTokenAccount
    );
    console.log("Buyer Token Account Balance: ", balance.value.uiAmount);
    expect(balance.value.uiAmount).equals(1);

    let orderAccountInfo = await mainProgram.provider.connection.getAccountInfo(
      order.orderAccount
    );
    console.log("Order Account: ", orderAccountInfo);
    expect(orderAccountInfo).equals(null);

    try {
      balance = await mainProgram.provider.connection.getTokenAccountBalance(
        order.orderTokenAccount
      );
      assert(false, "Order token account should be closed by fill program.");
    } catch (e) {
      expect(e.toString()).contain("could not find account");
    }
  });

  it("fill order insufficient money error check", async () => {
    let user = await createUser(1);
    console.log("User Account: ", user.key.publicKey.toString());

    let buyer = await createUser(1);
    console.log("Buyer Account: ", buyer.key.publicKey.toString());

    //
    // Create mint.
    //
    const mintKey = await createMint(user);
    console.log("Mint key: ", mintKey.publicKey.toString());

    //
    // Mint a token.
    //
    const tokenAccount = await mintToken(mintKey, user);
    console.log("Owner Token Account: ", tokenAccount.toString());

    //
    // Create an order.
    //
    var order = await createOrder(
      user,
      mintKey,
      user.key,
      tokenAccount,
      "This is test order.",
      2 * LAMPORTS_PER_SOL
    );
    console.log("[Order Created]");
    console.log("Order Account: ", order.orderAccount.toString());
    console.log("Order Token Account: ", order.orderTokenAccount.toString());

    console.log(
      "Creator Account Balance: ",
      await getAccountBalance(user.key.publicKey)
    );
    console.log(
      "Buyer Account Balance: ",
      await getAccountBalance(buyer.key.publicKey)
    );

    try {
      //
      // Fill order.
      //
      await fillOrder(mintKey.publicKey, user.key.publicKey, buyer);
      assert(
        false,
        "Fill order should be failed because buyer has no enough money."
      );
    } catch (err) {
      expect(err).to.be.instanceOf(AnchorError);
      const anchorError = err as AnchorError;
      expect(anchorError.error.errorCode.number).equals(6004);
      expect(anchorError.error.errorCode.code).equals("InsufficientMoney");
    }
  });
});
