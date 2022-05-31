mod instructions;
mod states;
mod error;

use anchor_lang::prelude::*;
use instructions::mint::mint::*;
use instructions::market::create_order::*;

declare_id!("nXWqyd8v3SxxqiHJCYQ2xKamkrGaDkBJqnwUU4DcDDs");

#[program]
pub mod zoo_nft_market_solana {
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

    pub fn create_order(
        ctx: Context<CreateOrder>,
        memo: String,
        price: u64
    ) -> Result<()> {
        instructions::market::create_order::create_order(ctx, memo, price)
    }
}
