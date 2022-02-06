/* eslint-disable no-unused-vars */
/* eslint-disable node/no-extraneous-require */
/* eslint-disable no-undef */
const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const { provider, loadFixture } = waffle;
const { parseUnits } = require("@ethersproject/units");
const SuperfluidSDK = require("@superfluid-finance/sdk-core");
const {
  getBigNumber,
  getSeconds,
  getTimeStampNow,
  increaseTime,
  impersonateAccounts,
} = require("../../helpers/helpers");
const { constants } = require("ethers");
const { defaultAbiCoder } = require("ethers/lib/utils");

describe("Chainlink Upkeep Testing (Testnet Deployment)", function () {
  const DAI = {
    symbol: "DAI",
    token: "0x001B3B4d0F3714Ca98ba10F6042DaEbF0B1B7b6F",
    aToken: "0x639cB7b21ee2161DF9c882483C9D55c90c20Ca3e",
    superToken: "0x06577b0B09e69148A45b866a0dE6643b6caC40Af",
    decimals: 18,
  };

  const USDC = {
    symbol: "USDC",
    token: "0x2058A9D7613eEE744279e3856Ef0eAda5FCbaA7e",
    aToken: "0x2271e3Fef9e15046d09E1d78a8FF038c691E9Cf9",
    superToken: "0x86beec8a6e0e0ded142998ed8ddcbce118f91864",
    decimals: 6,
  };

  const USDT = {
    symbol: "USDT",
    token: "0xBD21A10F619BE90d6066c941b04e340841F1F989",
    aToken: "0xF8744C0bD8C7adeA522d6DDE2298b17284A79D1b",
    superToken: "0x3a27ff22eef2db03e91613ca4ba37e21ee21458a",
    decimals: 6,
  };

  const AAVE = {
    symbol: "AAVE",
    token: "0x341d1f30e77D3FBfbD43D17183E2acb9dF25574E",
    aToken: "0x7ec62b6fC19174255335C8f4346E0C2fcf870a6B",
    superToken: "0x98d12ca6c1ef4b99ce48cb616a3ac25806826cc8",
    decimals: 18,
  };

  const WETH = {
    symbol: "WETH",
    token: "0x3C68CE8504087f89c640D02d133646d98e64ddd9",
    aToken: "0x7aE20397Ca327721F013BB9e140C707F82871b56",
    superToken: "0xe2cd1c038bd473c02b01fb355b58e0a6d7183dde",
    decimals: 18,
  };

  const WBTC = {
    symbol: "WBTC",
    token: "0x0d787a4a1548f673ed375445535a6c7A1EE56180",
    aToken: "0xc9276ECa6798A14f64eC33a526b547DAd50bDa2F",
    superToken: "0x0173d76385b5948560e4012ca63ff79de9f2da9e",
    decimals: 8,
  };

  // Test account containing all the aTokens and supertokens
  const whaleAddr = "0x917A19E71a2811504C4f64aB33c132063B5772a5";

  const [admin, dummy] = provider.getWallets();
  const ethersProvider = provider;

  let sf;
  let whale;
  let amDAIContract, amUSDCContract;
  let USDCx, DAIx;
  let app, appFactory, strollResolver, registry, registryFactory;

  before(async () => {
    [whale] = await impersonateAccounts([whaleAddr]);

    amDAIContract = await ethers.getContractAt("IERC20", DAI.aToken);
    amUSDCContract = await ethers.getContractAt("IERC20", USDC.aToken);

    sf = await SuperfluidSDK.Framework.create({
      networkName: "hardhat",
      dataMode: "WEB3_ONLY",
      resolverAddress: "0x8C54C83FbDe3C59e59dd6E324531FB93d4F504d3", // Mumbai testnet resolver
      protocolReleaseVersion: "v1",
      provider: ethersProvider,
    });

    USDCx = await sf.loadSuperToken(USDC.superToken);
    DAIx = await sf.loadSuperToken(DAI.superToken);

    strollHelperFactory = await ethers.getContractFactory(
      "StrollHelper",
      admin
    );

    strollHelper = await strollHelperFactory.deploy();

    strollResolverFactory = await ethers.getContractFactory(
      "StrollResolver",
      admin
    );

    strollResolver = await strollResolverFactory.deploy(
      1,
      getSeconds(5),
      getSeconds(1)
    );

    await strollHelper.deployed();
    await strollResolver.deployed();

    // await strollResolver.addSupportedSuperToken(USDC.superToken);
    // await strollResolver.addSupportedSuperToken(DAI.superToken);

    registryFactory = await ethers.getContractFactory("Registry", {
      libraries: {
        StrollHelper: strollHelper.address,
      },
      admin,
    });

    appFactory = await ethers.getContractFactory("AaveStrollOut", {
      libraries: {
        StrollHelper: strollHelper.address,
      },
      admin,
    });
  });

  async function setupEnv() {
    registry = await registryFactory.deploy(strollResolver.address, "50");
    app = await appFactory.deploy(strollResolver.address);

    await registry.deployed();
    await app.deployed();

    await strollResolver.changeStrollRegistry(registry.address);
  }

  it("should check for upkeep properly", async () => {
    await loadFixture(setupEnv);

    await amUSDCContract
      .connect(whale)
      .approve(app.address, parseUnits("100", 6));

    userFlowRate = parseUnits("1000", 18).div(getBigNumber(getSeconds(30)));

    await sf.cfaV1
      .createFlow({
        superToken: USDC.superToken,
        receiver: dummy.address,
        flowRate: userFlowRate,
      })
      .exec(whale);

    await registry
      .connect(whale)
      .createTopUp(
        USDC.superToken,
        app.address,
        USDC.aToken,
        getBigNumber(getTimeStampNow()).add(getSeconds(90))
      );
    // await registry.connect(whale).createTopUp(DAI.superToken, app.address, DAI.aToken, getBigNumber(getTimeStampNow()).add(getSeconds(90)));

    await increaseTime(getSeconds(29));

    checkData = defaultAbiCoder.encode(["uint256"], [constants.Zero]);
    result = await registry.checkUpkeep(checkData);

    console.log("Result: ", result);

    expect(result.upkeepNeeded).to.equal(true);

    // balanceBeforeUSDCx = await USDCx.balanceOf({
    //     account: whaleAddr,
    //     providerOrSigner: ethersProvider,
    // });

    // balanceBeforeDAIx = await DAIx.balanceOf({
    //     account: whaleAddr,
    //     providerOrSigner: ethersProvider,
    // });
  });

  it("should perform upkeep consuming all allowance", async () => {
    await loadFixture(setupEnv);

    await amUSDCContract
      .connect(whale)
      .approve(app.address, parseUnits("100", 6));

    userFlowRate = parseUnits("1000", 18).div(getBigNumber(getSeconds(30)));

    await sf.cfaV1
      .createFlow({
        superToken: USDC.superToken,
        receiver: dummy.address,
        flowRate: userFlowRate,
      })
      .exec(whale);

    await registry
      .connect(whale)
      .createTopUp(
        USDC.superToken,
        app.address,
        USDC.aToken,
        getBigNumber(getTimeStampNow()).add(getSeconds(90))
      );
    // await registry.connect(whale).createTopUp(DAI.superToken, app.address, DAI.aToken, getBigNumber(getTimeStampNow()).add(getSeconds(90)));

    await increaseTime(getSeconds(29));

    checkData = defaultAbiCoder.encode(["uint256"], [constants.Zero]);
    result = await registry.checkUpkeep(checkData);

    expect(result.upkeepNeeded).to.equal(true);

    balanceBeforeUSDCx = await USDCx.balanceOf({
      account: whaleAddr,
      providerOrSigner: ethersProvider,
    });

    // balanceBeforeDAIx = await DAIx.balanceOf({
    //     account: whaleAddr,
    //     providerOrSigner: ethersProvider,
    // });

    await registry.performUpkeep(result.performData);

    balanceAfterUSDCx = await USDCx.balanceOf({
      account: whaleAddr,
      providerOrSigner: ethersProvider,
    });

    // balanceAfterDAIx = await DAIx.balanceOf({
    //     account: whaleAddr,
    //     providerOrSigner: ethersProvider,
    // });

    // (Amount per month / 30) * Upper limit
    expectedDiff = parseUnits(((1000 / 30) * 5).toString(), "18");
    expectedDiffUSDC = parseInt((1000 / 30) * 5 * Math.pow(10, 6));

    expect(
      getBigNumber(balanceAfterUSDCx).sub(getBigNumber(balanceBeforeUSDCx))
    ).to.be.closeTo(parseUnits("100", 18), parseUnits("1", 18));

    expect(await amUSDCContract.allowance(whaleAddr, app.address)).to.equal(
      constants.Zero
    );
  });

  it("should perform upkeep consuming some allowance", async () => {
    await loadFixture(setupEnv);

    await amUSDCContract
      .connect(whale)
      .approve(app.address, parseUnits("200", 6));

    userFlowRate = parseUnits("1000", 18).div(getBigNumber(getSeconds(30)));

    await sf.cfaV1
      .createFlow({
        superToken: USDC.superToken,
        receiver: dummy.address,
        flowRate: userFlowRate,
      })
      .exec(whale);

    await registry
      .connect(whale)
      .createTopUp(
        USDC.superToken,
        app.address,
        USDC.aToken,
        getBigNumber(getTimeStampNow()).add(getSeconds(90))
      );

    await increaseTime(getSeconds(29));

    balanceBeforeUSDCx = await USDCx.balanceOf({
      account: whaleAddr,
      providerOrSigner: ethersProvider,
    });

    checkData = defaultAbiCoder.encode(["uint256"], [constants.Zero]);
    result = await registry.checkUpkeep(checkData);

    expect(result.upkeepNeeded).to.equal(true);

    await registry.performUpkeep(result.performData);

    balanceAfterUSDCx = await USDCx.balanceOf({
      account: whaleAddr,
      providerOrSigner: ethersProvider,
    });

    // (Amount per month / 30) * Upper limit
    expectedDiff = parseUnits(((1000 / 30) * 5).toString(), "18");
    expectedDiffUSDC = parseInt((1000 / 30) * 5 * Math.pow(10, 6));

    expect(
      getBigNumber(balanceAfterUSDCx).sub(getBigNumber(balanceBeforeUSDCx))
    ).to.be.closeTo(expectedDiff, parseUnits("1", 18));

    expect(
      await amUSDCContract.allowance(whaleAddr, app.address)
    ).to.be.closeTo(
      parseUnits("200", 6).sub(getBigNumber(expectedDiffUSDC)),
      parseUnits("1", 6)
    );
  });

  it("should perform upkeep consuming all allowance (multi-token)", async () => {
    await loadFixture(setupEnv);

    await amUSDCContract
      .connect(whale)
      .approve(app.address, parseUnits("100", 6));
    await amDAIContract
      .connect(whale)
      .approve(app.address, parseUnits("100", 18));

    userFlowRate = parseUnits("1000", 18).div(getBigNumber(getSeconds(30)));

    await sf.cfaV1
      .createFlow({
        superToken: USDC.superToken,
        receiver: dummy.address,
        flowRate: userFlowRate,
      })
      .exec(whale);

    await sf.cfaV1
      .createFlow({
        superToken: DAI.superToken,
        receiver: dummy.address,
        flowRate: userFlowRate,
      })
      .exec(whale);

    await registry
      .connect(whale)
      .createTopUp(
        USDC.superToken,
        app.address,
        USDC.aToken,
        getBigNumber(getTimeStampNow()).add(getSeconds(90))
      );
    await registry
      .connect(whale)
      .createTopUp(
        DAI.superToken,
        app.address,
        DAI.aToken,
        getBigNumber(getTimeStampNow()).add(getSeconds(90))
      );

    await increaseTime(getSeconds(29));

    checkData = defaultAbiCoder.encode(["uint256"], [constants.Zero]);
    result = await registry.checkUpkeep(checkData);

    expect(result.upkeepNeeded).to.equal(true);

    balanceBeforeUSDCx = await USDCx.balanceOf({
      account: whaleAddr,
      providerOrSigner: ethersProvider,
    });

    balanceBeforeDAIx = await DAIx.balanceOf({
      account: whaleAddr,
      providerOrSigner: ethersProvider,
    });

    await registry.performUpkeep(result.performData);

    result = await registry.checkUpkeep(checkData);
    expect(result.upkeepNeeded).to.equal(true);

    await registry.performUpkeep(result.performData);

    balanceAfterUSDCx = await USDCx.balanceOf({
      account: whaleAddr,
      providerOrSigner: ethersProvider,
    });

    balanceAfterDAIx = await DAIx.balanceOf({
      account: whaleAddr,
      providerOrSigner: ethersProvider,
    });

    // (Amount per month / 30) * Upper limit
    expectedDiff = parseUnits(((1000 / 30) * 5).toString(), "18");
    expectedDiffUSDC = parseInt((1000 / 30) * 5 * Math.pow(10, 6));

    expect(
      getBigNumber(balanceAfterUSDCx).sub(getBigNumber(balanceBeforeUSDCx))
    ).to.be.closeTo(parseUnits("100", 18), parseUnits("1", 18));
    expect(
      getBigNumber(balanceAfterDAIx).sub(getBigNumber(balanceBeforeDAIx))
    ).to.be.closeTo(parseUnits("100", 18), parseUnits("1", 18));

    expect(await amUSDCContract.allowance(whaleAddr, app.address)).to.equal(
      constants.Zero
    );
    expect(await amDAIContract.allowance(whaleAddr, app.address)).to.equal(
      constants.Zero
    );
  });

  it("should perform upkeep consuming some allowance (multi-token)", async () => {
    await loadFixture(setupEnv);

    await amUSDCContract
      .connect(whale)
      .approve(app.address, parseUnits("200", 6));
    await amDAIContract
      .connect(whale)
      .approve(app.address, parseUnits("200", 18));

    userFlowRate = parseUnits("1000", 18).div(getBigNumber(getSeconds(30)));

    await sf.cfaV1
      .createFlow({
        superToken: USDC.superToken,
        receiver: dummy.address,
        flowRate: userFlowRate,
      })
      .exec(whale);

    await sf.cfaV1
      .createFlow({
        superToken: DAI.superToken,
        receiver: dummy.address,
        flowRate: userFlowRate,
      })
      .exec(whale);

    await registry
      .connect(whale)
      .createTopUp(
        USDC.superToken,
        app.address,
        USDC.aToken,
        getBigNumber(getTimeStampNow()).add(getSeconds(90))
      );
    await registry
      .connect(whale)
      .createTopUp(
        DAI.superToken,
        app.address,
        DAI.aToken,
        getBigNumber(getTimeStampNow()).add(getSeconds(90))
      );

    await increaseTime(getSeconds(29));

    checkData = defaultAbiCoder.encode(["uint256"], [constants.Zero]);
    result = await registry.checkUpkeep(checkData);

    expect(result.upkeepNeeded).to.equal(true);

    balanceBeforeUSDCx = await USDCx.balanceOf({
      account: whaleAddr,
      providerOrSigner: ethersProvider,
    });

    balanceBeforeDAIx = await DAIx.balanceOf({
      account: whaleAddr,
      providerOrSigner: ethersProvider,
    });

    await registry.performUpkeep(result.performData);

    result = await registry.checkUpkeep(checkData);
    expect(result.upkeepNeeded).to.equal(true);

    await registry.performUpkeep(result.performData);

    balanceAfterUSDCx = await USDCx.balanceOf({
      account: whaleAddr,
      providerOrSigner: ethersProvider,
    });

    balanceAfterDAIx = await DAIx.balanceOf({
      account: whaleAddr,
      providerOrSigner: ethersProvider,
    });

    // (Amount per month / 30) * Upper limit
    expectedDiff = parseUnits(((1000 / 30) * 5).toString(), "18");
    expectedDiffUSDC = parseInt((1000 / 30) * 5 * Math.pow(10, 6));
    expectedDiffDAI = expectedDiff;

    expect(
      getBigNumber(balanceAfterUSDCx).sub(getBigNumber(balanceBeforeUSDCx))
    ).to.be.closeTo(expectedDiff, parseUnits("1", 18));

    expect(
      getBigNumber(balanceAfterDAIx).sub(getBigNumber(balanceBeforeDAIx))
    ).to.be.closeTo(expectedDiff, parseUnits("1", 18));

    expect(
      await amUSDCContract.allowance(whaleAddr, app.address)
    ).to.be.closeTo(
      parseUnits("200", 6).sub(getBigNumber(expectedDiffUSDC)),
      parseUnits("1", 6)
    );

    expect(await amDAIContract.allowance(whaleAddr, app.address)).to.be.closeTo(
      parseUnits("200", 18).sub(expectedDiffDAI),
      parseUnits("1", 18)
    );
  });
});
