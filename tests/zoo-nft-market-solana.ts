import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { ZooNftMarketSolana } from "../target/types/zoo_nft_market_solana";

describe("zoo-nft-market-solana", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.ZooNftMarketSolana as Program<ZooNftMarketSolana>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
