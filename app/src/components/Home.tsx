import { Link } from 'react-router-dom';
import "../Global.css";
import homeLogo from "./../assets/channelsHome.jpeg"
import { Provider } from '@project-serum/anchor';


function Home() {
    return (
        <div className="component-parent">
            <img src={homeLogo} alt="logo" className="home-logo" />
            <div className="home-info">A friend group primitive on Solana. Make a pack and invite your friends—then stick together.</div>
            <div className="home-button-group">
                <Link to="/find" className="home-button find">find channel</Link>
                <Link to="/new" className="home-button make">start new channel</Link>
            </div>
        </div>
    );
}

export default Home;