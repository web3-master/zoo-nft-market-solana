import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "bn.js";
import { WalletContextState } from "@solana/wallet-adapter-react";

const { LAMPORTS_PER_SOL } = anchor.web3;

const getWalletConnection = (
  program: Program
): [WalletContextState, anchor.web3.Connection] => {
  const wallet = (program.provider as anchor.AnchorProvider)
    .wallet as WalletContextState;
  const connection = program.provider.connection;
  return [wallet, connection];
};

export const createOrder = async (
  program: Program,
  mintKey: anchor.web3.PublicKey,
  ownerKey: anchor.web3.PublicKey,
  ownerTokenAccount: anchor.web3.PublicKey,
  memo: String,
  price: number
) => {
  const [wallet, connection] = getWalletConnection(program);

  const [orderAccount] = await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("order"), mintKey.toBytes()],
    program.programId
  );

  const orderTokenAccount = await getAssociatedTokenAddress(
    mintKey,
    orderAccount,
    true
  );

  try {
    const tx = program.transaction.createOrder(
      memo,
      new BN(price * LAMPORTS_PER_SOL),
      {
        accounts: {
          order: orderAccount,
          orderTokenAccount: orderTokenAccount,
          mintKey: mintKey,
          creator: ownerKey,
          creatorTokenAccount: ownerTokenAccount,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
      }
    );

    const signature = await wallet.sendTransaction(tx, connection);
    await connection.confirmTransaction(signature, "confirmed");
    console.log("Create Order Success!");

    let order = await program.account.order.fetch(orderAccount);
    return order;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const cancelOrder = async (
  program: Program,
  mintKey: anchor.web3.PublicKey,
  ownerKey: anchor.web3.PublicKey,
  ownerTokenAccount: anchor.web3.PublicKey
) => {
  const [wallet, connection] = getWalletConnection(program);

  const [orderAccount] = await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("order"), mintKey.toBytes()],
    program.programId
  );

  const orderTokenAccount = await getAssociatedTokenAddress(
    mintKey,
    orderAccount,
    true
  );

  try {
    const tx = program.transaction.cancelOrder({
      accounts: {
        order: orderAccount,
        orderTokenAccount: orderTokenAccount,
        mintKey: mintKey,
        creator: ownerKey,
        creatorTokenAccount: ownerTokenAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      },
    });

    const signature = await wallet.sendTransaction(tx, connection);
    await connection.confirmTransaction(signature, "confirmed");
    console.log("Cancel Order Success!");
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const fillOrder = async (
  program: Program,
  mintKey: anchor.web3.PublicKey,
  ownerKey: anchor.web3.PublicKey,
  buyer: anchor.web3.Keypair
) => {
  const [wallet, connection] = getWalletConnection(program);

  const [orderAccount] = await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("order"), mintKey.toBytes()],
    program.programId
  );

  const orderTokenAccount = await getAssociatedTokenAddress(
    mintKey,
    orderAccount,
    true
  );

  let buyerTokenAccount = await getAssociatedTokenAddress(
    mintKey,
    buyer.publicKey
  );

  try {
    const tx = new anchor.web3.Transaction().add(
      createAssociatedTokenAccountInstruction(
        buyer.publicKey,
        buyerTokenAccount,
        buyer.publicKey,
        mintKey
      )
    );

    const signature = await wallet.sendTransaction(tx, connection);
    await connection.confirmTransaction(signature, "confirmed");
  } catch (err) {
    console.log(err);
    return false;
  }

  try {
    const tx = program.transaction.fillOrder({
      accounts: {
        order: orderAccount,
        orderTokenAccount: orderTokenAccount,
        mintKey: mintKey,
        creator: ownerKey,
        buyer: buyer.publicKey,
        buyerTokenAccount: buyerTokenAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      },
    });

    const signature = await wallet.sendTransaction(tx, connection);
    await connection.confirmTransaction(signature, "confirmed");
    console.log("Fill Order Success!");
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};
