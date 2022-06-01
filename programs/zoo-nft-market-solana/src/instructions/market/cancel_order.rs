use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Transfer, Mint, CloseAccount};
use anchor_spl::token::{transfer, close_account};
use anchor_spl::associated_token::AssociatedToken;
use crate::states::order::Order;
use crate::error::MarketError;

pub fn cancel_order(ctx: Context<CancelOrder>) -> Result<()> {
    //
    // Transfer nft from order token account back into creator's token account.
    //
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = Transfer {
        from: ctx.accounts.order_token_account.to_account_info(),
        to: ctx.accounts.creator_token_account.to_account_info(),
        authority: ctx.accounts.order.to_account_info(),
    };
    let seeds = &[
        b"order",
        ctx.accounts.mint_key.to_account_info().key.as_ref(),
        &[ctx.accounts.order.bump]
    ];
    let signer = &[&seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    let result = transfer(cpi_ctx, 1);
    if let Err(_) = result {
        return Err(error!(MarketError::TokenTransferFailed2));
    }

    //
    // Close order token account.
    //
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = CloseAccount {
        account: ctx.accounts.order_token_account.to_account_info(),
        destination: ctx.accounts.creator.to_account_info(),
        authority: ctx.accounts.order.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    let result = close_account(cpi_ctx);
    if let Err(_) = result {
        return Err(error!(MarketError::TokenCloseFailed));
    }

    return Ok(());
}

#[derive(Accounts)]
pub struct CancelOrder<'info> {
    #[account(
        mut,
        seeds = [
            b"order",
            mint_key.key().as_ref()
        ],
        bump,
        has_one = creator,
        close = creator
    )]
    pub order: Account<'info, Order>,

    #[account(
        mut,
        associated_token::mint = mint_key,
        associated_token::authority = order,
    )]
    pub order_token_account: Account<'info, TokenAccount>,

    pub mint_key: Account<'info, Mint>,

    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        constraint=creator_token_account.owner == creator.key(),
        constraint=creator_token_account.mint == mint_key.key()
    )]
    pub creator_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}