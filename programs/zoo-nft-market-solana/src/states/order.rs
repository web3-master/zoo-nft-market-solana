use anchor_lang::prelude::*;

#[account]
pub struct Order {
    pub creator: Pubkey,
    pub mint_key: Pubkey,
    pub memo: String,
    pub price: u64,
}

impl Order {
    pub fn space(memo: &str) -> usize {
        8 + 32 + 32 +
        4 + memo.len() + // memo string
        8
    }
}