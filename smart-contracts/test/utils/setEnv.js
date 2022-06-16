/* eslint-disable no-unused-vars */
/* eslint-disable node/no-extraneous-require */
/* eslint-disable no-undef */

const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const ISuperTokenFactory = require("@superfluid-finance/ethereum-contracts/build/contracts/ISuperTokenFactory");
const ISuperfluid = require("@superfluid-finance/ethereum-contracts/build/contracts/ISuperfluid");
const IConstantFlowAgreementV1 = require("@superfluid-finance/ethereum-contracts/build/contracts/IConstantFlowAgreementV1");
const ISuperToken = require("@superfluid-finance/ethereum-contracts/build/contracts/ISuperToken");
const TestToken = require("@superfluid-finance/ethereum-contracts/build/contracts/TestToken");
const NativeSuperTokenProxy = require("@superfluid-finance/ethereum-contracts/build/contracts/NativeSuperTokenProxy");
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deployTestToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-test-token");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");

const errorHandler = (err) => {
  if (err) throw err;
};

const deploySuperfluid = async (account) => {
  // Deploy SF and needed tokens
  await deployFramework(errorHandler, {
    web3,
    from: account.address,
    newTestResolver: true,
  });
  await deployTestToken(errorHandler, [":", "fDAI"], {
    web3,
    from: account.address,
  });
  await deploySuperToken(errorHandler, [":", "fDAI"], {
    web3,
    from: account.address,
  });
  sf = new SuperfluidSDK.Framework({
    web3,
    version: "test",
    tokens: ["fDAI"],
  });
  await sf.initialize();

  const superTokenFactoryAddress = await sf.host.getSuperTokenFactory();
  superTokenFactory = new ethers.Contract(
    superTokenFactoryAddress,
    ISuperTokenFactory.abi,
    account
  );
  const tokenProxyFactory = new ethers.ContractFactory(
    NativeSuperTokenProxy.abi,
    NativeSuperTokenProxy.bytecode,
    account
  );
  const _native = await tokenProxyFactory.deploy();
  await _native.initialize("abc", "abc", "1");
  await superTokenFactory.initializeCustomSuperToken(_native.address);
  nativeToken = new ethers.Contract(_native.address, ISuperToken.abi, account);

  return {
    sf: sf,
    superTokenFactory: superTokenFactory,
    nativeToken: nativeToken,
    interfaces: {
      ISuperfluid: ISuperfluid,
      IConstantFlowAgreementV1: IConstantFlowAgreementV1,
      ISuperToken: ISuperToken,
      TestToken:TestToken,
    }
  };
}

module.exports = {
    deploySuperfluid
}
