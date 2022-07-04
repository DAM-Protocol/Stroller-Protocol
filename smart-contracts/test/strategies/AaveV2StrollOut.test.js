/* eslint-disable no-unused-vars */
/* eslint-disable node/no-extraneous-require */
/* eslint-disable no-undef */

const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const { provider, loadFixture, deployMockContract } = waffle;
const { parseUnits } = require("@ethersproject/units");
const zeroAddress = "0x0000000000000000000000000000000000000000";
const helper = require("./../../helpers/helpers");
const devEnv = require("./../utils/setEnv");
const LendingPoolProviderABI = require("../../artifacts/contracts/interfaces/IAaveV2.sol/ILendingPoolAddressesProvider.json");
const ProtocolDataABI = require("../../artifacts/contracts/interfaces/IAaveV2.sol/IProtocolDataProvider.json");
const LendingPoolABI = require("../../artifacts/contracts/interfaces/IAaveV2.sol/ILendingPool.json");

const errorHandler = (err) => {
  if (err) throw err;
};

// aliases to accounts
let accounts,
  owner,
  mockManager,
  nonManager,
  user,
  mockReceiverContractInstance;
let mockERC20Factory;
let dai, daix, mock20, mockaToken, aDAI, superMock20, env;

let strollerFactory;
let strollOutInstance;
let mockLendingPoolProvider, mockProtocolData, mockLendingPool;

before(async () => {
  accounts = await ethers.getSigners();
  owner = accounts[0];
  mockManager = accounts[1];
  nonManager = accounts[2];
  user = accounts[3];
  env = await devEnv.deploySuperfluid(owner);

  // get dai/daix as ethers
  daix = new ethers.Contract(
    env.sf.tokens.fDAIx.address,
    env.interfaces.ISuperToken.abi,
    owner
  );
  dai = new ethers.Contract(
    env.sf.tokens.fDAI.address,
    env.interfaces.TestToken.abi,
    owner
  );
  host = new ethers.Contract(
    env.sf.host.address,
    env.interfaces.ISuperfluid.abi,
    owner
  );
  cfa = new ethers.Contract(
    env.sf.agreements.cfa.address,
    env.interfaces.IConstantFlowAgreementV1.abi,
    owner
  );

  strollerFactory = await ethers.getContractFactory("AaveV2StrollOut", owner);
  mockERC20Factory = await ethers.getContractFactory("MockERC20", owner);
  mock20 = await mockERC20Factory.deploy("mock", "mk", 6);
  const _m20 = await env.sf.createERC20Wrapper(mock20);
  aDAI = await mockERC20Factory.deploy("Aave DAI", "aDAI", 18);
  superMock20 = new ethers.Contract(
    _m20.address,
    env.interfaces.ISuperToken.abi,
    owner
  );

  await mock20.mint(user.address, parseUnits("1000", 25));
  await dai.mint(user.address, parseUnits("1000", 18));
  await aDAI.mint(user.address, parseUnits("1000", 18));

  mockLendingPoolProvider = await deployMockContract(
    owner,
    LendingPoolProviderABI.abi
  );
  mockProtocolData = await deployMockContract(owner, ProtocolDataABI.abi);
  mockLendingPool = await deployMockContract(owner, LendingPoolABI.abi);

  strollOutInstance = await strollerFactory.deploy(
    mockManager.address,
    mockLendingPoolProvider.address,
    mockProtocolData.address
  );

  const mockReceiverContract = await ethers.getContractFactory(
    "MockReceiverContract",
    owner
  );
  mockReceiverContractInstance = await mockReceiverContract.deploy(
    env.sf.host.address,
    env.sf.agreements.cfa.address
  );
});

describe("#0 - AaveV2StrollOut: Deployment and configurations", function () {
  it("Case #0.1 - Should deploy Strategy with correct data", async () => {
    const strollManager = await strollOutInstance.strollManager();
    const strollOwner = await strollOutInstance.owner();
    assert.equal(
      strollManager,
      mockManager.address,
      "strollManager is not correct"
    );
    assert.equal(strollOwner, owner.address, "Owner is not correct");

    await expect(
      strollerFactory.deploy(
        zeroAddress,
        mockLendingPoolProvider.address,
        mockProtocolData.address
      )
    ).to.be.revertedWith("ZeroAddress");

    await expect(
      strollerFactory.deploy(
        mockManager.address,
        zeroAddress,
        mockProtocolData.address
      )
    ).to.be.revertedWith("ZeroAddress");

    await expect(
      strollerFactory.deploy(
        mockManager.address,
        mockLendingPoolProvider.address,
        zeroAddress
      )
    ).to.be.revertedWith("ZeroAddress");
  });
  it("Case #0.2 - Should change Stroll manager", async () => {
    const tx = await strollOutInstance.changeStrollManager(accounts[9].address);
    const StrollManagerChanged = await helper.getEvents(
      tx,
      "StrollManagerChanged"
    );

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
    await expect(
      strollOutInstance.changeStrollManager(zeroAddress)
    ).to.be.revertedWith("ZeroAddress");
  });
  it("Case #0.4 - Should revert if not owner", async () => {
    const rightError = await helper.expectedRevert(
      strollOutInstance.connect(user).changeStrollManager(accounts[9].address),
      "Ownable: caller is not the owner"
    );
    assert.ok(rightError);
  });
});

describe("#1 - AaveV2StrollOut: SuperToken support ", function () {
  it("Case #1.1 - isSupportedSuperToken", async () => {
    // Mocking the protocol data provider such that if DAI token address is given,
    // it will return some random address indicating that DAI is a supported asset.
    await mockProtocolData.mock.getReserveTokensAddresses
      .withArgs(dai.address)
      .returns(aDAI.address, zeroAddress, zeroAddress);
    const isSuperTokenSupported = await strollOutInstance.isSupportedSuperToken(
      daix.address
    );
    assert.ok(isSuperTokenSupported);
  });
  it("Case #1.2 - isSupportedSuperToken, native super token should fail", async () => {
    const underlyingToken = await env.nativeToken.getUnderlyingToken();
    const isSuperTokenSupported = await strollOutInstance.isSupportedSuperToken(
      env.nativeToken.address
    );
    assert.equal(
      underlyingToken,
      zeroAddress,
      "Native SuperToken with underlyingToken"
    );
    assert.ok(!isSuperTokenSupported);
  });
});

describe("#2 - AaveV2StrollOut: TopUp", function () {
  it("Case #2.1 - Should not topUp from non manager", async () => {
    strollOutInstance = await strollerFactory.deploy(
      mockManager.address,
      mockLendingPoolProvider.address,
      mockProtocolData.address
    );

    await expect(
      strollOutInstance
        .connect(nonManager)
        .topUp(accounts[1].address, daix.address, 1)
    ).to.be.revertedWith(
      `UnauthorizedCaller("${nonManager.address}", "${mockManager.address}")`
    );
  });

  it("Case #2.2 - Should perform topUp()", async () => {
    const transferAmount = parseUnits("500", 18);
    await aDAI.connect(user).approve(strollOutInstance.address, transferAmount);

    await mockLendingPoolProvider.mock.getLendingPool.returns(
      mockLendingPool.address
    );
    // Mocking the protocol data provider such that if DAI token address is given,
    // it will return some random address indicating that DAI is a supported asset.
    await mockProtocolData.mock.getReserveTokensAddresses
      .withArgs(dai.address)
      .returns(aDAI.address, zeroAddress, zeroAddress);

    await mockLendingPool.mock.withdraw.returns(transferAmount);
    await dai.mint(strollOutInstance.address, transferAmount);

    const tx = await strollOutInstance
      .connect(mockManager)
      .topUp(user.address, daix.address, transferAmount);
    const TopUpEvent = await helper.getEvents(tx, "TopUp");
    // event TopUp(address indexed user, address indexed superToken, uint256 superTokenAmount);
    assert.equal(TopUpEvent[0].args.user, user.address, "not user");
    assert.equal(TopUpEvent[0].args.superToken, daix.address, "not superToken");
    assert.equal(
      TopUpEvent[0].args.superTokenAmount.toString(),
      transferAmount,
      "not superToken"
    );
    const superTokenBalance = await daix.balanceOf(user.address);
    assert.equal(
      superTokenBalance.toString(),
      transferAmount,
      "not right final balance"
    );
  });
  it("Case #2.2.1 - Should not topUp() if allowance not enough", async () => {
    const transferAmount = parseUnits("50", 18);
    await aDAI.connect(user).approve(strollOutInstance.address, 0);
    await mockLendingPoolProvider.mock.getLendingPool.returns(
      mockLendingPool.address
    );
    // Mocking the protocol data provider such that if DAI token address is given,
    // it will return some random address indicating that DAI is a supported asset.
    await mockProtocolData.mock.getReserveTokensAddresses
      .withArgs(dai.address)
      .returns(aDAI.address, zeroAddress, zeroAddress);

    await mockLendingPool.mock.withdraw.returns(transferAmount);
    const removedApproval = await aDAI.allowance(
      user.address,
      strollOutInstance.address
    );
    assert.equal(
      removedApproval.toString(),
      "0",
      "approve clean up didn't work"
    );
    await aDAI.connect(user).approve(strollOutInstance.address, transferAmount);
    const rigthError = await helper.expectedRevert(
      strollOutInstance
        .connect(mockManager)
        .topUp(user.address, daix.address, parseUnits("51", 18)),
      "ERC20: transfer amount exceeds allowance"
    );

    assert.ok(rigthError);
  });
  it("Case #2.3 - Should perform topUp() - smart wallet", async () => {
    const transferAmount = parseUnits("100", 18);
    await aDAI.mint(mockReceiverContractInstance.address, transferAmount);
    await mockReceiverContractInstance.approve(
      aDAI.address,
      strollOutInstance.address,
      transferAmount
    );
    await mockLendingPoolProvider.mock.getLendingPool.returns(
      mockLendingPool.address
    );
    // Mocking the protocol data provider such that if DAI token address is given,
    // it will return some random address indicating that DAI is a supported asset.
    await mockProtocolData.mock.getReserveTokensAddresses
      .withArgs(dai.address)
      .returns(aDAI.address, zeroAddress, zeroAddress);

    await mockLendingPool.mock.withdraw.returns(transferAmount);
    await dai.mint(strollOutInstance.address, transferAmount);
    const tx = await strollOutInstance
      .connect(mockManager)
      .topUp(
        mockReceiverContractInstance.address,
        daix.address,
        transferAmount
      );
    const TopUpEvent = await helper.getEvents(tx, "TopUp");
    assert.equal(
      TopUpEvent[0].args.user,
      mockReceiverContractInstance.address,
      "not wallet"
    );
    assert.equal(TopUpEvent[0].args.superToken, daix.address, "not superToken");
    assert.equal(
      TopUpEvent[0].args.superTokenAmount.toString(),
      transferAmount,
      "not superToken"
    );
    const superTokenBalance = await daix.balanceOf(
      mockReceiverContractInstance.address
    );
    assert.equal(
      superTokenBalance.toString(),
      transferAmount,
      "not right final balance"
    );
  });
});

describe("#3 - AaveV2StrollOut: underlying token decimals", function () {
  it("Case #3.1 - token decimals < 18", async () => {
    const mockaToken = await mockERC20Factory.deploy("Aave Mock", "aMOCK", 6);
    const transferAmount = parseUnits("500", 18);
    const decimals = await mockaToken.decimals();
    assert.isBelow(Number(decimals), 18, "not < 18");
    await mockaToken.mint(user.address, transferAmount);
    const balance = await mockaToken.balanceOf(user.address);

    await mockaToken
      .connect(user)
      .approve(strollOutInstance.address, transferAmount);

    await mockLendingPoolProvider.mock.getLendingPool.returns(
      mockLendingPool.address
    );

    // Mocking the protocol data provider such that if DAI token address is given,
    // it will return some random address indicating that DAI is a supported asset.
    await mockProtocolData.mock.getReserveTokensAddresses
      .withArgs(mock20.address)
      .returns(mockaToken.address, zeroAddress, zeroAddress);

    await mockLendingPool.mock.withdraw.returns(transferAmount);
    await mock20.mint(strollOutInstance.address, transferAmount);
    const superTokenBalanceBefore = await superMock20.balanceOf(user.address);

    const tx = await strollOutInstance
      .connect(mockManager)
      .topUp(user.address, superMock20.address, transferAmount);
    const TopUpEvent = await helper.getEvents(tx, "TopUp");
    assert.equal(TopUpEvent[0].args.user, user.address, "not user");
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
    const superTokenBalanceAfter = await superMock20.balanceOf(user.address);
    const finalBalance = await mockaToken.balanceOf(user.address);
    assert.equal(
      superTokenBalanceAfter.sub(superTokenBalanceBefore).toString(),
      transferAmount.toString(),
      "(SuperToken) not right final balance"
    );
    assert.equal(
      balance.toString(),
      finalBalance.add(parseUnits("500", decimals)).toString(),
      "(aToken) - not right adjusted balance"
    );
  });
  it("Case #3.2 - token decimals > 18", async () => {
    await mock20.setDecimals(25);
    const mockaToken = await mockERC20Factory.deploy("Aave Mock", "aMOCK", 25);
    const transferAmount = parseUnits("500", 18);
    const decimals = await mockaToken.decimals();
    assert.isAbove(Number(decimals), 18, "not > 18");
    await mockaToken.mint(user.address, parseUnits("500", 25));
    const balance = await mockaToken.balanceOf(user.address);

    await mockaToken.connect(user).approve(strollOutInstance.address, 0);
    await mockaToken
      .connect(user)
      .approve(strollOutInstance.address, parseUnits("500", 25));

    await mockLendingPoolProvider.mock.getLendingPool.returns(
      mockLendingPool.address
    );
    // Mocking the protocol data provider such that if DAI token address is given,
    // it will return some random address indicating that DAI is a supported asset.
    await mockProtocolData.mock.getReserveTokensAddresses
      .withArgs(mock20.address)
      .returns(mockaToken.address, zeroAddress, zeroAddress);

    await mockLendingPool.mock.withdraw.returns(parseUnits("500", 25));
    await mock20.mint(strollOutInstance.address, parseUnits("500", 25));

    // console.log("Transfer amount: ", transferAmount.toString());
    const superTokenBalanceBefore = await superMock20.balanceOf(user.address);

    const tx = await strollOutInstance
      .connect(mockManager)
      .topUp(user.address, superMock20.address, transferAmount);
    const TopUpEvent = await helper.getEvents(tx, "TopUp");
    assert.equal(TopUpEvent[0].args.user, user.address, "not user");
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
    const superTokenBalanceAfter = await superMock20.balanceOf(user.address);

    const finalBalance = await mockaToken.balanceOf(user.address);
    assert.equal(
      superTokenBalanceAfter.sub(superTokenBalanceBefore).toString(),
      transferAmount.toString(),
      "(SuperToken) - not right final balance"
    );
    assert.equal(
      balance.toString(),
      finalBalance.add(parseUnits("500", decimals)).toString(),
      "(ERC20) - not right adjusted balance"
    );
  });
  it("Case #3.3 - token decimals = 18", async () => {
    await mock20.setDecimals(18);
    const decimals = await mock20.decimals();
    const mockaToken = await mockERC20Factory.deploy(
      "Aave Mock",
      "aMOCK",
      decimals
    );
    const transferAmount = parseUnits("500", 18);
    assert.equal(decimals, 18, "not = 18");
    await mockaToken.mint(user.address, transferAmount);
    const balance = await mockaToken.balanceOf(user.address);

    // await mock20.connect(user).approve(strollOutInstance.address, 0);
    await mockaToken
      .connect(user)
      .approve(strollOutInstance.address, transferAmount);

    await mockLendingPoolProvider.mock.getLendingPool.returns(
      mockLendingPool.address
    );
    // Mocking the protocol data provider such that if DAI token address is given,
    // it will return some random address indicating that DAI is a supported asset.
    await mockProtocolData.mock.getReserveTokensAddresses
      .withArgs(mock20.address)
      .returns(mockaToken.address, zeroAddress, zeroAddress);

    await mockLendingPool.mock.withdraw.returns(transferAmount);
    await mock20.mint(strollOutInstance.address, transferAmount);

    const superTokenBalanceBefore = await superMock20.balanceOf(user.address);

    const tx = await strollOutInstance
      .connect(mockManager)
      .topUp(user.address, superMock20.address, transferAmount);
    const TopUpEvent = await helper.getEvents(tx, "TopUp");
    assert.equal(TopUpEvent[0].args.user, user.address, "not user");
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
    const superTokenBalanceAfter = await superMock20.balanceOf(user.address);
    const finalBalance = await mockaToken.balanceOf(user.address);

    assert.equal(
      superTokenBalanceAfter.sub(superTokenBalanceBefore).toString(),
      transferAmount.toString(),
      "(SuperToken) - not right final balance"
    );
    assert.equal(
      balance.toString(),
      finalBalance.add(parseUnits("500", decimals)).toString(),
      "(aToken) - not right adjusted balance"
    );
  });
});

describe("#4 - AaveV2StrollOut: emergencyWithdraw", function () {
  it("Case #4.1 - transfer all locked in contract", async () => {
    const amount = parseUnits("5", 18);
    await dai.mint(owner.address, parseUnits("10", 18));
    await dai.connect(owner).approve(daix.address, amount);
    await daix.connect(owner).upgrade(amount);
    const daiBalance = await dai.balanceOf(owner.address);
    const daixBalance = await dai.balanceOf(owner.address);
    await dai.connect(owner).transfer(strollOutInstance.address, amount);
    await daix.connect(owner).transfer(strollOutInstance.address, amount);

    assert.equal(
      (await dai.balanceOf(strollOutInstance.address)).toString(),
      amount,
      "no tokens send to contract"
    );
    assert.equal(
      (await daix.balanceOf(strollOutInstance.address)).toString(),
      amount,
      "no tokens send to contract"
    );
    await strollOutInstance.connect(owner).emergencyWithdraw(dai.address);
    await strollOutInstance.connect(owner).emergencyWithdraw(daix.address);
    assert.equal(
      (await dai.balanceOf(strollOutInstance.address)).toString(),
      0,
      "contract should have zero balance"
    );
    assert.equal(
      (await dai.balanceOf(strollOutInstance.address)).toString(),
      0,
      "contract should have zero balance"
    );
    assert.equal(
      daiBalance.toString(),
      (await dai.balanceOf(owner.address)).toString(),
      "owner should get all tokens"
    );
    assert.equal(
      daixBalance.toString(),
      (await daix.balanceOf(owner.address)).toString(),
      "owner should get all tokens"
    );
  });
  it("Case #4.1 - only Owner can execute withdraw", async () => {
    const rigthError = await helper.expectedRevert(
      strollOutInstance.connect(user).emergencyWithdraw(dai.address),
      "Ownable: caller is not the owner"
    );
    assert.ok(rigthError);
  });
});
