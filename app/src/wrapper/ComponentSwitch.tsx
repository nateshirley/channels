import React, { useCallback, useMemo, FC } from 'react';
import { clusterApiUrl, Connection, ConfirmOptions, Commitment } from '@solana/web3.js';
import { Provider, Wallet } from '@project-serum/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { Route, Switch } from 'react-router-dom';
import Home from '../components/Home';
import Find from '../components/find/Find'
import New from '../components/New'



const ComponentSwitch: FC = () => {


    return (
        <Switch>
            <Route path="/find" render={(props) => (
                <Find />
            )} />
            <Route path="/new" render={(props) => (
                <New />
            )} />
            <Route path="/" render={(props) => (
                <Home />
            )} />
        </Switch>
    );

}

export default ComponentSwitch;