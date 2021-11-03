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

    //make it subscribe

    let body = <div></div>;
    console.log(props.privilege, "!!!!!")
    if (props.privilege === "edit") {
        body = (
            <button>edit -- u created this</button>
        );
    } else if (props.privilege === "subscribe") {
        body = (
            <button>subscribe</button>
        )
    } else if (props.privilege === "subscribed") {
        body = (
            <button>u already subscribed to this</button>
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