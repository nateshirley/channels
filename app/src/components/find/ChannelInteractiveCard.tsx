import React, { useEffect, useState, useCallback } from "react";
import { Row, Col, Container } from "react-bootstrap";
import { ChannelOverview, ChannelAttribution } from "../../modules/findChannels"
import { Provider } from '@project-serum/anchor';
import { subscribeToChannel } from "../../modules/interactWithChannels"
import { useWallet, WalletContextState } from '@solana/wallet-adapter-react';
import { getProvider } from '../../modules/utils'

interface Props {
    overview: ChannelOverview,
    attribution: ChannelAttribution,
    privilege: string,
    didSuccessfullySubscribe: () => Promise<void>
}

function ChannelInteractiveCard(props: Props) {
    //make it subscribe
    const wallet = useWallet()
    const didPressSubscribe = async () => {
        let tx = await subscribeToChannel(props.attribution.subscriptionMint, getProvider(wallet));
        props.didSuccessfullySubscribe();
        console.log("subscribe success with signature: ", tx);
    }

    let body = <div></div>;
    if (props.privilege === "edit") {
        body = (
            <div>
                <div>u created this channel</div>
                <div>(edit/transfer ownership coming soon)</div>
            </div>
        );
    } else if (props.privilege === "subscribe") {
        body = (
            <button onClick={didPressSubscribe}>subscribe</button>
        )
    } else if (props.privilege === "subscribed") {
        //should do button with check or someth
        body = (
            <div>you are a subscriber</div>
        )
    } else {
        body = (
            <div>connect wallet to subscribe</div>
        )
    }

    return (
        <div>
            {body}
        </div>
    );


}

export default ChannelInteractiveCard;