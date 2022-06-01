mod instructions;
mod states;
mod error;

use anchor_lang::prelude::*;
use instructions::mint::mint::*;
use instructions::market::create_order::*;
use instructions::market::cancel_order::*;
use instructions::market::fill_order::*;

declare_id!("D6oUwPksdxCJLdiJwUUCn6XPGsUXAsXhPdsMfiULPkLa");

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

    pub fn cancel_order(
        ctx: Context<CancelOrder>
    ) -> Result<()> {
        instructions::market::cancel_order::cancel_order(ctx)
    }

    pub fn fill_order(ctx: Context<FillOrder>) -> Result<()> {
        instructions::market::fill_order::fill_order(ctx)
    }
}
