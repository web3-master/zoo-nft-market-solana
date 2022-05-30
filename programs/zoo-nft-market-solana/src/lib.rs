mod instructions;
mod error;

use anchor_lang::prelude::*;
use instructions::mint::mint::*;

declare_id!("nXWqyd8v3SxxqiHJCYQ2xKamkrGaDkBJqnwUU4DcDDs");

#[program]
pub mod zoo_nft_market {
    use super::*;

    pub fn mint_nft(
        ctx: Context<MintNFT>,
        creator_key: Pubkey,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        instructions::mint::mint::mint_nft(ctx, creator_key, name, symbol, uri)
    }
}
