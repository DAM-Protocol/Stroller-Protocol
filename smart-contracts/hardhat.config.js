require("@nomiclabs/hardhat-truffle5");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
// require("@nomiclabs/hardhat-web3");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-contract-sizer");
require("hardhat-deploy");
// require("hardhat-tracer");

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.13",
      },
    ],
    settings: {
      optimizer: {
        enabled: false, // Make it true after testing or before deployment.
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    /*
    hardhat: {
      initialBaseFeePerGas: 0, // workaround from https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136 . Remove when that issue is closed.
      forking: {
        // url: process.env.POLYGON_NODE_URL,
        // blockNumber: 23736635,
        url: process.env.MUMBAI_NODE_URL,
        blockNumber: 25426446,
        enabled: false,
      },
      saveDeployments: false,
    },

    mumbai: {
      url: process.env.MUMBAI_NODE_URL,
      accounts: [`0x${process.env.TESTNET_PRIVATE_KEY}`],
      saveDeployments: true,
    },
    rinkeby: {
      url: process.env.ROPSTEN_NODE_URL,
      accounts: [`0x${process.env.TESTNET_PRIVATE_KEY}`],
      saveDeployments: true,
    },
    */
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    token: "MATIC",
    gasPrice: 40, // Set to 40 GWei
    gasPriceApi:
      "https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice",
    showTimeSpent: true,
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_KEY, // Change this to POLYGONSCAN_KEY when deploying on Polygon mainnet or mumbai testnet.
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
  },
  namedAccounts: {
    deployer: {
      default: 0,
      137: "0x452181dAe31Cf9f42189df71eC64298993BEe6d3",
      80001: "0x917A19E71a2811504C4f64aB33c132063B5772a5",
      4: "0x917A19E71a2811504C4f64aB33c132063B5772a5",
    },
    mocha: {
        timeout: 0,
    },
};
