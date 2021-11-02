import "../../Global.css";
import { Provider, utils } from '@project-serum/anchor';
import React, { useEffect, useState, useCallback } from "react";
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { useHistory } from 'react-router-dom';
import bs58 from 'bs58';
import { getAttributionAddress, getChannelAttribtion } from '../../modules/channels'

import SearchBar from './SearchBar'
import { publicKey } from "@project-serum/anchor/dist/cjs/utils";


interface GetProvider {
    getProvider: () => Provider
}
const Searches = {
    SUBSCRIPTION: "subscription",
    CREATOR: "creator",
    WALLET: "wallet",
    NONE: "none"
}

function Find(props: GetProvider) {
    const wallet = useWallet();
    const getProvider = props.getProvider;
    const [searchStatus, setSearchStatus] = useState(Searches.NONE);
    const history = useHistory();
    const [searchText, setSearchText] = useState('');

    const handleSearchChange = (text: string) => {
        setSearchText(text);
    }
    const didPressSearch = async () => {
        history.push("?key=" + searchText);
        search(searchText);
    }
    const search = async (searchText: string) => {
        let decoded = bs58.decode(searchText);
        if (decoded.length === 32) {
            let publicKey = new PublicKey(searchText);
            let channelAttribution = await getChannelAttribtion(publicKey, getProvider().connection);
            if (channelAttribution) {
                let [tokenType, attribution] = channelAttribution;
                setSearchStatus(tokenType);
                console.log("token is ", tokenType);
            } else {
                setSearchStatus(Searches.WALLET);
                console.log("search is wallet");
                //fetchPackMintsForWallet(publicKey);
            }
        } else {
            console.log("not searching bc query doesn't match type")
        }
    }


    let infoCards = null;
    switch (searchStatus) {
        case Searches.SUBSCRIPTION || Searches.CREATOR:
            infoCards = (
                <div>

                </div>
            )
            break;
        case Searches.WALLET:
            infoCards = (
                <div>
                </div>
            )
            break;
        default:
            // if (randomPacks.length > 0) {

            //     )
            // } else {
            infoCards = (
                <div>

                </div>
            )
        //}

        //add show random packs
    }
    return (
        <div className="component-parent">
            <div className="component-header">Find a Pack</div>
            <SearchBar handleSearchChange={handleSearchChange} searchText={searchText} />
            <button className="default-button search" onClick={didPressSearch}>search</button>
            {infoCards}
        </div>
    );
}

export default Find;