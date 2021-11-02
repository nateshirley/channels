import React, { useCallback, useMemo, FC } from 'react';
import { clusterApiUrl, Connection, ConfirmOptions, Commitment } from '@solana/web3.js';
import { Provider, Wallet } from '@project-serum/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { Route, Switch } from 'react-router-dom';
import Home from '../components/Home';
import Find from '../components/find/Find'
import New from '../components/New'



const ComponentSwitch: FC = () => {

    let wallet: any = useWallet()

    const getProvider = () => {
        const network = "https://lingering-lingering-mountain.solana-devnet.quiknode.pro/fbbd36836095686bd9f580212e675aaab88204c9/" //clusterApiUrl('devnet');
        let providerWallet: Wallet = wallet
        const commitment: Commitment = "processed";
        const connection = new Connection(network, commitment);
        let confirmOptions = { preflightCommitment: commitment };
        const provider = new Provider(
            connection, providerWallet, confirmOptions,
        );
        return provider;
    }

    if (wallet.connected) {
        console.log(wallet.publicKey);
    }
    return (
        <Switch>
            <Route path="/find" render={(props) => (
                <Find {...props} getProvider={getProvider} />
            )} />
            <Route path="/new" render={(props) => (
                <New {...props} getProvider={getProvider} />
            )} />
            <Route path="/" render={(props) => (
                <Home {...props} getProvider={getProvider} />
            )} />
        </Switch>
    );

}

export default ComponentSwitch;