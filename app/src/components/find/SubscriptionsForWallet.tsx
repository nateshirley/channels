import React, { useEffect, useState, useCallback } from "react";
import { Link } from 'react-router-dom';
import { Row, Col, Container } from "react-bootstrap";
import { ChannelAttribution } from "../../modules/findChannels";
import { toDisplayString } from '../../modules/utils'

interface Props {
    subscriptionsForWallet: ChannelAttribution[],
    clickedChannel: () => void,
}

function SubscriptionsForWallet(props: Props) {

    let channelLabels: JSX.Element[] = [];
    let channelItems: JSX.Element[] = [];
    if (props.subscriptionsForWallet.length > 0) {
        props.subscriptionsForWallet.forEach((attribution, index) => {
            let mintString = toDisplayString(attribution.subscriptionMint);
            let linkTo = `/find?key=${attribution.subscriptionMint.toBase58()}`
            channelLabels.push(<div key={index}>{index + 1}.</div>);
            channelItems.push((
                <div key={index}>
                    <Link to={linkTo} onClick={() => props.clickedChannel()}>{mintString}</Link>
                </div>
            ));
        });
    } else {
        channelItems = [<div></div>]
    }
    let channels = props.subscriptionsForWallet.length === 1 ? "channel" : "channels"
    return (
        <div className="members-header">
            Wallet Packs
            <Container className="members-card">
                <div className="packs-count">This wallet is subscribed to {props.subscriptionsForWallet.length} {channels}.</div>
                <Row>
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