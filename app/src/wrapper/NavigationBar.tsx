import { useWallet } from '@solana/wallet-adapter-react';
import { Link } from 'react-router-dom';
import { WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import React, { FC } from 'react';
import logo from "../assets/channels-nav.png"
import "./wrapper.css"

const NavigationBar: FC = () => {
    const { wallet } = useWallet();

    let connectStyle = {
        color: "black",
        backgroundColor: "white",
        border: '2px solid rgba(0, 0, 0, 1)',
        fontFamily: "IBM Plex Sans",
        fontWeight: 600
    }

    return (
        <nav className="navbar">
            <Link to="/"><img src={logo} alt="home" className="logo" /></Link>
            <div >
                {/* <Link to="/make">+make</Link> */}
                <WalletMultiButton style={connectStyle} />
                {wallet && <WalletDisconnectButton style={connectStyle} />}
            </div>
        </nav>
    );
};

export default NavigationBar;
