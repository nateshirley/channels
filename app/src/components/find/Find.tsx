import "../../Global.css";
import { Provider } from '@project-serum/anchor';
import { useEffect, useState } from "react";
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { useHistory } from 'react-router-dom';
import bs58 from 'bs58';
import qs from "qs";
import { fetchChannelAttribtion, fetchChannelTokensForWallet, fetchChannelCreator, ChannelOverview, ChannelTokens, fetchChannelOverview, fetchDataObjectAtUri } from '../../modules/findChannels'
import ChannelOverviewCard from "./ChannelOverview";
import ChannelInteractiveCard from "./ChannelInteractiveCard";
import SearchBar from './SearchBar'
//import { TOKEN_PROGRAM_ID } from '@solana/spl-token';


interface GetProvider {
    getProvider: () => Provider
}

const emptyChannelOverview = (): ChannelOverview => {
    return {
        name: "",
        symbol: "",
        subscriberCount: "",
        subscriberMintDisplayString: "",
        uri: ""
    }
}
const emptyChannelTokens = (): ChannelTokens => {
    return {
        creationTokens: [],
        subscriptionTokens: []
    }
}
const Searches = {
    SUBSCRIPTION: "subscription",
    CREATION: "creation",
    WALLET: "wallet",
    NONE: "none"
}
const Privilege = {
    EDIT: "edit",
    SUBSCRIBE: "subscribe",
    NONE: "none"
}

function Find(props: GetProvider) {
    const wallet = useWallet();
    const getProvider = props.getProvider;
    const [searchStatus, setSearchStatus] = useState(Searches.NONE);
    const history = useHistory();
    const [searchText, setSearchText] = useState('');
    const [channelOverview, setChannelOverview] = useState(emptyChannelOverview());
    const [channelImageLink, setChannelImageLink] = useState("");
    const [channelCreator, setChannelCreator] = useState(SystemProgram.programId)
    const [channelAttribution, setChannelAttribution] = useState({
        creator: SystemProgram.programId,
        subscriptionMint: SystemProgram.programId
    })
    const [channelTokensForWallet, setChannelTokensForWallet] = useState(emptyChannelTokens())
    const [channelPrivilege, setChannelPrivilege] = useState(Privilege.NONE);

    const handleSearchChange = (text: string) => {
        setSearchText(text);
    }
    const didPressSearch = async () => {
        history.push("?key=" + searchText);
        search(searchText);
    }
    const search = async (searchText: string) => {
        const provider = getProvider();
        let decoded = bs58.decode(searchText);
        //if u can decode it in 32, search by creator wallet, otherwise do it by the name
        if (decoded.length === 32) {
            let publicKey = new PublicKey(searchText);
            let channelAttribution = await fetchChannelAttribtion(publicKey, provider.connection);
            if (channelAttribution) {
                let [tokenType, attribution] = channelAttribution;
                setSearchStatus(tokenType);
                setChannelAttribution({
                    creator: attribution.creator,
                    subscriptionMint: attribution.subscriptionMint
                })
                let overview = await fetchChannelOverview(attribution.subscriptionMint, provider.connection);
                if (overview) {
                    setChannelOverview(overview);
                    let dataObject = await fetchDataObjectAtUri(overview.uri);
                    if (dataObject) {
                        setChannelImageLink(dataObject.image);
                    }
                }
                let creator = await fetchChannelCreator(attribution.creator, provider.connection);
                if (creator) {
                    setChannelCreator(creator);
                }
            } else {
                setSearchStatus(Searches.WALLET);
                console.log("search is wallet");
                let channelTokens = await fetchChannelTokensForWallet(publicKey, provider.connection);
                setChannelTokensForWallet(channelTokens);
                console.log(channelTokens);
            }
        } else {
            console.log("not searching bc query doesn't match type")
        }
    }

    //redo the search if user presses back. should probably be in state, but fuck it
    useEffect(() => {
        return history.listen(location => {
            if (history.action === 'POP') {
                console.log('back button pressed')
                const filterParams = history.location.search.substr(1);
                const filtersFromParams = qs.parse(filterParams);
                if (filtersFromParams.key) {
                    let publicKey = String(filtersFromParams.key)
                    let decoded = bs58.decode(publicKey);
                    if (decoded.length === 32) {
                        search(publicKey);
                        setSearchText(publicKey);
                    }
                }
            }
        })
    })

    //this parses the url on first render and does a search if it finds a valid key in url params
    useEffect(() => {
        const filterParams = history.location.search.substr(1);
        const filtersFromParams = qs.parse(filterParams);
        if (filtersFromParams.key) {
            let searchKey = String(filtersFromParams.key)
            let decoded = bs58.decode(searchKey);
            if (decoded.length === 32) {
                search(searchKey);
                setSearchText(searchKey);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    //determine privilege
    useEffect(() => {
        const isWalletSubscriber = () => {
            if (wallet.connected) {
                channelTokensForWallet.subscriptionTokens.forEach((token) => {
                    if (token.mint.equals(channelAttribution.subscriptionMint)) {
                        return true;
                    }
                });
            }
            return false
        }
        if (wallet.connected && (searchStatus === Searches.SUBSCRIPTION || searchStatus === Searches.CREATION)) {
            if (wallet.publicKey && channelCreator.equals(wallet.publicKey)) {
                setChannelPrivilege(Privilege.EDIT)
                return
            } else if (isWalletSubscriber()) {
                setChannelPrivilege(Privilege.NONE);
                return
            } else {
                setChannelPrivilege(Privilege.SUBSCRIBE);
                return
            }
        }
        setChannelPrivilege(Privilege.NONE);
    }, [wallet.connected, wallet.publicKey, channelAttribution, channelTokensForWallet, channelCreator, searchStatus])



    let infoCards = null;
    switch (searchStatus) {
        case Searches.CREATION:
            infoCards = (
                <div>
                    <ChannelOverviewCard overview={channelOverview} imageLink={channelImageLink} attribution={channelAttribution} />
                    <ChannelInteractiveCard overview={channelOverview} attribution={channelAttribution} privilege={channelPrivilege} getProvider={getProvider} />
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
            <div className="component-header">Find a Channel</div>
            <SearchBar handleSearchChange={handleSearchChange} searchText={searchText} />
            <button className="default-button search" onClick={didPressSearch}>search</button>
            {infoCards}
        </div>
    );
}

export default Find;