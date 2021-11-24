import { Link } from 'react-router-dom';
import "../Global.css";
import homeLogo from "./../assets/channels-home.png"
import { Provider } from '@project-serum/anchor';


function Home() {
    return (
        <div>
            <img src={homeLogo} alt="logo" className="home-logo" />
            <div className="component-parent">
                <div className="home-info">Wallet relationships on Solana. Start a channel and subscribe to friends.</div>
                <div className="home-button-group">
                    <Link to="/find" className="button home find">find a channel</Link>
                    <Link to="/new" className="button home start">start a channel</Link>
                </div>
                <div className="home-subheader">Wait, what?</div>
                <div className="home-body">
                    Channels is an on-chain friend graph for Solana.
                    <br />
                    <br />
                    Every channel has a unique name that connects its creator to a token. Once a channel is created, anyone can subscribe by minting its token.
                    <br />
                    <br />
                    Channel tokens represent connections to their creator. If you hold the channel's token, you're subscribed to its creator.
                    <br />
                    <br />
                    This makes it easy to subscribe to friends’ wallets or build an audience of your own. And since everything is on-chain, any app can find the wallets you’ve subscribed to and use them to make their product cooler. For example, to show you some of your friends' transactions.
                    <br />
                    <br />
                    When your friends are on-chain, you can take them wherever you go…
                </div>
            </div>
        </div>
    );
}

export default Home;

/*

When channels are created, on-chain data connects the creator's wallet to a unique subscriber token.
Then, anyone can search for the channel and mint its tokens, becoming a subscriber.
Channels bring wallet relationships on-chain, making them available to everyone.


Channels use on-chain data to connect their creator's wallet to a unique subscriber token.



Channels uses on-chain data to link a creator's wallet to a unique subscriber token.
Then, anyone can search for the channel and mint its tokens, subscribing to its creator.
Channels brings wallet relationships on-chain, making them available to everyone.

Channels use on-chain data to link their creator's wallet to a unique subscriber token.
Then, anyone can search for the channel and mint its tokens, subscribing to its creator.
Channels bring wallet relationships on-chain, making them available to everyone.


Channels link their creator's wallet to a unique subscriber token.
Anyone can search for a channel and mint its tokens, subscribing to their creator.
Channels bring wallet relationships on-chain, making them available to everyone.

Channels link their creator's wallet to a unique subscriber token.
Once a channel is created, anyone can search its name and mint its tokens, subscribing to the creator.
Channels bring wallet relationships on-chain, making them available to everyone.

Channels link their creator's wallet to a unique subscriber token.
Once a channel is created, anyone can subscribe by minting the channel's token.
Channels bring wallet relationships on-chain, making them available to everyone.

github, yellowshop link
*/