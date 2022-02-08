import React from 'react';
import {Container} from 'react-bootstrap';
import {connectWallet} from '../utils/wallet';

const CONTRACT_ADDRESS = '0x997A87523D22EB07E51860548b7723a8e91FA4e2';

const contractAbi = require('../contracts/CryptoRSVP.json');

function Home() {
    const test = async () => {
        const contract = new window.web3.eth.Contract(contractAbi.abi, CONTRACT_ADDRESS);
        const nEvents = await contract.methods.nEvents().call();
        console.log(nEvents);
    }

    return (
      <div className="App">
        <Container fluid style={{ padding: 0 }}>
          <button onClick={connectWallet}>Connect Wallet</button>
          <button onClick={test}></button>
        </Container>
      </div>
    );
}

export default Home;
