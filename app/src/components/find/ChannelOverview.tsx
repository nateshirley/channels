import React, { useEffect, useState, useCallback } from "react";
import { Row, Col, Container } from "react-bootstrap";
import { ChannelOverview, ChannelAttribution } from "../../modules/channels"

interface Props {
    overview: ChannelOverview,
    attribution: ChannelAttribution,
    imageLink: string
}

function ChannelOverviewCard(props: Props) {

    let image = null;
    if (props.imageLink.length > 0) {
        image = <img src={props.imageLink} alt="pack avatar" style={{ height: '100%', width: '100%', marginLeft: '11px' }} />
    } else {
        image = <div />
    }

    return (
        <div>
            <div className="overview-header">Overview</div>
            <Container className="overview-card">
                <Row>
                    <Col xs={4}>{image}</Col>
                    <Col xs={3} className="overview-labels">
                        <div>name</div>
                        <div>symbol</div>
                        <div>members</div>
                        <div>token mint</div>
                    </Col>
                    <Col xs={5}>
                        <div className="overview-row">{props.overview.name}</div>
                        <div className="overview-row">{props.overview.symbol}</div>
                        <div className="overview-row">{props.overview.subscriberCount}</div>
                        <a href={`https://solscan.io/token/${props.attribution.subscriptionMint}?cluster=devnet`} className="overview-row"
                            target="_blank" rel="noreferrer noopener">{props.overview.subscriberMintDisplayString}</a>
                    </Col>
                </Row>
            </Container>
        </div>
    );


}

export default ChannelOverviewCard;