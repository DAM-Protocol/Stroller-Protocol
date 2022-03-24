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

const getEvents = async (tx, eventName) => {
  const receipt = await tx.wait();
  return receipt.events?.filter((x) => {
    return x.event === eventName;
  });
};

const expectedRevert = async (fn, revertMsg, printError = false) => {
  try {
    await fn;
    return false;
  } catch (err) {
    if (printError) console.log(err);
    return err.toString().includes(revertMsg);
  }
};

const errorHandler = (err) => {
  if (err) throw err;
};

let accounts;
let owner;
let mockManager;
let honestUser;
let dishonestUser;
let sf;
let StrollerFactory;
let StrollOutInstance;
let NativeToken;
let nativeToken;
let SuperTokenFactory;
let dai;
let daix;

before(async () => {
  accounts = await ethers.getSigners();
  owner = accounts[0];
  mockManager = accounts[1];
  nonManager = accounts[2];
  honestUser = accounts[3];
  dishonestUser = accounts[4];
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
  daix = new ethers.Contract(sf.tokens.fDAIx.address, ISuperToken.abi, owner);
  dai = new ethers.Contract(sf.tokens.fDAI.address, TestToken.abi, owner);
  StrollerFactory = await ethers.getContractFactory(
    "ERC20StrollOut",
    accounts[0]
  );
  const SuperTokenFactoryAddress = await sf.host.getSuperTokenFactory();
  SuperTokenFactory = new ethers.Contract(
    SuperTokenFactoryAddress,
    ISuperTokenFactory.abi,
    accounts[0]
  );
  const tokenProxyFactory = new ethers.ContractFactory(
    NativeSuperTokenProxy.abi,
    NativeSuperTokenProxy.bytecode,
    accounts[0]
  );
  nativeToken = await tokenProxyFactory.deploy();
  await nativeToken.initialize("abc", "abc", "1");
  await SuperTokenFactory.initializeCustomSuperToken(nativeToken.address);
  NativeToken = new ethers.Contract(
    nativeToken.address,
    ISuperToken.abi,
    accounts[0]
  );
  await dai.mint(honestUser.address, parseUnits("1000", 18));
});

describe("#0 - ERC20StrollOut: Deployment and configurations", function () {
  it("Case #0.1 - Should deploy Strategy with correct data", async () => {
    StrollOutInstance = await StrollerFactory.deploy(mockManager.address);
    const strollManager = await StrollOutInstance.strollManager();
    const strollOwner = await StrollOutInstance.owner();
    assert.equal(
      strollManager,
      mockManager.address,
      "strollManager is not correct"
    );
    assert.equal(strollOwner, owner.address, "Owner is not correct");

    const rightError = await expectedRevert(
      StrollerFactory.deploy(zeroAddress),
      "zero address"
    );
    assert.ok(rightError);
  });
  it("Case #0.2 - Should change Stroll manager", async () => {
    const tx = await StrollOutInstance.changeStrollManager(accounts[9].address);
    const StrollManagerChanged = await getEvents(tx, "StrollManagerChanged");
    assert.isAbove(StrollManagerChanged.length, 0, "No event");
    assert.equal(
      StrollManagerChanged[0].args.oldStrollManager,
      mockManager.address,
      "not oldStrollManager"
    );
    assert.equal(
      StrollManagerChanged[0].args.strollManager,
      accounts[9].address,
      "not new strollManager"
    );
  });
  it("Case #0.3 - Should revert if Stroll manager is zero", async () => {
    const rightError = await expectedRevert(
      StrollOutInstance.changeStrollManager(zeroAddress),
      "zero address"
    );
    assert.ok(rightError);
  });
});

describe("#1 - ERC20StrollOut: SuperToken support ", function () {
  it("Case #1.1 - isSupportedSuperToken", async () => {
    const isSuperTokenSupported = await StrollOutInstance.isSupportedSuperToken(
      daix.address
    );
    assert.ok(isSuperTokenSupported);
  });
  it("Case #1.2 - isSupportedSuperToken, native super token should fail", async () => {
    const underlyingToken = await NativeToken.getUnderlyingToken();
    const isSuperTokenSupported = await StrollOutInstance.isSupportedSuperToken(
      NativeToken.address
    );
    assert.equal(
      underlyingToken,
      zeroAddress,
      "Native SuperToken with underlyingToken"
    );
    assert.ok(!isSuperTokenSupported);
  });
});

describe("#2 - ERC20StrollOut: TopUp", function () {
  it("Case #2.1 - Should not topUp from non manager", async () => {
    StrollOutInstance = await StrollerFactory.deploy(mockManager.address);
    const rightError = await expectedRevert(
      StrollOutInstance.connect(nonManager).topUp(
        accounts[1].address,
        daix.address,
        1
      ),
      "Caller not authorised"
    );
    assert.ok(rightError);
  });
  it("Case #2.2 - Should not topUp with non wrapped superToken", async () => {
    const rightError = await expectedRevert(
      StrollOutInstance.connect(mockManager).topUp(
        accounts[1].address,
        nativeToken.address,
        1
      ),
      "SuperToken not supported"
    );
    assert.ok(rightError);
  });
  it("Case #2.3 - Should perform topUp()", async () => {
    const transferAmount = parseUnits("500", 18);
    await dai
      .connect(honestUser)
      .approve(StrollOutInstance.address, transferAmount);
    const tx = await StrollOutInstance.connect(mockManager).topUp(
      honestUser.address,
      daix.address,
      transferAmount
    );
    const TopUpEvent = await getEvents(tx, "TopUp");
    // event TopUp(address indexed user, address indexed superToken, uint256 superTokenAmount);
    assert.equal(TopUpEvent[0].args.user, honestUser.address, "not user");
    assert.equal(TopUpEvent[0].args.superToken, daix.address, "not superToken");
    assert.equal(
      TopUpEvent[0].args.superTokenAmount.toString(),
      transferAmount,
      "not superToken"
    );
    const superTokenBalance = await daix.balanceOf(honestUser.address);
    assert.equal(
      superTokenBalance.toString(),
      transferAmount,
      "not right final balance"
    );
  });
  it("Case #2.3.1 - Should not topUp() if allowance not enough", async () => {
    const transferAmount = parseUnits("50", 18);
    await dai.connect(honestUser).approve(StrollOutInstance.address, 0);
    const removedApproval = await dai.allowance(
      honestUser.address,
      StrollOutInstance.address
    );
    assert.equal(
      removedApproval.toString(),
      "0",
      "approve clean up didn't work"
    );
    await dai
      .connect(honestUser)
      .approve(StrollOutInstance.address, transferAmount);
    const rigthError = await expectedRevert(
      StrollOutInstance.connect(mockManager).topUp(
        honestUser.address,
        daix.address,
        parseUnits("51", 18)
      ),
      "transfer amount exceeds allowance"
    );
    assert.ok(rigthError);
  });
  it("Case #2.3.2 - Should not topUp() if balance not enough", async () => {
    const transferAmount = parseUnits("1000", 18);
    await dai.connect(honestUser).approve(StrollOutInstance.address, 0);
    const removedApproval = await dai.allowance(
      honestUser.address,
      StrollOutInstance.address
    );
    assert.equal(
      removedApproval.toString(),
      "0",
      "approve clean up didn't work"
    );
    await dai
      .connect(honestUser)
      .approve(StrollOutInstance.address, transferAmount);
    const rigthError = await expectedRevert(
      StrollOutInstance.connect(mockManager).topUp(
        honestUser.address,
        daix.address,
        transferAmount
      ),
      "transfer amount exceeds balance"
    );
    assert.ok(rigthError);
  });
});

describe("#3 - ERC20StrollOut: underlying token decimals", function () {
  it("Case #3.1 - token decimals < 18", async () => {
    const transferAmount = parseUnits("500", 18);
    const decimals = await mock20.decimals();
    assert.isBelow(Number(decimals), 18, "not < 18");
    const balance = await mock20.balanceOf(honestUser.address);

    await mock20
      .connect(honestUser)
      .approve(StrollOutInstance.address, transferAmount);
    const tx = await StrollOutInstance.connect(mockManager).topUp(
      honestUser.address,
      superMock20.address,
      transferAmount
    );
    const TopUpEvent = await helper.getEvents(tx, "TopUp");
    // event TopUp(address indexed user, address indexed superToken, uint256 superTokenAmount);
    assert.equal(TopUpEvent[0].args.user, honestUser.address, "not user");
    assert.equal(
      TopUpEvent[0].args.superToken,
      superMock20.address,
      "not superToken"
    );
    assert.equal(
      TopUpEvent[0].args.superTokenAmount.toString(),
      transferAmount,
      "not right amount"
    );
    const superTokenBalance = await daix.balanceOf(honestUser.address);
    const finalBalance = await mock20.balanceOf(honestUser.address);
    assert.equal(
      superTokenBalance.toString(),
      transferAmount,
      "(SuperToken) not right final balance"
    );

    assert.equal(
      balance.toString(),
      finalBalance.add(parseUnits("500", decimals)).toString(),
      "not right adjusted balance"
    );
  });
  it("Case #3.2 - token decimals > 18", async () => {
    mock20.setDecimals(25);
    const transferAmount = parseUnits("500", 18);
    const decimals = await mock20.decimals();
    assert.isAbove(Number(decimals), 18, "not > 18");
    const balance = await mock20.balanceOf(honestUser.address);
    await mock20.connect(honestUser).approve(StrollOutInstance.address, 0);
    await mock20
      .connect(honestUser)
      .approve(StrollOutInstance.address, parseUnits("500", 25));
    const tx = await StrollOutInstance.connect(mockManager).topUp(
      honestUser.address,
      superMock20.address,
      transferAmount
    );
    const TopUpEvent = await helper.getEvents(tx, "TopUp");
    assert.equal(TopUpEvent[0].args.user, honestUser.address, "not user");
    assert.equal(
      TopUpEvent[0].args.superToken,
      superMock20.address,
      "not superToken"
    );
    assert.equal(
      TopUpEvent[0].args.superTokenAmount.toString(),
      transferAmount,
      "not right amount"
    );
    const superTokenBalance = await daix.balanceOf(honestUser.address);
    const finalBalance = await mock20.balanceOf(honestUser.address);
    assert.equal(
      superTokenBalance.toString(),
      transferAmount,
      "(SuperToken) - not right final balance"
    );
    assert.equal(
      balance.toString(),
      finalBalance.add(parseUnits("500", decimals)).toString(),
      "(ERC20) - not right adjusted balance"
    );
  });
  it("Case #3.3 - token decimals = 18", async () => {
    mock20.setDecimals(18);
    const decimals = await mock20.decimals();
    const transferAmount = parseUnits("500", 18);
    assert.equal(decimals, 18, "not = 18");
    const balance = await mock20.balanceOf(honestUser.address);
    await mock20.connect(honestUser).approve(StrollOutInstance.address, 0);
    await mock20
      .connect(honestUser)
      .approve(StrollOutInstance.address, transferAmount);
    const tx = await StrollOutInstance.connect(mockManager).topUp(
      honestUser.address,
      superMock20.address,
      transferAmount
    );
    const TopUpEvent = await helper.getEvents(tx, "TopUp");
    assert.equal(TopUpEvent[0].args.user, honestUser.address, "not user");
    assert.equal(
      TopUpEvent[0].args.superToken,
      superMock20.address,
      "not superToken"
    );
    assert.equal(
      TopUpEvent[0].args.superTokenAmount.toString(),
      transferAmount,
      "not right amount"
    );
    const superTokenBalance = await daix.balanceOf(honestUser.address);
    const finalBalance = await mock20.balanceOf(honestUser.address);
    assert.equal(
      superTokenBalance.toString(),
      transferAmount,
      "(SuperToken) - not right final balance"
    );
    assert.equal(
      balance.toString(),
      finalBalance.add(parseUnits("500", decimals)).toString(),
      "(ERC20) - not right adjusted balance"
    );
  });
});
