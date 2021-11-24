import "../Global.css";
import { Provider } from '@project-serum/anchor';
import React, { useEffect, useState, useCallback } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import { useHistory } from "react-router-dom";
import { PublicKey, SystemProgram, Keypair, SYSVAR_RENT_PUBKEY, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program } from '@project-serum/anchor';
import idl from '../idl.json';
import { css } from "@emotion/react";
import MoonLoader from "react-spinners/MoonLoader";
import { createChannel, } from '../modules/newChannels'
import { getAirdropProvider, getProvider } from '../modules/utils'


const override = css`
display: block;
margin: 0 auto;
border-color: black;
`;

function New() {
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSpaceError, setShowSpaceError] = useState(false);
    const wallet = useWallet();
    const history = useHistory();
    const [didAirdrop, setDidAirdrop] = useState(0);


    const didPressCreateChannel = async () => {
        if (name.length < 1 || symbol.length < 1) {
            return
        }
        setIsLoading(true);
        const provider = getProvider(wallet);
        let tx = await createChannel(name, symbol, provider);
        console.log("create channel tx ", tx);
        //push user to details page with mint id
        let newChannel = name;
        setName('');
        setSymbol('');
        setIsLoading(false);
        history.replace("/find?key=" + newChannel);
    }

    const onKeyPress = (event: any) => {
        console.log(event);
        if (event.key === " ") {
            event.preventDefault();
            setShowSpaceError(true);
        } else {
            setShowSpaceError(false);
        }
    }

    const requestAirdrop = async () => {
        setDidAirdrop(1);
        if (wallet.publicKey) {
            let provider = getAirdropProvider(wallet);
            await provider.connection.confirmTransaction(
                await provider.connection.requestAirdrop(
                    wallet.publicKey,
                    1 * LAMPORTS_PER_SOL
                ),
                "confirmed"
            );
            setDidAirdrop(2);
        }
    }



    let body = null;
    if (!wallet.connected) {
        body = (
            <div className="home-info" style={{ marginTop: "50px" }}>
                first, select devnet wallet ↗
            </div>
        )
    } else {
        body = (
            <div>
                {showSpaceError
                    ? <div>no spaces</div>
                    : <div>&nbsp;</div>
                }
                <div>
                    <input
                        placeholder="channel name"
                        onChange={e => setName(e.target.value)}
                        value={name}
                        className="default-input"
                        onKeyPress={onKeyPress}
                    />
                </div>
                <div>
                    <input
                        placeholder="channel symbol"
                        onChange={e => setSymbol(e.target.value)}
                        value={symbol}
                        className="default-input"
                        onKeyPress={onKeyPress}
                    />
                </div>
                {isLoading
                    ? <div style={{ marginTop: "24px" }}><MoonLoader loading={true} size={31} css={override} /></div>
                    : <button className="button start-new" onClick={didPressCreateChannel}>start new channel</button>
                }
            </div>
        )
    }

    let air = null;
    if (didAirdrop === 0) {
        air = (<button className="airdrop" onClick={requestAirdrop}>(get devnet sol)</button>);
    } else if (didAirdrop === 1) {
        air = <div className="airdrop">airdropping...</div>;
    } else {
        air = <div className="airdrop">successful airdrop</div>;
    }

    return (
        <div className="component-parent">
            <div className="component-header">New Channel</div>
            {body}
            {air}
        </div>
    );
}

export default New;