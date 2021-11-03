use anchor_lang::{
    prelude::*,
    solana_program::{borsh::try_from_slice_unchecked, program_option::COption},
};
use anchor_spl::token;
use anchor_token_metadata;
use spl_token::instruction::AuthorityType;
use spl_token_metadata;

declare_id!("DoFrvHMqrtWmkqnsG61c3myUE5QZkNCCXVaWi7a7PuiG");
const MINT_AUTH_SEED: &[u8] = b"authority";
const CHANNEL_ATTRIBUTION_SEED: &[u8] = b"channel";

#[program]
pub mod channels {
    use super::*;
    pub fn create_channel(
        ctx: Context<CreateChannel>,
        _creation_attribution_bump: u8,
        _subscription_attribution_bump: u8,
        _mint_auth_bump: u8,
        _name_attribution_bump: u8,
        name: String,
        symbol: String,
        uri: String,
    ) -> ProgramResult {
        let seeds = &[&MINT_AUTH_SEED[..], &[_mint_auth_bump]];

        //mint one creation token to creator
        token::mint_to(
            ctx.accounts
                .into_mint_creation_token_context()
                .with_signer(&[&seeds[..]]),
            1,
        )?;
        let creators = vec![spl_token_metadata::state::Creator {
            address: ctx.accounts.mint_auth.key(),
            verified: true,
            share: 100,
        }];
        //creation metadata
        anchor_token_metadata::create_metadata(
            ctx.accounts
                .into_create_creation_metadata_context()
                .with_signer(&[&seeds[..]]),
            name.clone(),
            symbol.clone(),
            uri.clone(),
            Some(creators.clone()),
            0,
            true,
            true,
        )?;
        //create subscription metadata
        anchor_token_metadata::create_metadata(
            ctx.accounts
                .into_create_subscription_metadata_context()
                .with_signer(&[&seeds[..]]),
            name,
            symbol,
            uri,
            Some(creators),
            0,
            true,
            true,
        )?;

        //set data for mint attribution
        ctx.accounts.creation_attribution.creation_mint = ctx.accounts.creation_mint.key();
        ctx.accounts.creation_attribution.subscription_mint = ctx.accounts.subscription_mint.key();
        ctx.accounts.subscription_attribution.creation_mint = ctx.accounts.creation_mint.key();
        ctx.accounts.subscription_attribution.subscription_mint =
            ctx.accounts.subscription_mint.key();

        //set data for name attribution
        ctx.accounts.name_attribution.creation_mint = ctx.accounts.creation_mint.key();
        ctx.accounts.name_attribution.subscription_mint = ctx.accounts.subscription_mint.key();

        //mark both accounts w/ primary sale happened to avoid confusion on seller fees
        anchor_token_metadata::update_metadata(
            ctx.accounts
                .into_update_creation_metadata_context()
                .with_signer(&[&seeds[..]]),
            None,
            None,
            Some(true),
        )?;
        anchor_token_metadata::update_metadata(
            ctx.accounts
                .into_update_subscription_metadata_context()
                .with_signer(&[&seeds[..]]),
            None,
            None,
            Some(true),
        )?;

        //freeze channel token supply
        token::set_authority(
            ctx.accounts
                .into_eliminate_creation_mint_authority_context()
                .with_signer(&[&seeds[..]]),
            AuthorityType::MintTokens,
            None,
        )?;
        Ok(())
    }
    pub fn subscribe(ctx: Context<Subscribe>, _mint_auth_bump: u8) -> ProgramResult {
        let seeds = &[&MINT_AUTH_SEED[..], &[_mint_auth_bump]];
        //mint one subscription token to the subscriber
        token::mint_to(
            ctx.accounts
                .into_mint_subscription_context()
                .with_signer(&[&seeds[..]]),
            1,
        )?;
        Ok(())
    }
    pub fn update_channel_metadata(
        ctx: Context<UpdateChannelMetadata>,
        _mint_auth_bump: u8,
        _subscription_attribution_bump: u8,
        uri: String,
    ) -> ProgramResult {
        let seeds = &[&MINT_AUTH_SEED[..], &[_mint_auth_bump]];

        let existing_metadata: spl_token_metadata::state::Metadata =
            try_from_slice_unchecked(&ctx.accounts.creation_metadata.data.borrow()).unwrap();
        let mut new_data: spl_token_metadata::state::Data = existing_metadata.data;
        new_data.uri = uri;

        anchor_token_metadata::update_metadata(
            ctx.accounts
                .into_update_creation_metadata_context()
                .with_signer(&[&seeds[..]]),
            None,
            Some(new_data.clone()),
            None,
        )?;
        anchor_token_metadata::update_metadata(
            ctx.accounts
                .into_update_subscription_metadata_context()
                .with_signer(&[&seeds[..]]),
            None,
            Some(new_data),
            None,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(_creation_attribution_bump: u8, _subscription_attribution_bump: u8, _mint_auth_bump: u8, _name_attribution_bump: u8, name: String)]
pub struct CreateChannel<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        constraint = creation_token_account.mint == creation_mint.key(),
        constraint = creation_token_account.amount == 0,
        constraint = creation_token_account.owner == creator.key()
    )]
    pub creation_token_account: Account<'info, token::TokenAccount>,
    #[account(
        constraint = creation_mint.decimals == 0,
        constraint = creation_mint.supply == 0,
        constraint = creation_mint.freeze_authority == COption::None,
        constraint = creation_mint.mint_authority.unwrap() == mint_auth.key(),
    )]
    pub creation_mint: Account<'info, token::Mint>,
    #[account(
        init,
        seeds = [CHANNEL_ATTRIBUTION_SEED, creation_mint.key().as_ref()],
        bump = _creation_attribution_bump,
        payer = creator.to_account_info()
    )]
    pub creation_attribution: Account<'info, ChannelAttribution>,
    //gets validated in the token metadata program
    #[account(mut)]
    pub creation_metadata: AccountInfo<'info>,
    #[account(
        constraint = subscription_mint.decimals == 0,
        constraint = subscription_mint.supply == 0,
        constraint = subscription_mint.freeze_authority == COption::None,
        constraint = subscription_mint.mint_authority.unwrap() == mint_auth.key(),
    )]
    pub subscription_mint: Account<'info, token::Mint>,
    #[account(
        init,
        seeds = [CHANNEL_ATTRIBUTION_SEED, subscription_mint.key().as_ref()],
        bump = _subscription_attribution_bump,
        payer = creator.to_account_info()
    )]
    pub subscription_attribution: Account<'info, ChannelAttribution>,
    //gets validated in the token metadata program
    #[account(mut)]
    pub subscription_metadata: AccountInfo<'info>,
    #[account(
        init,
        seeds = [name.as_bytes()],
        bump = _name_attribution_bump,
        payer = creator.to_account_info()
    )]
    pub name_attribution: Account<'info, ChannelAttribution>,
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
pub struct ChannelAttribution {
    pub creation_mint: Pubkey,
    pub subscription_mint: Pubkey,
}

#[derive(Accounts)]
#[instruction(_mint_auth_bump: u8)]
pub struct Subscribe<'info> {
    pub subscriber: Signer<'info>,
    #[account(
        mut,
        constraint = subscriber_token_account.mint == subscription_mint.key(),
        constraint = subscriber_token_account.amount == 0,
        constraint = subscriber_token_account.owner == subscriber.key()
    )]
    pub subscriber_token_account: Account<'info, token::TokenAccount>,
    #[account(
        mut,
        constraint = subscription_mint.decimals == 0,
        constraint = subscription_mint.freeze_authority == COption::None,
        constraint = subscription_mint.mint_authority.unwrap() == mint_auth.key(),
    )]
    pub subscription_mint: Account<'info, token::Mint>,
    #[account(
        seeds = [MINT_AUTH_SEED],
        bump = _mint_auth_bump,
    )]
    pub mint_auth: AccountInfo<'info>,
    pub token_program: Program<'info, token::Token>,
}

#[derive(Accounts)]
#[instruction(_mint_auth_bump: u8, _subscription_attribution_bump: u8)]
pub struct UpdateChannelMetadata<'info> {
    pub creator: Signer<'info>,
    #[account(
        constraint = creation_mint.supply == 1,
    )]
    pub creation_mint: Account<'info, token::Mint>,
    //the signer must own a creator token account with 1 token
    #[account(
        constraint = creation_token_account.mint == creation_mint.key(),
        constraint = creation_token_account.owner == creator.key(),
        constraint = creation_token_account.amount == 1,
    )]
    pub creation_token_account: Account<'info, token::TokenAccount>,
    //validated by metadata program
    #[account(mut)]
    pub creation_metadata: AccountInfo<'info>,
    pub subscription_mint: Account<'info, token::Mint>,
    #[account(
        seeds = [CHANNEL_ATTRIBUTION_SEED, subscription_mint.key().as_ref()],
        bump = _subscription_attribution_bump,
        constraint = subscription_attribution.creation_mint == creation_mint.key(),
        constraint = subscription_attribution.subscription_mint == subscription_mint.key(),
    )]
    pub subscription_attribution: Account<'info, ChannelAttribution>,
    //validated by metadata program -- it will check that the metadata matches the mint  //https://github.com/metaplex-foundation/metaplex/blob/master/rust/token-metadata/program/src/utils.rs#L828
    #[account(mut)]
    pub subscription_metadata: AccountInfo<'info>,
    #[account(
        seeds = [MINT_AUTH_SEED],
        bump = _mint_auth_bump,
    )]
    pub mint_auth: AccountInfo<'info>,
    system_program: Program<'info, System>,
    #[account(address = spl_token_metadata::id())]
    token_metadata_program: AccountInfo<'info>,
}

impl<'info> CreateChannel<'info> {
    fn into_eliminate_creation_mint_authority_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, token::SetAuthority<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = token::SetAuthority {
            current_authority: self.mint_auth.to_account_info(),
            account_or_mint: self.creation_mint.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
    fn into_mint_creation_token_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, token::MintTo<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = token::MintTo {
            mint: self.creation_mint.to_account_info(),
            to: self.creation_token_account.to_account_info(),
            authority: self.mint_auth.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
    fn into_create_creation_metadata_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, anchor_token_metadata::CreateMetadata<'info>> {
        let cpi_program = self.token_metadata_program.to_account_info();
        let cpi_accounts = anchor_token_metadata::CreateMetadata {
            metadata: self.creation_metadata.to_account_info(),
            mint: self.creation_mint.to_account_info(),
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
            mint: self.subscription_mint.to_account_info(),
            mint_authority: self.mint_auth.to_account_info(),
            payer: self.creator.clone(),
            update_authority: self.mint_auth.to_account_info(),
            token_metadata_program: self.token_metadata_program.to_account_info(),
            system_program: self.system_program.clone(),
            rent: self.rent.clone(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
    fn into_update_creation_metadata_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, anchor_token_metadata::UpdateMetadataAccount<'info>> {
        let cpi_program = self.token_metadata_program.to_account_info();
        let cpi_accounts = anchor_token_metadata::UpdateMetadataAccount {
            metadata: self.creation_metadata.to_account_info(),
            update_authority: self.mint_auth.to_account_info(),
            token_metadata_program: self.token_metadata_program.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
    fn into_update_subscription_metadata_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, anchor_token_metadata::UpdateMetadataAccount<'info>> {
        let cpi_program = self.token_metadata_program.to_account_info();
        let cpi_accounts = anchor_token_metadata::UpdateMetadataAccount {
            metadata: self.subscription_metadata.to_account_info(),
            update_authority: self.mint_auth.to_account_info(),
            token_metadata_program: self.token_metadata_program.to_account_info(),
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
            mint: self.subscription_mint.to_account_info(),
            to: self.subscriber_token_account.to_account_info(),
            authority: self.mint_auth.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

impl<'info> UpdateChannelMetadata<'info> {
    fn into_update_creation_metadata_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, anchor_token_metadata::UpdateMetadataAccount<'info>> {
        let cpi_program = self.token_metadata_program.to_account_info();
        let cpi_accounts = anchor_token_metadata::UpdateMetadataAccount {
            metadata: self.creation_metadata.to_account_info(),
            update_authority: self.mint_auth.to_account_info(),
            token_metadata_program: self.token_metadata_program.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
    fn into_update_subscription_metadata_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, anchor_token_metadata::UpdateMetadataAccount<'info>> {
        let cpi_program = self.token_metadata_program.to_account_info();
        let cpi_accounts = anchor_token_metadata::UpdateMetadataAccount {
            metadata: self.subscription_metadata.to_account_info(),
            update_authority: self.mint_auth.to_account_info(),
            token_metadata_program: self.token_metadata_program.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

/*


*/
