import "../Global.css";
import { Provider } from '@project-serum/anchor';
import React, { useEffect, useState, useCallback } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import { useHistory } from "react-router-dom";
import { PublicKey, SystemProgram, Keypair, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { Program } from '@project-serum/anchor';
import idl from '../idl.json';
import { css } from "@emotion/react";
import MoonLoader from "react-spinners/MoonLoader";
import { createChannel, } from '../modules/newChannels'
import { decodeAttribution, fetchCreatedChannelsForWallet } from "../modules/findChannels";
import { getProvider } from '../modules/utils'


const override = css`
display: block;
margin: 0 auto;
border-color: black;
`;

function New() {
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const wallet = useWallet();
    const history = useHistory();


    const didPressCreateChannel = async () => {
        if (name.length < 1 || symbol.length < 1) {
            return
        }
        setIsLoading(true);
        const provider = getProvider(wallet);
        let tx = await createChannel(name, symbol, provider);
        console.log("create channel tx ", tx);
        //push user to pack details page with mint id
        history.replace("/find?key=" + name)
        setName('');
        setSymbol('');
        setIsLoading(false);
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
                <div>
                    <input
                        placeholder="channel name"
                        onChange={e => setName(e.target.value)}
                        value={name}
                        className="default-input"
                    />
                </div>
                <div>
                    <input
                        placeholder="channel symbol"
                        onChange={e => setSymbol(e.target.value)}
                        value={symbol}
                        className="default-input"
                    />
                </div>
                {isLoading
                    ? <div style={{ marginTop: "24px" }}><MoonLoader loading={true} size={31} css={override} /></div>
                    : <button className="default-button make" onClick={didPressCreateChannel}>start new channel</button>
                }
            </div>
        )
    }

    return (
        <div className="component-parent">
            <div className="component-header">New Channel</div>
            {body}
        </div>
    );
}

export default New;