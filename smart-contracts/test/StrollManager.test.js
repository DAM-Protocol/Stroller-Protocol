/* eslint-disable no-unused-vars */
/* eslint-disable node/no-extraneous-require */
/* eslint-disable no-undef */

const { parseUnits } = require("@ethersproject/units");
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const ISuperTokenFactory = require("@superfluid-finance/ethereum-contracts/build/contracts/ISuperTokenFactory");
const ISuperToken = require("@superfluid-finance/ethereum-contracts/build/contracts/ISuperToken");
const TestToken = require("@superfluid-finance/ethereum-contracts/build/contracts/TestToken");
const NativeSuperTokenProxy = require("@superfluid-finance/ethereum-contracts/build/contracts/NativeSuperTokenProxy");
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deployTestToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-test-token");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
const zeroAddress = "0x0000000000000000000000000000000000000000";
const helper = require("./../helpers/helpers");

let accounts, owner, user;
let sf, dai, daix, nativeToken, stroll;
const errorHandler = (err) => {
  if (err) throw err;
};

before(async () => {
  accounts = await ethers.getSigners();
  owner = accounts[0];
  user = accounts[3];
  // Deploy SF and needed tokens
  await deployFramework(errorHandler, {
    web3,
    from: accounts[0].address,
    newTestResolver: true,
  });
  await deployTestToken(errorHandler, [":", "fDAI"], {
    web3,
    from: accounts[0].address,
  });
  await deploySuperToken(errorHandler, [":", "fDAI"], {
    web3,
    from: accounts[0].address,
  });
  sf = new SuperfluidSDK.Framework({
    web3,
    version: "test",
    tokens: ["fDAI"],
  });
  await sf.initialize();
  // get dai/daix as ethers
  daix = new ethers.Contract(sf.tokens.fDAIx.address, ISuperToken.abi, owner);
  dai = new ethers.Contract(sf.tokens.fDAI.address, TestToken.abi, owner);

  strollerFactory = await ethers.getContractFactory("ERC20StrollOut", owner);
  strollManagerFactory = await ethers.getContractFactory(
    "StrollManager",
    owner
  );
  console.log("CFA address: ", sf.agreements.cfa.address);
  strollManager = await strollManagerFactory.deploy(
    sf.agreements.cfa.address,
    parseUnits("1", 18),
    parseUnits("1", 18)
  );
  strategy = await strollerFactory.deploy(strollManager.address);
  const superTokenFactoryAddress = await sf.host.getSuperTokenFactory();
  superTokenFactory = new ethers.Contract(
    superTokenFactoryAddress,
    ISuperTokenFactory.abi,
    accounts[0]
  );
  const tokenProxyFactory = new ethers.ContractFactory(
    NativeSuperTokenProxy.abi,
    NativeSuperTokenProxy.bytecode,
    accounts[0]
  );
  const _native = await tokenProxyFactory.deploy();
  await _native.initialize("abc", "abc", "1");
  await superTokenFactory.initializeCustomSuperToken(_native.address);
  nativeToken = new ethers.Contract(
    _native.address,
    ISuperToken.abi,
    accounts[0]
  );

  await dai.mint(user.address, parseUnits("1000", 18));
});

describe("#0 - StrollManager: Deployment and configurations", function () {
  it("Case #0.1 - Should deploy Manager with correct data", async () => {
    const minLower = await strollManager.minLower();
    const minUpper = await strollManager.minUpper();
    const cfaAddress = await strollManager.CFA_V1();
    const strollOwner = await strollManager.owner();
    assert.equal(
      minLower,
      parseUnits("1", 18).toString(),
      "minLower is not correct"
    );
    assert.equal(
      minUpper,
      parseUnits("1", 18).toString(),
      "minUpper is not correct"
    );
    assert.equal(cfaAddress, sf.agreements.cfa.address, "cfa is not correct");
    assert.equal(strollOwner, owner.address, "Owner is not correct");
  });
  it("Case #0.2 - Should register strategy", async () => {
    const tx = await strollManager.addApprovedStrategy(strategy.address);
    const strategyEvent = await helper.getEvents(tx, "AddedApprovedStrategy");
    assert.equal(
      strategyEvent[0].args.strategy,
      strategy.address,
      "wrong strategy"
    );
  });
});

describe("#1 - StrollManager: add, remove, check strategies", function () {
  it("Case #1.1 - Should not register top up without correct data", async () => {
    // reset manager
    strollManager = await strollManagerFactory.deploy(
      sf.agreements.cfa.address,
      parseUnits("1", 18),
      parseUnits("1", 18)
    );
    const expiry = helper.getTimeStampNow() + 3600 * 24 * 30;
    const superTokenRevert = await helper.expectedRevert(
      strollManager.createTopUp(
        zeroAddress,
        strategy.address,
        dai.address,
        expiry,
        parseUnits("1", 18),
        parseUnits("1", 18)
      ),
      "Null Address"
    );
    const strategyRevert = await helper.expectedRevert(
      strollManager.createTopUp(
        daix.address,
        zeroAddress,
        dai.address,
        expiry,
        parseUnits("1", 18),
        parseUnits("1", 18)
      ),
      "Null Address"
    );
    const tokenRevert = await helper.expectedRevert(
      strollManager.createTopUp(
        daix.address,
        strategy.address,
        zeroAddress,
        expiry,
        parseUnits("1", 18),
        parseUnits("1", 18)
      ),
      "Null Address"
    );
    const expiryRevert = await helper.expectedRevert(
      strollManager.createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        helper.getTimeStampNow() - 10,
        parseUnits("1", 18),
        parseUnits("1", 18)
      ),
      "Invalid time"
    );

    const lowerLimitRevert = await helper.expectedRevert(
      strollManager.createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        expiry,
        parseUnits("1", 10),
        parseUnits("1", 18)
      ),
      "Increase lower limit"
    );

    const upperLimitRevert = await helper.expectedRevert(
      strollManager.createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        expiry,
        parseUnits("1", 18),
        parseUnits("1", 10)
      ),
      "Increase upper limit"
    );

    const strategyNotRegisterRevert = await helper.expectedRevert(
      strollManager.createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        expiry,
        parseUnits("1", 18),
        parseUnits("1", 18)
      ),
      "strategy not allowed"
    );
    await strollManager.addApprovedStrategy(strategy.address);
    const supportedSTRevert = await helper.expectedRevert(
      strollManager.createTopUp(
        nativeToken.address,
        strategy.address,
        dai.address,
        expiry,
        parseUnits("1", 18),
        parseUnits("1", 18)
      ),
      "super token not supported"
    );

    assert.ok(superTokenRevert && strategyRevert && tokenRevert);
    assert.ok(expiryRevert);
    assert.ok(lowerLimitRevert);
    assert.ok(upperLimitRevert);
    assert.ok(strategyNotRegisterRevert);
    assert.ok(supportedSTRevert);
  });

  it("Case #1.2 - Should register correct topUp", async () => {
    const tx = await strollManager.createTopUp(
      daix.address,
      strategy.address,
      dai.address,
      helper.getTimeStampNow() + 3600 * 24 * 30,
      parseUnits("1", 18),
      parseUnits("1", 18)
    );
    const TopUpCreatedEvent = await helper.getEvents(tx, "TopUpCreated");

  });
});

describe("#3 - StrollManager: TopUps", function () {});

describe("#4 - StrollManager: Delete TopUps", function () {});
