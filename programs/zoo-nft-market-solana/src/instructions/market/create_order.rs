use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint, TokenAccount, Transfer};
use anchor_spl::token::transfer;
use anchor_spl::associated_token::AssociatedToken;
use crate::states::order::Order;
use crate::error::MarketError;

pub fn create_order(ctx: Context<CreateOrder>, memo: String, price: u64) -> Result<()> {
    let order = &mut ctx.accounts.order;
    order.creator = ctx.accounts.creator.key();
    order.mint_key = ctx.accounts.mint_key.key();
    order.memo = memo;
    order.price = price;
    order.bump = *ctx.bumps.get("order").unwrap();

    //
    // transfer nft from creator's token account into order's token account.
    //
    let cpi_accounts = Transfer {
        from: ctx.accounts.creator_token_account.to_account_info(),
        to: ctx.accounts.order_token_account.to_account_info(),
        authority: ctx.accounts.creator.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    let result = transfer(cpi_ctx, 1);
    if let Err(_) = result {
        return Err(error!(MarketError::TokenTransferFailed));
    }

    return Ok(());
}

#[derive(Accounts)]
#[instruction(memo: String)]
pub struct CreateOrder<'info> {
    #[account(
        init,
        payer = creator,
        space = Order::space(&memo),
        seeds = [
            b"order",
            creator.key().as_ref(),
            mint_key.key().as_ref(),
        ],
        bump
    )]
    pub order: Account<'info, Order>,

    #[account(
        init,
        payer = creator,
        associated_token::mint = mint_key,
        associated_token::authority = order
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
    pub rent: Sysvar<'info, Rent>,
}