use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Transfer, CloseAccount};
use anchor_spl::token::{transfer, close_account};
use anchor_spl::associated_token::AssociatedToken;
use crate::states::order::Order;
use crate::error::MarketError;

pub fn fill_order(ctx: Context<FillOrder>) -> Result<()> {
    let order = &mut ctx.accounts.order;
    let buyer = &mut ctx.accounts.buyer;
    let creator = &mut ctx.accounts.creator;

    //
    // Check buyer's balance against order's price.
    //
    if buyer.lamports() < order.price {
        return Err(error!(MarketError::InsufficientMoney));
    }

    //
    // Transfer order's money from buyer into creator.
    //
    anchor_lang::solana_program::program::invoke(
        &anchor_lang::solana_program::system_instruction::transfer(
            &buyer.to_account_info().key(),
            &creator.to_account_info().key(),
            order.price
        ),
        &[
            buyer.to_account_info(),
            creator.to_account_info(),
            ctx.accounts.system_program.to_account_info()
        ]
    )?;

    //
    // Transfer order token account's token into buyer token account.
    //
    let seeds = &[
        b"order",
        ctx.accounts.mint_key.key.as_ref(),
        &[order.bump]
    ];
    let signer = &[&seeds[..]];
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = Transfer {
        from: ctx.accounts.order_token_account.to_account_info(),
        to: ctx.accounts.buyer_token_account.to_account_info(),
        authority: ctx.accounts.order.to_account_info()
    };
    let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    let result = transfer(cpi_context, 1);
    if let Err(_) = result {
        return Err(error!(MarketError::TokenTransferFailed3));
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
    let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    let result = close_account(cpi_context);
    if let Err(_) = result {
        return Err(error!(MarketError::TokenCloseFailed));
    }

    Ok(())
}

#[derive(Accounts)]
pub struct FillOrder<'info> {
    #[account(
        mut,
        seeds = [
            b"order",
            mint_key.key.as_ref(),
        ],
        bump,
        has_one = creator,
        close = creator
    )]
    pub order: Account<'info, Order>,

    #[account(
        mut,
        associated_token::mint = order.mint_key,
        associated_token::authority = order,
    )]
    pub order_token_account: Account<'info, TokenAccount>,

    /// CHECK: This account's address is only used.
    pub mint_key: AccountInfo<'info>,

    /// CHECK: This account's address is only used.
    #[account(mut)]
    pub creator: AccountInfo<'info>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        constraint=buyer_token_account.owner == buyer.key(),
        constraint=buyer_token_account.mint == mint_key.key(),
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}