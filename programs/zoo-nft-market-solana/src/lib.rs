use anchor_lang::prelude::*;

declare_id!("nXWqyd8v3SxxqiHJCYQ2xKamkrGaDkBJqnwUU4DcDDs");

#[program]
pub mod zoo_nft_market_solana {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
