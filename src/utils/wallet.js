
export async function connectWallet() {
  if (window.ethereum) {
      await window.ethereum.request({method: 'eth_requestAccounts'});
      window.web3 = new window.Web3('http://127.0.0.1:7545');
      return true;
    }
    return false;
}
