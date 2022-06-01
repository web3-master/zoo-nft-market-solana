use anchor_lang::prelude::*;

#[error_code]
pub enum MintError {
    #[msg("Mint failed!")]
    MintFailed,

    #[msg("Metadata account create failed!")]
    MetadataCreateFailed
}

#[error_code]
pub enum MarketError {
    #[msg("Token transfer from creator account into order account failed!")]
    TokenTransferFailed,

    #[msg("Token transfer from order account to creator account failed!")]
    TokenTransferFailed2,

    #[msg("Token transfer from order account to buyer account failed!")]
    TokenTransferFailed3,

    #[msg("Order token close failed!")]
    TokenCloseFailed,

    #[msg("Buyer account's sol balance is insufficient to buy order!")]
    InsufficientMoney,
}