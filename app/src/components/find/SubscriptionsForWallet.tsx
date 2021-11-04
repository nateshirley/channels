import React, { useEffect, useState, useCallback } from "react";
import { Link } from 'react-router-dom';
import { Row, Col, Container } from "react-bootstrap";
import { ChannelAttributionWithName } from "../../modules/findChannels";
import { toDisplayString } from '../../modules/utils'

interface Props {
    subscriptionsForWallet: ChannelAttributionWithName[],
    clickedChannel: (name: string) => void,
}

function SubscriptionsForWallet(props: Props) {

    let channelLabels: JSX.Element[] = [];
    let channelItems: JSX.Element[] = [];
    if (props.subscriptionsForWallet.length > 0) {
        props.subscriptionsForWallet.forEach((attribution, index) => {
            let linkTo = `/find?key=${attribution.subscriptionMint.toBase58()}`
            channelLabels.push(<div key={index}>{index + 1}.</div>);
            channelItems.push((
                <div key={index}>
                    <button className="subscribed-channel" onClick={() => props.clickedChannel(attribution.name)}>{attribution.name}</button>
                </div>
            ));
        });
    } else {
        channelItems = [<div></div>]
    }
    let channels = props.subscriptionsForWallet.length === 1 ? "channel" : "channels"
    return (
        <div className="subscriptions-header">
            <Container >
                <div className="wallet-subscriptions">This wallet is subscribed to {props.subscriptionsForWallet.length} {channels}.</div>
                <Row >
                    <Col sm={2} className="member-index-labels">
                        {channelLabels}
                    </Col>
                    <Col sm={9} className="member-key-labels">
                        {channelItems}
                    </Col>
                </Row>
            </Container>
        </div>
    )
}

export default SubscriptionsForWallet;