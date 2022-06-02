import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react";
import * as ipfsClient from "ipfs-http-client";
import { TOKEN_METADATA_PROGRAM_ID } from "../data/Constants";

const ipfs = ipfsClient.create({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
});

const getWalletConnection = (
  program: Program
): [WalletContextState, anchor.web3.Connection] => {
  const wallet = (program.provider as anchor.AnchorProvider)
    .wallet as WalletContextState;
  const connection = program.provider.connection;
  return [wallet, connection];
};

const getMetadata = async (
  mintKey: anchor.web3.PublicKey
): Promise<anchor.web3.PublicKey> => {
  return (
    await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )
  )[0];
};

export const uploadImageToIpfs = async (
  imageFileBuffer: Buffer
): Promise<String> => {
  const uploadedImage = await ipfs.add(imageFileBuffer);

  if (!uploadedImage) {
    return null;
  }

  return `https://ipfs.infura.io/ipfs/${uploadedImage.path}`;
};

export const uploadMetadataToIpfs = async (
  name: String,
  symbol: String,
  description: String,
  uploadedImage: String,
  traitSize: String,
  traitLiveIn: String,
  traitFood: String
): Promise<String> => {
  const metadata = {
    name,
    symbol,
    description,
    image: uploadedImage,
    attributes: [
      {
        trait_type: "size",
        value: traitSize,
      },
      {
        trait_type: "live in",
        value: traitLiveIn,
      },
      {
        trait_type: "food",
        value: traitFood,
      },
    ],
  };

  const uploadedMetadata = await ipfs.add(JSON.stringify(metadata));

  if (uploadedMetadata == null) {
    return null;
  } else {
    return `https://ipfs.infura.io/ipfs/${uploadedMetadata.path}`;
  }
};

export const mint = async (
  program: Program,
  name: String,
  symbol: String,
  metadataUrl: String
) => {
  const [wallet, connection] = getWalletConnection(program);

  const lamports = await connection.getMinimumBalanceForRentExemption(
    MINT_SIZE
  );

  const mintKey = anchor.web3.Keypair.generate();

  const associatedTokenAddress = await getAssociatedTokenAddress(
    mintKey.publicKey,
    wallet.publicKey
  );
  console.log("NFT Account: ", associatedTokenAddress.toBase58());

  const mint_tx = new anchor.web3.Transaction().add(
    anchor.web3.SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: mintKey.publicKey,
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
      lamports,
    }),
    createInitializeMintInstruction(
      mintKey.publicKey,
      0,
      wallet.publicKey,
      wallet.publicKey
    ),
    createAssociatedTokenAccountInstruction(
      wallet.publicKey,
      associatedTokenAddress,
      wallet.publicKey,
      mintKey.publicKey
    )
  );
  let blockhashObj = await connection.getLatestBlockhash();
  console.log("blockhashObj", blockhashObj);
  mint_tx.recentBlockhash = blockhashObj.blockhash;

  try {
    const signature = await wallet.sendTransaction(mint_tx, connection, {
      signers: [mintKey],
    });
    await connection.confirmTransaction(signature, "confirmed");
  } catch {
    return null;
  }

  console.log("Mint key: ", mintKey.publicKey.toString());
  console.log("User: ", wallet.publicKey.toString());

  const metadataAddress = await getMetadata(mintKey.publicKey);
  console.log("Metadata address: ", metadataAddress.toBase58());

  try {
    const tx = program.transaction.mintNft(
      mintKey.publicKey,
      name,
      symbol,
      metadataUrl,
      {
        accounts: {
          mintAuthority: wallet.publicKey,
          mint: mintKey.publicKey,
          tokenAccount: associatedTokenAddress,
          tokenProgram: TOKEN_PROGRAM_ID,
          metadata: metadataAddress,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          payer: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
      }
    );

    const signature = await wallet.sendTransaction(tx, connection);
    await connection.confirmTransaction(signature, "confirmed");
    console.log("Mint Success!");

    return {
      mintKey: mintKey.publicKey,
      associatedTokenAddress,
      metadataAddress,
    };
  } catch {
    return null;
  }
};
