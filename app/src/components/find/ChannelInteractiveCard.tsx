import React, { useEffect, useState, useCallback } from "react";
import { Row, Col, Container } from "react-bootstrap";
import { ChannelOverview, ChannelAttribution } from "../../modules/findChannels"
import { Provider } from '@project-serum/anchor';

interface Props {
    overview: ChannelOverview,
    attribution: ChannelAttribution,
    privilege: string,
    getProvider: () => Provider,
}

function ChannelInteractiveCard(props: Props) {


    let body = <div></div>;

    if (props.privilege === "creation") {
        body = (
            <button>edit</button>
        );
    } else if (props.privilege === "subscribe") {
        body = (
            <button>subscribe</button>
        )
    } else {
        body = (
            <div>connect wallet to edit/subscribe</div>
        )
    }

    return (
        <div>
            {body}
        </div>
    );


}

export default ChannelInteractiveCard;