require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-contract-sizer");
require("hardhat-tracer");
require("hardhat-deploy");

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      initialBaseFeePerGas: 0, // workaround from https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136 . Remove when that issue is closed.
      forking: {
        url: process.env.POLYGON_NODE_URL,
        blockNumber: 23736635,
        enabled: true,
      },
      blockGasLimit: 20000000,
      gasPrice: 30000000000,
      // accounts: [{privateKey: `0x${process.env.MAINNET_PRIVATE_KEY}`, balance: parseUnits("10000", 18).toString()}],
      saveDeployments: false,
    },
    polygon: {
      url: process.env.POLYGON_NODE_URL,
      blockGasLimit: 20000000,
      gasPrice: 40000000000,
      accounts: [`0x${process.env.MAINNET_PRIVATE_KEY}`],
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    token: "MATIC",
    gasPrice: 100, // Set to 100 GWei
    gasPriceApi:
      "https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice",
    showTimeSpent: true,
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_KEY,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
  },
  namedAccounts: {
    deployer: {
      default: "0x452181dAe31Cf9f42189df71eC64298993BEe6d3",
    },
  },
  mocha: {
    timeout: 0,
  },
};
