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
                enabled: false,
                runs: 200,
            },
        },
    },
    // networks: {
    //   hardhat: {
    //     initialBaseFeePerGas: 0, // workaround from https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136 . Remove when that issue is closed.
    //     forking: {
    //       url: process.env.POLYGON_NODE_URL,
    //       blockNumber: 23736635,
    //       // url: process.env.MUMBAI_NODE_URL,
    //       // blockNumber: 24603240,
    //       enabled: true,
    //     },
    //     blockGasLimit: 20000000,
    //     gasPrice: 30000000000,
    //     saveDeployments: false,
    //   },
    //   polygon: {
    //     url: process.env.POLYGON_NODE_URL,
    //     blockGasLimit: 20000000,
    //     gasPrice: 40000000000,
    //     accounts: [`0x${process.env.MAINNET_PRIVATE_KEY}`],
    //     saveDeployments: true,
    //   },
    //   mumbai: {
    //     url: process.env.MUMBAI_NODE_URL,
    //     accounts: [`0x${process.env.TESTNET_PRIVATE_KEY}`],
    //     saveDeployments: true,
    //   },
    // },
    gasReporter: {
        enabled: true,
        currency: "USD",
        token: "MATIC",
        gasPrice: 40, // Set to 40 GWei
        gasPriceApi: "https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice",
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
            default: 0,
            137: "0x452181dAe31Cf9f42189df71eC64298993BEe6d3",
            80001: "0x917A19E71a2811504C4f64aB33c132063B5772a5",
        },
    },
    mocha: {
        timeout: 0,
    },
};
