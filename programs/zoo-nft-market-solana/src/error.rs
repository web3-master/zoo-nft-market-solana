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
}