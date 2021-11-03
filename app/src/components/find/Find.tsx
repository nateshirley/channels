import "../../Global.css";
import { Provider } from '@project-serum/anchor';
import { useEffect, useState } from "react";
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { useHistory } from 'react-router-dom';
import bs58 from 'bs58';
import qs from "qs";
import { fetchChannelAttributionByMint, ChannelOverview, fetchChannelOverview, fetchChannelAttributionByName, fetchDataObjectAtUri, ChannelAttribution, fetchCreatedChannelsForWallet, fetchSubscriptionsForWallet } from '../../modules/findChannels'
import ChannelOverviewCard from "./ChannelOverview";
import ChannelInteractiveCard from "./ChannelInteractiveCard";
import SearchBar from './SearchBar'
import SubscriptionsForWallet from './SubscriptionsForWallet'
import { getConnection } from '../../modules/utils'
//import { TOKEN_PROGRAM_ID } from '@solana/spl-token';


const emptyChannelOverview = (): ChannelOverview => {
    return {
        name: "",
        symbol: "",
        subscriberCount: "",
        subscriberMintDisplayString: "",
        uri: ""
    }
}
const emptyAttribution = (): ChannelAttribution[] => [];

const Searches = {
    CHANNEL: "channel",
    WALLET: "wallet",
    NONE: "none"
}
const Privilege = {
    EDIT: "edit",
    SUBSCRIBE: "subscribe",
    SUBSCRIBED: "subscribed",
    NONE: "none"
}

function Find() {
    const wallet = useWallet();
    const [searchStatus, setSearchStatus] = useState(Searches.NONE);
    const history = useHistory();
    const connection = getConnection();
    const [searchText, setSearchText] = useState('');
    const [channelOverview, setChannelOverview] = useState(emptyChannelOverview());
    const [channelImageLink, setChannelImageLink] = useState("");
    const [channelAttribution, setChannelAttribution] = useState({
        creator: SystemProgram.programId,
        subscriptionMint: SystemProgram.programId
    })
    const [subscriptionsForWallet, setSubscriptionsForWallet] = useState(emptyAttribution());
    const [createdChannelsForWallet, setCreatedChannelsForWallet] = useState(emptyAttribution());
    const [channelPrivilege, setChannelPrivilege] = useState(Privilege.NONE);

    const handleSearchChange = (text: string) => {
        setSearchText(text);
    }
    const didPressSearch = async () => {
        history.push("?key=" + searchText);
        search(searchText);
    }
    const assertNewOverview = async (newAttribution: ChannelAttribution) => {
        let overview = await fetchChannelOverview(newAttribution.subscriptionMint, connection);
        if (overview) {
            setChannelOverview(overview);
            let dataObject = await fetchDataObjectAtUri(overview.uri);
            if (dataObject) {
                setChannelImageLink(dataObject.image);
            }
        }
    }

    const seeExample = () => {
        const channel5 = "Channel 5";
        history.push("?key=" + channel5);
        search(channel5);
    }

    const search = async (searchText: string) => {
        try {
            let publicKey = new PublicKey(searchText);
            let newAttribution = await fetchChannelAttributionByMint(publicKey, connection);
            if (newAttribution) {
                setSearchStatus(Searches.CHANNEL);
                setChannelAttribution(newAttribution)
                assertNewOverview(newAttribution);
            } else {
                setSearchStatus(Searches.WALLET);
                console.log("search is wallet");
                fetchCreatedChannelsForWallet(publicKey, connection).then((createdChannels) => {
                    setCreatedChannelsForWallet(createdChannels);
                    console.log(createdChannels);
                });
                fetchSubscriptionsForWallet(publicKey, connection).then((subscriptions) => {
                    setSubscriptionsForWallet(subscriptions);
                    console.log(subscriptions);
                });
            }
        } catch { //search with the name string
            let newAttribution = await fetchChannelAttributionByName(searchText, connection);
            if (newAttribution) {
                setSearchStatus(Searches.CHANNEL);
                setChannelAttribution(newAttribution)
                assertNewOverview(newAttribution);
            } else {
                setSearchStatus(Searches.NONE);
            }
        }
    }

    const didSuccessfullySubscribe = async () => {
        assertNewOverview(channelAttribution);
        if (wallet.connected && wallet.publicKey) {
            fetchSubscriptionsForWallet(wallet.publicKey, connection).then((subscriptions) => {
                setSubscriptionsForWallet(subscriptions);
            });
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
            let decoded = decodeURI(String(filtersFromParams.key));
            search(decoded);
            setSearchText(decoded);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    //determine privilege
    useEffect(() => {
        const isWalletSubscribed = () => {
            if (wallet.connected) {
                for (const attribution of subscriptionsForWallet) {
                    if (attribution.subscriptionMint.equals(channelAttribution.subscriptionMint)) {
                        return true;
                    }
                }
            }
            return false
        }
        if (wallet.connected && wallet.publicKey && (searchStatus === Searches.CHANNEL)) {
            if (channelAttribution.creator.equals(wallet.publicKey)) {
                setChannelPrivilege(Privilege.EDIT)
                return
            } else if (isWalletSubscribed()) {
                setChannelPrivilege(Privilege.SUBSCRIBED);
                return
            }
            else {
                setChannelPrivilege(Privilege.SUBSCRIBE);
                return
            }
        }
        setChannelPrivilege(Privilege.NONE);
    }, [wallet.connected, wallet.publicKey, channelAttribution, subscriptionsForWallet, searchStatus])

    useEffect(() => {
        const connection = getConnection();
        if (wallet.connected && wallet.publicKey) {
            fetchSubscriptionsForWallet(wallet.publicKey, connection).then((subscriptions) => {
                setSubscriptionsForWallet(subscriptions);
            });
        } else {
            setSubscriptionsForWallet(emptyAttribution());
        }
    }, [channelAttribution.subscriptionMint, wallet.connected, wallet.publicKey])

    const clickedChannel = () => {

    }

    //im gonna do an example that's just channel 5
    let infoCards = null;
    switch (searchStatus) {
        case Searches.CHANNEL:
            infoCards = (
                <div>
                    <ChannelOverviewCard overview={channelOverview} imageLink={channelImageLink} attribution={channelAttribution} />
                    <ChannelInteractiveCard overview={channelOverview} attribution={channelAttribution} privilege={channelPrivilege} didSuccessfullySubscribe={didSuccessfullySubscribe} />
                </div>
            )
            break;
        case Searches.WALLET:
            infoCards = (
                <div>
                    <SubscriptionsForWallet subscriptionsForWallet={subscriptionsForWallet} clickedChannel={clickedChannel} />
                </div>
            )
            break;
        default:
            infoCards = (
                <div>
                    <button onClick={seeExample}>see an example</button>
                </div>
            )
    }
    return (
        <div className="component-parent">
            <div className="component-header">Find a Channel</div>
            <SearchBar handleSearchChange={handleSearchChange} searchText={searchText} didPressSearch={didPressSearch} />
            <button className="default-button search" onClick={didPressSearch}>search</button>
            {infoCards}
        </div>
    );
}

export default Find;