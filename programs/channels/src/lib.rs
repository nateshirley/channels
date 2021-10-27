use anchor_lang::{
    prelude::*,
    solana_program::{self, program_option::COption},
};
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use anchor_token_metadata;
use spl_token::instruction::AuthorityType;
use spl_token_metadata::{instruction::update_metadata_accounts, state::Metadata};

declare_id!("WczqDK2L6bHkQVwrZuSmKFyUvgVTHtgE4zsGfQ1wmfi");
const MINT_AUTH_SEED: &[u8] = b"authority";
const CHANNEL_SEED: &[u8] = b"channel";

#[program]
pub mod channels {
    use super::*;
    pub fn create_channel(
        ctx: Context<CreateChannel>,
        _channel_attribution_bump: u8,
        _subscription_attribution_bump: u8,
        _mint_auth_bump: u8,
        metadata_inputs: MetadataInputs
    ) -> ProgramResult {
        let (_mint_auth, bump_seed) =
            Pubkey::find_program_address(&[MINT_AUTH_SEED], ctx.program_id);
        let seeds = &[&MINT_AUTH_SEED[..], &[bump_seed]];

        //mint one channel token to creator
        token::mint_to(
            ctx.accounts
                .into_mint_channel_token_context()
                .with_signer(&[&seeds[..]]),
            1,
        )?;
        let creators = vec![anchor_token_metadata::Creator {
            address: ctx.accounts.mint_auth.key(),
            verified: true,
            share: 100,
        }];
        //create channel metadata
        anchor_token_metadata::create_metadata(
            ctx.accounts
                .into_create_channel_metadata_context()
                .with_signer(&[&seeds[..]]),
            metadata_inputs.name.clone(),
            metadata_inputs.symbol.clone(),
            metadata_inputs.uri.clone(),
            Some(creators.clone()),
            0,
            true,
            false,
        )?;
        //create subscription metadata
        anchor_token_metadata::create_metadata(
            ctx.accounts
                .into_create_subscription_metadata_context()
                .with_signer(&[&seeds[..]]),
            metadata_inputs.name,
            metadata_inputs.symbol,
            metadata_inputs.uri,
            Some(creators),
            0,
            true,
            false,
        )?;

        //set data for attribution pda's
        ctx.accounts.channel_attribution.channel = ctx.accounts.channel.key();
        ctx.accounts.channel_attribution.subscription = ctx.accounts.subscription.key();
        ctx.accounts.subscription_attribution.channel = ctx.accounts.channel.key();
        ctx.accounts.subscription_attribution.subscription = ctx.accounts.subscription.key();

        //freeze channel token supply
        token::set_authority(
            ctx.accounts
                .into_eliminate_channel_mint_authority_context()
                .with_signer(&[&seeds[..]]),
            AuthorityType::MintTokens,
            None,
        )?;
        Ok(())
    }
    pub fn subscribe(ctx: Context<Subscribe>, _mint_auth_bump: u8) -> ProgramResult {
        let (_mint_auth, bump_seed) =
            Pubkey::find_program_address(&[MINT_AUTH_SEED], ctx.program_id);
        let seeds = &[&MINT_AUTH_SEED[..], &[bump_seed]];
        //mint one subscription token to the subscriber
        token::mint_to(
            ctx.accounts
                .into_mint_subscription_context()
                .with_signer(&[&seeds[..]]),
            1,
        )?;

        Ok(())
    }
    pub fn update_metadata(ctx: Context<UpdateMetadata>, _mint_auth_bump: u8) -> ProgramResult {
        Ok(())
    }

}

#[derive(Accounts)]
#[instruction(_channel_attribution_bump: u8, _subscription_attribution_bump: u8, _mint_auth_bump: u8)]
pub struct CreateChannel<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        constraint = channel_token_account.mint == channel.key(),
        constraint = channel_token_account.amount == 0,
        constraint = channel_token_account.owner == creator.key()
    )]
    pub channel_token_account: Account<'info, token::TokenAccount>,
    #[account(
        constraint = channel.decimals == 0,
        constraint = channel.supply == 0,
        constraint = channel.freeze_authority == COption::None,
        constraint = channel.mint_authority.unwrap() == mint_auth.key(),
    )]
    pub channel: Account<'info, token::Mint>,
    #[account(
        init,
        seeds = [CHANNEL_SEED, channel.key().as_ref()],
        bump = _channel_attribution_bump,
        payer = creator.to_account_info()
    )]
    pub channel_attribution: Account<'info, Attribution>,
    #[account(mut)]
    pub channel_metadata: AccountInfo<'info>,
    #[account(
        constraint = subscription.decimals == 0,
        constraint = subscription.supply == 0,
        constraint = subscription.freeze_authority == COption::None,
        constraint = subscription.mint_authority.unwrap() == mint_auth.key(),
    )]
    pub subscription: Account<'info, token::Mint>,
    #[account(
        init,
        seeds = [CHANNEL_SEED, subscription.key().as_ref()],
        bump = _subscription_attribution_bump,
        payer = creator.to_account_info()
    )]
    pub subscription_attribution: Account<'info, Attribution>,
    #[account(mut)]
    pub subscription_metadata: AccountInfo<'info>,
    #[account(
        seeds = [MINT_AUTH_SEED],
        bump = _mint_auth_bump,
    )]
    pub mint_auth: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token::Token>,
    #[account(address = spl_token_metadata::id())]
    token_metadata_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}

//8 + 32 + 32 = 72 bytes
#[account]
#[derive(Default)]
pub struct Attribution {
    pub channel: Pubkey,
    pub subscription: Pubkey,
}
#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct MetadataInputs {
    pub name: String,
    pub symbol: String,
    pub uri: String,
}

#[derive(Accounts)]
#[instruction(_mint_auth_bump: u8)]
pub struct Subscribe<'info> {
    pub subscriber: Signer<'info>,
    #[account(
        mut,
        constraint = subscriber_token_account.mint == subscription.key(),
        constraint = subscriber_token_account.amount == 0,
        constraint = subscriber_token_account.owner == subscriber.key()
    )]
    pub subscriber_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = subscription.decimals == 0,
        constraint = subscription.freeze_authority == COption::None,
        constraint = subscription.mint_authority.unwrap() == mint_auth.key(),
    )]
    pub subscription: Account<'info, token::Mint>,
    #[account(
        seeds = [MINT_AUTH_SEED],
        bump = _mint_auth_bump,
    )]
    pub mint_auth: AccountInfo<'info>,
    pub token_program: Program<'info, token::Token>,
}

#[derive(Accounts)]
#[instruction(_mint_auth_bump: u8)]
pub struct UpdateMetadata<'info> {
    pub creator: Signer<'info>,
    #[account(
        constraint = channel.supply == 1,
    )]
    pub channel: Account<'info, token::Mint>,
    //makes sure the signer has the creator token in an account they own
    #[account(
        constraint = channel_token_account.mint == channel.key(),
        constraint = channel_token_account.owner == creator.key(),
        constraint = channel_token_account.amount == 1,
    )]
    pub channel_token_account: Account<'info, token::TokenAccount>,
    //pub channel_metadata: AccountInfo<'info>,
    pub subscription: Account<'info, token::Mint>,
    #[account(
        seeds = [MINT_AUTH_SEED],
        bump = _mint_auth_bump,
    )]
    pub mint_auth: AccountInfo<'info>,
    system_program: Program<'info, System>,
    #[account(address = spl_token_metadata::id())]
    token_metadata_program: AccountInfo<'info>,
    //check that the metadata accounts belong to the mints
}

impl<'info> CreateChannel<'info> {
    fn into_eliminate_channel_mint_authority_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, token::SetAuthority<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = token::SetAuthority {
            current_authority: self.mint_auth.to_account_info(),
            account_or_mint: self.channel.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
    fn into_mint_channel_token_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, token::MintTo<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = token::MintTo {
            mint: self.channel.to_account_info(),
            to: self.channel_token_account.to_account_info(),
            authority: self.mint_auth.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
    fn into_create_channel_metadata_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, anchor_token_metadata::CreateMetadata<'info>> {
        let cpi_program = self.token_metadata_program.to_account_info();
        let cpi_accounts = anchor_token_metadata::CreateMetadata {
            metadata: self.channel_metadata.to_account_info(),
            mint: self.channel.to_account_info(),
            mint_authority: self.mint_auth.to_account_info(),
            payer: self.creator.clone(),
            update_authority: self.mint_auth.to_account_info(),
            token_metadata_program: self.token_metadata_program.to_account_info(),
            system_program: self.system_program.clone(),
            rent: self.rent.clone(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
    fn into_create_subscription_metadata_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, anchor_token_metadata::CreateMetadata<'info>> {
        let cpi_program = self.token_metadata_program.to_account_info();
        let cpi_accounts = anchor_token_metadata::CreateMetadata {
            metadata: self.subscription_metadata.to_account_info(),
            mint: self.subscription.to_account_info(),
            mint_authority: self.mint_auth.to_account_info(),
            payer: self.creator.clone(),
            update_authority: self.mint_auth.to_account_info(),
            token_metadata_program: self.token_metadata_program.to_account_info(),
            system_program: self.system_program.clone(),
            rent: self.rent.clone(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

impl<'info> Subscribe<'info> {
    fn into_mint_subscription_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, token::MintTo<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = token::MintTo {
            mint: self.subscription.to_account_info(),
            to: self.subscriber_token_account.to_account_info(),
            authority: self.mint_auth.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
}







/*



      //ok so it worked when i passed in all the inputs but didn't call the metadata program.
      //now it's not working when i pass in the inputs and also call the metadata program
      //but it does work when don't pass any inputs and call the metadata program once (or even twice)
      //ok so it works with the metadata and everything for one tx. that's only thing in the tx
      //im thinking it must be a capacity issue bc it's doing fine




    
      */
