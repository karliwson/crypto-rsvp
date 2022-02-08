const CryptoRSVP = artifacts.require("./CryptoRSVP.sol");

module.exports = function(deployer) {
  deployer.deploy(CryptoRSVP);
};
