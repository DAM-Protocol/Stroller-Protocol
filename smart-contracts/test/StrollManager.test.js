/* eslint-disable no-unused-vars */
/* eslint-disable node/no-extraneous-require */
/* eslint-disable no-undef */

const { parseUnits } = require("@ethersproject/units");
const { expect, assert } = require("chai");

const zeroAddress = "0x0000000000000000000000000000000000000000";
const helper = require("./../helpers/helpers");
const devEnv = require("./utils/setEnv");

const MIN_LOWER = helper.getSeconds(2);
const MIN_UPPER = helper.getSeconds(5);

let accounts, owner, user, streamReceiver;
let env;
let dai, daix, host, cfa, strollManager, mockReceiverContractInstance;

const getIndex = (user, superToken, liquidityToken) => {
  const encodedData = ethers.utils.defaultAbiCoder.encode(
    ["address", "address", "address"],
    [user, superToken, liquidityToken]
  );
  return ethers.utils.keccak256(encodedData);
};

const createStream = async (supertoken, sender, receiver, flowRate) => {
  const flow = await cfa.getFlow(
    supertoken.address,
    sender.address,
    receiver.address
  );
  if (flow.flowRate.toString() === "0") {
    const cfaInterface = new ethers.utils.Interface(
      env.interfaces.IConstantFlowAgreementV1.abi
    );
    const callData = cfaInterface.encodeFunctionData("createFlow", [
      supertoken.address,
      receiver.address,
      flowRate,
      "0x",
    ]);
    await host.connect(sender).callAgreement(cfa.address, callData, "0x");
  }
};

const deleteStream = async (supertoken, sender, receiver) => {
  const flow = await cfa.getFlow(
    supertoken.address,
    sender.address,
    receiver.address
  );
  if (flow.flowRate > 0) {
    const cfaInterface = new ethers.utils.Interface(
      env.interfaces.IConstantFlowAgreementV1.abi
    );
    const callData = cfaInterface.encodeFunctionData("deleteFlow", [
      supertoken.address,
      sender.address,
      receiver.address,
      "0x",
    ]);
    await host.connect(sender).callAgreement(cfa.address, callData, "0x");
  }
};

before(async () => {
  accounts = await ethers.getSigners();
  owner = accounts[0];
  user = accounts[3];
  streamReceiver = accounts[4];
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

  strollerFactory = await ethers.getContractFactory("ERC20StrollOut", owner);
  strollManagerFactory = await ethers.getContractFactory(
    "StrollManager",
    owner
  );
  strollManager = await strollManagerFactory.deploy(
    env.sf.agreements.cfa.address,
    MIN_LOWER,
    MIN_UPPER
  );
  strategy = await strollerFactory.deploy(strollManager.address);
  await dai.mint(user.address, parseUnits("1000", 18));

  const mockReceiverContract = await ethers.getContractFactory(
    "MockReceiverContract",
    owner
  );
  mockReceiverContractInstance = await mockReceiverContract.deploy(
    env.sf.host.address,
    env.sf.agreements.cfa.address
  );
});

beforeEach(async () => {
  strollManager = await strollManagerFactory.deploy(
    env.sf.agreements.cfa.address,
    MIN_LOWER,
    MIN_UPPER
  );
  strategy = await strollerFactory.deploy(strollManager.address);
  await strollManager.addApprovedStrategy(strategy.address);
  deleteStream(daix, user, streamReceiver);
  deleteStream(daix, streamReceiver, user);
});

describe("#0 - StrollManager: Deployment and configurations", function () {
  it("Case #0.1 - Should deploy Manager with correct data", async () => {
    const minLower = await strollManager.minLower();
    const minUpper = await strollManager.minUpper();
    const cfaAddress = await strollManager.CFA_V1();
    const strollOwner = await strollManager.owner();
    assert.equal(minLower, MIN_LOWER, "minLower is not correct");
    assert.equal(minUpper, MIN_UPPER, "minUpper is not correct");
    assert.equal(
      cfaAddress,
      env.sf.agreements.cfa.address,
      "cfa is not correct"
    );
    assert.equal(strollOwner, owner.address, "Owner is not correct");
  });
});

describe("#2 - StrollManager: add, remove, check strategies", function () {
  it("Case #2.1 - Should register strategy", async () => {
    // reset manager
    strollManager = await strollManagerFactory.deploy(
      env.sf.agreements.cfa.address,
      MIN_LOWER,
      MIN_UPPER
    );
    const tx = await strollManager.addApprovedStrategy(strategy.address);
    const strategyEvent = await helper.getEvents(tx, "AddedApprovedStrategy");
    assert.equal(
      strategyEvent[0].args.strategy,
      strategy.address,
      "wrong strategy"
    );
  });
  it("Case #2.2 - Should not register empty strategy", async () => {
    await expect(
      strollManager.connect(owner).addApprovedStrategy(zeroAddress)
    ).to.be.revertedWith(`InvalidStrategy("${zeroAddress}")`);
  });
  it("Case #2.2 - Should check if strategy is approved", async () => {
    // reset manager
    strollManager = await strollManagerFactory.deploy(
      env.sf.agreements.cfa.address,
      MIN_LOWER,
      MIN_UPPER
    );
    await strollManager.addApprovedStrategy(strategy.address);
    const isOk = await strollManager.approvedStrategies(strategy.address);
    assert.ok(isOk);
  });
  it("Case #2.3 - Should remove register strategy", async () => {
    await strollManager.addApprovedStrategy(strategy.address);
    const tx = await strollManager.removeApprovedStrategy(strategy.address);
    const strategyEvent = await helper.getEvents(tx, "RemovedApprovedStrategy");
    assert.equal(
      strategyEvent[0].args.strategy,
      strategy.address,
      "wrong strategy"
    );
    // removing a non existing strategy should not revert
    await strollManager.removeApprovedStrategy(strategy.address);
  });
  it("Case #2.4 - Only owner can add/remove strategy", async () => {
    // reset manager
    strollManager = await strollManagerFactory.deploy(
      env.sf.agreements.cfa.address,
      MIN_LOWER,
      MIN_UPPER
    );
    const notOwnerRevertAdding = await helper.expectedRevert(
      strollManager.connect(user).addApprovedStrategy(strategy.address),
      "caller is not the owner"
    );
    const notOwnerRevertRemoving = await helper.expectedRevert(
      strollManager.connect(user).removeApprovedStrategy(strategy.address),
      "caller is not the owner"
    );
    assert.ok(notOwnerRevertAdding && notOwnerRevertRemoving);
  });
});

describe("#3 - StrollManager: Register TopUps", function () {
  it("Case #3.1 - Should not register top up without correct data", async () => {
    // reset manager
    strollManager = await strollManagerFactory.deploy(
      env.sf.agreements.cfa.address,
      MIN_LOWER,
      MIN_UPPER
    );
    const expiry = helper.getTimeStampNow() + 3600 * 24 * 30;

    await expect(
      strollManager.createTopUp(
        zeroAddress,
        strategy.address,
        dai.address,
        expiry,
        MIN_LOWER,
        MIN_UPPER
      )
    ).to.be.revertedWith("ZeroAddress");

    await expect(
      strollManager.createTopUp(
        daix.address,
        zeroAddress,
        dai.address,
        expiry,
        MIN_LOWER,
        MIN_UPPER
      )
    ).to.be.revertedWith("ZeroAddress");

    await expect(
      strollManager.createTopUp(
        daix.address,
        strategy.address,
        zeroAddress,
        expiry,
        MIN_LOWER,
        MIN_UPPER
      )
    ).to.be.revertedWith("ZeroAddress");

    // Exact timestampNow can't be predicted beforehand and hence, test only if transaction reverts or not.
    await expect(
      strollManager.createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        helper.getTimeStampNow() - 10,
        MIN_LOWER,
        MIN_UPPER
      )
    ).to.be.reverted;

    await expect(
      strollManager.createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        expiry,
        MIN_LOWER - 1,
        MIN_UPPER
      )
    ).to.be.revertedWith(`InsufficientLimits(${MIN_LOWER - 1}, ${MIN_LOWER})`);

    await expect(
      strollManager.createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        expiry,
        MIN_LOWER,
        MIN_UPPER - 1
      )
    ).to.be.revertedWith(`InsufficientLimits(${MIN_UPPER - 1}, ${MIN_UPPER})`);

    await expect(
      strollManager.createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        expiry,
        MIN_LOWER,
        MIN_UPPER
      )
    ).to.be.revertedWith(`InvalidStrategy("${strategy.address}")`);

    await strollManager.addApprovedStrategy(strategy.address);
    await expect(
      strollManager.createTopUp(
        env.nativeToken.address,
        strategy.address,
        dai.address,
        expiry,
        MIN_LOWER,
        MIN_UPPER
      )
    ).to.be.revertedWith(`UnsupportedSuperToken("${env.nativeToken.address}")`);
  });
  it("Case #3.2 - Should register correct topUp", async () => {
    const expiry = helper.getTimeStampNow() + 3600 * 24 * 30;
    const index = getIndex(user.address, daix.address, dai.address);
    const tx = await strollManager
      .connect(user)
      .createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        expiry,
        MIN_LOWER,
        MIN_UPPER
      );
    const TopUpCreatedEvent = await helper.getEvents(tx, "TopUpCreated");
    assert.equal(TopUpCreatedEvent[0].args.id, index, "not index");
    assert.equal(TopUpCreatedEvent[0].args.user, user.address, "not user");
    assert.equal(
      TopUpCreatedEvent[0].args.superToken,
      daix.address,
      "not supertoken"
    );
    assert.equal(
      TopUpCreatedEvent[0].args.strategy,
      strategy.address,
      "not strategy"
    );
    assert.equal(
      TopUpCreatedEvent[0].args.liquidityToken,
      dai.address,
      "not liquidityToken"
    );
    assert.equal(TopUpCreatedEvent[0].args.expiry, expiry, "not expiry");
    assert.equal(
      TopUpCreatedEvent[0].args.lowerLimit,
      MIN_LOWER,
      "not lowerLimit"
    );
    assert.equal(
      TopUpCreatedEvent[0].args.upperLimit,
      MIN_UPPER,
      "not upperLimit"
    );
  });
  it("Case #3.3 - Should update topUp", async () => {
    const expiry = helper.getTimeStampNow() + 3600 * 24 * 30;
    await strollManager
      .connect(user)
      .createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        expiry,
        MIN_LOWER,
        MIN_UPPER
      );

    await strollManager
      .connect(user)
      .createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        expiry + 1000,
        helper.getSeconds(20),
        helper.getSeconds(20)
      );
    const topUp = await strollManager.getTopUp(
      user.address,
      daix.address,
      dai.address
    );
    assert.equal(
      topUp.lowerLimit,
      helper.getSeconds(20),
      "wrong lowerLimit on update"
    );
    assert.equal(
      topUp.upperLimit,
      helper.getSeconds(20),
      "wrong upperLimit on update"
    );
    assert.equal(topUp.expiry, expiry + 1000, "wrong expiry on update");
  });
});

describe("#4 - StrollManager: Delete TopUps", function () {
  it("Case #4.1 - Should remove topUp - full parameters", async () => {
    const expiry = helper.getTimeStampNow() + 3600 * 24 * 30;
    const index = getIndex(user.address, daix.address, dai.address);
    await strollManager
      .connect(user)
      .createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        expiry,
        MIN_LOWER,
        MIN_UPPER
      );
    const tx = await strollManager
      .connect(user)
      .deleteTopUp(user.address, daix.address, dai.address);
    const topUpDeletedEvent = await helper.getEvents(tx, "TopUpDeleted");
    assert.equal(topUpDeletedEvent[0].args.id, index, "wrong index");
    assert.equal(topUpDeletedEvent[0].args.user, user.address, "wrong user");
    assert.equal(
      topUpDeletedEvent[0].args.superToken,
      daix.address,
      "wrong superToken"
    );
    assert.equal(
      topUpDeletedEvent[0].args.strategy,
      strategy.address,
      "wrong strategy"
    );
    assert.equal(
      topUpDeletedEvent[0].args.liquidityToken,
      dai.address,
      "wrong liquidityToken"
    );
  });
  it("Case #4.2 - Should remove topUp - non user caller", async () => {
    const expiry = helper.getTimeStampNow() + 3600;
    await strollManager
      .connect(user)
      .createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        expiry,
        MIN_LOWER,
        MIN_UPPER
      );
    helper.increaseTime(3600);
    await strollManager
      .connect(owner)
      .deleteTopUp(user.address, daix.address, dai.address);
    const topUp = await strollManager.getTopUp(
      user.address,
      daix.address,
      dai.address
    );
    assert.equal(topUp.user, zeroAddress, "top up still registered");
    await helper.resetTime();
  });
  it("Case #4.3 - Should remove topUp - using batch", async () => {
    const anotherUser = accounts[5];
    const expiry = helper.getTimeStampNow() + 3600;
    const index1 = getIndex(user.address, daix.address, dai.address);
    const index2 = getIndex(anotherUser.address, daix.address, dai.address);
    await strollManager
      .connect(user)
      .createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        expiry,
        MIN_LOWER,
        MIN_UPPER
      );

    await strollManager
      .connect(anotherUser)
      .createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        expiry,
        MIN_LOWER,
        MIN_UPPER
      );
    helper.increaseTime(3600);
    await strollManager.connect(owner).deleteBatch([index1, index2]);
    const topUp1 = await strollManager.getTopUp(
      user.address,
      daix.address,
      dai.address
    );
    const topUp2 = await strollManager.getTopUp(
      anotherUser.address,
      daix.address,
      dai.address
    );
    assert.equal(topUp1.user, zeroAddress, "user 1 - top up still registered");
    assert.equal(topUp2.user, zeroAddress, "user 2 - top up still registered");
    await helper.resetTime();
  });
  it("Case #4.4 - Should not remove topUp - wrong user", async () => {
    const expiry = helper.getTimeStampNow() + 3600 * 24 * 30;
    await strollManager
      .connect(user)
      .createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        expiry,
        MIN_LOWER,
        MIN_UPPER
      );

    await expect(
      strollManager
        .connect(owner)
        .deleteTopUp(user.address, daix.address, dai.address)
    ).to.be.revertedWith(
      `UnauthorizedCaller("${owner.address}", "${user.address}")`
    );
  });
  it("Case #4.5 - Should not remove topUp - wrong expiry", async () => {
    const expiry = helper.getTimeStampNow() + 3600;
    await strollManager
      .connect(user)
      .createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        expiry,
        MIN_LOWER,
        MIN_UPPER
      );

    await expect(
      strollManager
        .connect(owner)
        .deleteTopUp(user.address, daix.address, dai.address)
    ).to.be.revertedWith(
      `UnauthorizedCaller("${owner.address}", "${user.address}")`
    );
  });
});

describe("#5 - TopUps", function () {
  it("Case #5.1 - checkTopUp", async () => {
    await strollManager
      .connect(user)
      .createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        helper.getTimeStampNow() + helper.getSeconds(365),
        helper.getSeconds(5),
        helper.getSeconds(5)
      );

    // approve superToken
    await dai.connect(user).approve(daix.address, parseUnits("100", 18));
    // approve strategy
    await dai.connect(user).approve(strategy.address, parseUnits("100", 18));
    // get some superToken
    await daix.connect(user).upgrade(parseUnits("10", 18));
    await createStream(daix, user, streamReceiver, "100000000000000", "0x");
    const expected = 100000000000000 * helper.getSeconds(5);
    await helper.increaseTime(3600 * 24 * 5);
    const checkTopObj = await strollManager.checkTopUp(
      user.address,
      daix.address,
      dai.address
    );

    assert.equal(checkTopObj[0], expected, "amount is wrong");
    assert.equal(checkTopObj[1], "", "reason code is wrong");
  });
  it("Case #5.2 - checkTopUp without stream", async () => {
    await strollManager
      .connect(user)
      .createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        helper.getTimeStampNow() + helper.getSeconds(365),
        helper.getSeconds(5),
        helper.getSeconds(5)
      );
    // approve strategy
    await dai.connect(user).approve(strategy.address, parseUnits("100", 18));

    const checkTopObj = await strollManager.checkTopUp(
      user.address,
      daix.address,
      dai.address
    );
    assert.equal(checkTopObj[0], 0, "amount should be zero");
    assert.equal(checkTopObj[1], "SP07");
  });
  it("Case #5.3 - checkTopUp without data should return zero", async () => {
    const checkTopObj = await strollManager.checkTopUp(
      user.address,
      daix.address,
      dai.address
    );
    assert.equal(checkTopObj[0], 0, "wrong amount");
    assert.equal(checkTopObj[1], "SP01", "wrong reason code");
  });
  it("Case #5.4 - checkTopUp without approved balance", async () => {
    await strollManager
      .connect(user)
      .createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        helper.getTimeStampNow() + helper.getSeconds(365),
        helper.getSeconds(5),
        helper.getSeconds(5)
      );
    // remove approval
    await dai.connect(user).approve(strategy.address, 0);
    // approve superToken
    await dai.connect(user).approve(daix.address, parseUnits("100", 18));
    // get some superToken
    await daix.connect(user).upgrade(parseUnits("10", 18));
    await createStream(daix, user, streamReceiver, "100000000000000", "0x");

    await helper.increaseTime(3600 * 24 * 5);
    const checkTopObj = await strollManager.checkTopUp(
      user.address,
      daix.address,
      dai.address
    );
    assert.equal(checkTopObj[0], 0, "amount should be zero");
    assert.equal(checkTopObj[1], "SP03", "wrong reason code");
  });
  it("Case #5.5 - checkTopUp without balance", async () => {
    await strollManager
      .connect(user)
      .createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        helper.getTimeStampNow() + helper.getSeconds(365),
        helper.getSeconds(5),
        helper.getSeconds(5)
      );

    // approve superToken
    await dai.connect(user).approve(daix.address, parseUnits("100", 18));
    // approve strategy
    await dai.connect(user).approve(strategy.address, parseUnits("100", 18));
    // get some superToken
    await daix.connect(user).upgrade(parseUnits("10", 18));
    // remove dai balance
    const balance = await dai.balanceOf(user.address);
    await dai.connect(user).transfer(owner.address, balance);
    await createStream(daix, user, streamReceiver, "100000000000000", "0x");
    await helper.increaseTime(3600 * 24 * 5);
    const checkTopObj = await strollManager.checkTopUp(
      user.address,
      daix.address,
      dai.address
    );
    assert.equal(checkTopObj[0], 0, "amount should be zero");
    assert.equal(checkTopObj[1], "SP04", "wrong reason code");
  });
  it("Case #5.6 - checkTopUp with netFlowPositive should return zero", async () => {
    await dai.mint(user.address, parseUnits("1000", 18));
    await dai.mint(streamReceiver.address, parseUnits("1000", 18));
    await strollManager
      .connect(streamReceiver)
      .createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        helper.getTimeStampNow() + helper.getSeconds(365),
        helper.getSeconds(5),
        helper.getSeconds(5)
      );

    // approve superToken
    await dai.connect(user).approve(daix.address, parseUnits("100", 18));
    // await dai
    //   .connect(streamReceiver)
    //   .approve(daix.address, parseUnits("100", 18));

    // approve strategy
    await dai
      .connect(streamReceiver)
      .approve(strategy.address, parseUnits("100", 18));
    // get some superToken
    await daix.connect(user).upgrade(parseUnits("10", 18));
    await createStream(daix, user, streamReceiver, "100000000000000", "0x");
    await helper.increaseTime(3600 * 24 * 5);
    const checkTopObj = await strollManager.checkTopUp(
      streamReceiver.address,
      daix.address,
      dai.address
    );
    assert.equal(checkTopObj[0], 0, "amount should be zero");
    assert.equal(checkTopObj[1], "SP07", "wrong reason code");
  });
  it("Case #5.7 - checkTopUp with larger superToken balance should return zero", async () => {
    await strollManager
      .connect(user)
      .createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        helper.getTimeStampNow() + helper.getSeconds(365),
        helper.getSeconds(5),
        helper.getSeconds(5)
      );

    // approve superToken
    await dai.connect(user).approve(daix.address, parseUnits("100", 18));
    // approve strategy
    await dai.connect(user).approve(strategy.address, parseUnits("100", 18));
    // get some superToken
    await daix.connect(user).upgrade(parseUnits("10", 18));

    await createStream(daix, user, streamReceiver, "100000000000000", "0x");
    await helper.increaseTime(3600 * 24 * 5);
    // mint and send tokens to user
    await dai.mint(owner.address, parseUnits("1000", 18));
    await dai.connect(owner).approve(daix.address, parseUnits("100", 18));
    await daix
      .connect(owner)
      .upgradeTo(user.address, parseUnits("100", 18), "0x");
    const checkTopObj = await strollManager.checkTopUp(
      user.address,
      daix.address,
      dai.address
    );
    assert.equal(checkTopObj[0], 0, "amount should be zero");
    assert.equal(checkTopObj[1], "SP06", "wrong reason code");
  });
});

describe("#6 - perform Top Up", function () {
  it("Case #6.1 - TopUp", async () => {
    await strollManager
      .connect(user)
      .createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        helper.getTimeStampNow() + helper.getSeconds(365),
        helper.getSeconds(5),
        helper.getSeconds(5)
      );

    // approve superToken
    await dai.connect(user).approve(daix.address, parseUnits("100", 18));
    // approve strategy
    await dai.connect(user).approve(strategy.address, parseUnits("100", 18));
    // get some superToken
    await daix.connect(user).upgrade(parseUnits("10", 18));
    await createStream(daix, user, streamReceiver, "100000000000000", "0x");

    await helper.increaseTime(3600 * 24 * 5);
    const balance = await daix.balanceOf(user.address);
    const tx = await strollManager.performTopUp(
      user.address,
      daix.address,
      dai.address
    );
    await helper.getEvents(tx, "PerformedTopUp");
    const after = await daix.balanceOf(user.address);
    assert.isAbove(after, balance, "balance should go up");
  });
  it("Case #6.2 - TopUp - Smart wallet", async () => {
    await dai.mint(mockReceiverContractInstance.address, parseUnits("100", 18));
    await mockReceiverContractInstance.approve(
      dai.address,
      strategy.address,
      parseUnits("100", 18)
    );
    await mockReceiverContractInstance.approve(
      dai.address,
      daix.address,
      parseUnits("100", 18)
    );
    await mockReceiverContractInstance.createTopUp(
      strollManager.address,
      daix.address,
      strategy.address,
      dai.address,
      helper.getTimeStampNow() + helper.getSeconds(365),
      helper.getSeconds(5),
      helper.getSeconds(5)
    );
    // get some superToken
    await mockReceiverContractInstance.upgrade(
      daix.address,
      parseUnits("10", 18)
    );
    await mockReceiverContractInstance.createFlow(
      daix.address,
      accounts[7].address,
      100000000000000
    );

    await helper.increaseTime(3600 * 24 * 5);
    const balance = await daix.balanceOf(mockReceiverContractInstance.address);
    const tx = await strollManager.performTopUp(
      mockReceiverContractInstance.address,
      daix.address,
      dai.address
    );
    await helper.getEvents(tx, "PerformedTopUp");
    const after = await daix.balanceOf(mockReceiverContractInstance.address);
    assert.isAbove(after, balance, "balance should go up");
  });
  it("Case #6.3 - should revert if no topAmount", async () => {
    const result = await strollManager.getTopUpIndex(
      user.address,
      daix.address,
      dai.address
    );

    await expect(
      strollManager.performTopUp(user.address, daix.address, dai.address)
    ).to.be.revertedWith(`TopUpFailed("${result}", "SP01")`);
  });
  it("Case #6.4 - TopUp using max values (global limits)", async () => {
    const flowRate = parseUnits("300", 18).div(
      helper.getBigNumber(helper.getSeconds(30))
    );
    await strollManager
      .connect(user)
      .createTopUp(
        daix.address,
        strategy.address,
        dai.address,
        helper.getTimeStampNow() + helper.getSeconds(365),
        helper.getSeconds(5),
        helper.getSeconds(5)
      );

    let tx = await strollManager.setLimits(
      helper.getSeconds(6),
      helper.getSeconds(8)
    );
    const limitsChangedEvent = await helper.getEvents(tx, "LimitsChanged");
    assert.equal(
      limitsChangedEvent[0].args.lowerLimit,
      helper.getSeconds(6),
      "wrong lower limit"
    );
    assert.equal(
      limitsChangedEvent[0].args.upperLimit,
      helper.getSeconds(8),
      "wrong upper limit"
    );

    // approve superToken
    await dai.connect(user).approve(daix.address, parseUnits("10000", 18));
    // approve strategy
    await dai.connect(user).approve(strategy.address, parseUnits("10000", 18));
    // get some superToken
    await daix.connect(user).upgrade(parseUnits("20", 18));
    await createStream(daix, user, streamReceiver, flowRate.toString(), "0x");

    let balance = await daix.balanceOf(user.address);
    console.log("Balance before increase time: ", balance.toString());

    await helper.increaseTime(3600 * 24 * 5);

    balance = await daix.balanceOf(user.address);
    console.log("Balance after increase time: ", balance.toString());

    tx = await strollManager.performTopUp(
      user.address,
      daix.address,
      dai.address
    );

    const TopUpEvent = await helper.getEvents(tx, "PerformedTopUp");
    const after = await daix.balanceOf(user.address);

    console.log("After: ", after.toString());

    expect(after.sub(balance)).to.be.closeTo(
      TopUpEvent[0].args.topUpAmount,
      parseUnits("0.01", 18)
    );
    assert.isAbove(after, balance, "balance should go up");
  });
});
