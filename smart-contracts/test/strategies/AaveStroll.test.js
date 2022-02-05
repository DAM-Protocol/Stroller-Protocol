/* eslint-disable no-undef */
const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const { provider, loadFixture } = waffle;
const { parseUnits } = require("@ethersproject/units");
const SuperfluidSDK = require("@superfluid-finance/sdk-core");
const {
  getBigNumber,
  getSeconds,
  increaseTime,
  impersonateAccounts,
} = require("../../helpers/helpers");
const { constants } = require("ethers");

describe("Aave Stroll Out Testing", function () {
  const DAI = {
    token: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    superToken: "0x1305f6b6df9dc47159d12eb7ac2804d4a33173c2",
    aToken: "0x27F8D03b3a2196956ED754baDc28D73be8830A6e",
    decimals: 18,
  };
  const USDC = {
    token: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    superToken: "0xcaa7349cea390f89641fe306d93591f87595dc1f",
    aToken: "0x1a13F4Ca1d028320A707D99520AbFefca3998b7F",
    decimals: 6,
  };

  const USDCWhaleAddr = "0x947d711c25220d8301c087b25ba111fe8cbf6672";
  const DAIWhaleAddr = "0x85fcd7dd0a1e1a9fcd5fd886ed522de8221c3ee5";
  const amDAIWhaleAddr = "0xad0135af20fa82e106607257143d0060a7eb5cbf";
  const amUSDCWhaleAddr = "0x2b67a3c0b90f6ae4394210692f69968d02970126";

  const [admin, dummy] = provider.getWallets();
  const ethersProvider = provider;

  let sf;
  let USDCWhale, DAIWhale, amDAIWhale, amUSDCWhale;
  let DAIContract, USDCContract, amDAIContract, amUSDCContract;
  let USDCx, DAIx;
  let app, appFactory, strollResolver;

  before(async () => {
    [USDCWhale, DAIWhale, amDAIWhale, amUSDCWhale] = await impersonateAccounts([
      USDCWhaleAddr,
      DAIWhaleAddr,
      amDAIWhaleAddr,
      amUSDCWhaleAddr,
    ]);

    DAIContract = await ethers.getContractAt("IERC20", DAI.token);
    USDCContract = await ethers.getContractAt("IERC20", USDC.token);
    amDAIContract = await ethers.getContractAt("IERC20", DAI.aToken);
    amUSDCContract = await ethers.getContractAt("IERC20", USDC.aToken);

    sf = await SuperfluidSDK.Framework.create({
      networkName: "hardhat",
      dataMode: "WEB3_ONLY",
      resolverAddress: "0xE0cc76334405EE8b39213E620587d815967af39C", // Polygon mainnet resolver
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

    await strollResolver.addSupportedSuperToken(USDC.superToken);
    await strollResolver.addSupportedSuperToken(DAI.superToken);

    appFactory = await ethers.getContractFactory("AaveStrollOut", {
      libraries: {
        StrollHelper: strollHelper.address,
      },
      admin,
    });
  });

  async function setupEnv() {
    app = await appFactory.deploy(strollResolver.address);
    await app.deployed();
    await approveAndFund();
  }

  async function approveAndFund() {
    await USDCContract.connect(USDCWhale).approve(
      USDC.superToken,
      parseUnits("1000000", 6)
    );
    await DAIContract.connect(DAIWhale).approve(
      DAI.superToken,
      parseUnits("1000000", 18)
    );

    await USDCx.upgrade({ amount: parseUnits("1000", 18) }).exec(USDCWhale);
    await DAIx.upgrade({ amount: parseUnits("1000", 18) }).exec(DAIWhale);

    // await USDCx.transfer({
    //   receiver: admin.address,
    //   amount: parseUnits("1000", 18),
    // }).exec(USDCWhale);

    // await DAIx.transfer({
    //   receiver: admin.address,
    //   amount: parseUnits("1000", 18),
    // }).exec(DAIWhale);

    await amDAIContract
      .connect(amDAIWhale)
      .transfer(DAIWhaleAddr, parseUnits("1000", 18));

    await amUSDCContract
      .connect(amUSDCWhale)
      .transfer(USDCWhaleAddr, parseUnits("1000", 6));
  }

  it("should top up an account consuming all allowance", async () => {
    await loadFixture(setupEnv);

    await amDAIContract
      .connect(DAIWhale)
      .approve(app.address, parseUnits("100", 18));
    await amUSDCContract
      .connect(USDCWhale)
      .approve(app.address, parseUnits("100", 6));

    userFlowRate = parseUnits("1000", 18).div(getBigNumber(getSeconds(30)));

    await sf.cfaV1
      .createFlow({
        superToken: USDC.superToken,
        receiver: dummy.address,
        flowRate: userFlowRate,
      })
      .exec(USDCWhale);

    await sf.cfaV1
      .createFlow({
        superToken: DAI.superToken,
        receiver: dummy.address,
        flowRate: userFlowRate,
      })
      .exec(DAIWhale);

    await increaseTime(getSeconds(29));

    balanceBeforeUSDC = await USDCx.balanceOf({
      account: USDCWhaleAddr,
      providerOrSigner: ethersProvider,
    });

    balanceBeforeDAI = await DAIx.balanceOf({
      account: DAIWhaleAddr,
      providerOrSigner: ethersProvider,
    });

    await app.topUp(USDCWhaleAddr, USDC.aToken, USDC.superToken);
    await app.topUp(DAIWhaleAddr, DAI.aToken, DAI.superToken);

    balanceAfterUSDC = await USDCx.balanceOf({
      account: USDCWhaleAddr,
      providerOrSigner: ethersProvider,
    });

    balanceAfterDAI = await DAIx.balanceOf({
      account: DAIWhaleAddr,
      providerOrSigner: ethersProvider,
    });

    expect(
      getBigNumber(balanceAfterUSDC).sub(getBigNumber(balanceBeforeUSDC))
    ).to.be.closeTo(parseUnits("100", 18), parseUnits("1", 18));

    expect(
      getBigNumber(balanceAfterDAI).sub(getBigNumber(balanceBeforeDAI))
    ).to.be.closeTo(parseUnits("100", 18), parseUnits("1", 18));

    expect(await amUSDCContract.allowance(USDCWhaleAddr, app.address)).to.equal(
      constants.Zero
    );

    expect(await amDAIContract.allowance(DAIWhaleAddr, app.address)).to.equal(
      constants.Zero
    );
  });

  it.only("should top up an account consuming some allowance", async () => {
    await loadFixture(setupEnv);

    userFlowRate = parseUnits("1000", 18).div(getBigNumber(getSeconds(30)));

    await amDAIContract
      .connect(DAIWhale)
      .approve(app.address, parseUnits("200", 18));
    await amUSDCContract
      .connect(USDCWhale)
      .approve(app.address, parseUnits("200", 6));

    await sf.cfaV1
      .createFlow({
        superToken: USDC.superToken,
        receiver: dummy.address,
        flowRate: userFlowRate,
      })
      .exec(USDCWhale);

    await sf.cfaV1
      .createFlow({
        superToken: DAI.superToken,
        receiver: dummy.address,
        flowRate: userFlowRate,
      })
      .exec(DAIWhale);

    await increaseTime(getSeconds(29));

    balanceBeforeUSDCx = await USDCx.balanceOf({
      account: USDCWhaleAddr,
      providerOrSigner: ethersProvider,
    });

    balanceBeforeDAIx = await DAIx.balanceOf({
      account: DAIWhaleAddr,
      providerOrSigner: ethersProvider,
    });

    await app.topUp(USDCWhaleAddr, USDC.aToken, USDC.superToken);
    await app.topUp(DAIWhaleAddr, DAI.aToken, DAI.superToken);

    balanceAfterUSDCx = await USDCx.balanceOf({
      account: USDCWhaleAddr,
      providerOrSigner: ethersProvider,
    });

    balanceAfterDAIx = await DAIx.balanceOf({
      account: DAIWhaleAddr,
      providerOrSigner: ethersProvider,
    });

    // (Amount per month / 30) * Upper limit
    expectedDiff = parseUnits(((1000 / 30) * 5).toString(), "18");

    console.log("Expected diff: ", expectedDiff.toString());
    console.log("Balance before USDCx: ", balanceBeforeUSDCx);
    console.log("Balance after USDCx: ", balanceAfterUSDCx);

    // expectedDiffUSDCx = getBigNumber(balanceBeforeUSDCx).add(expectedDiff);
    // expectedDiffDAIx = getBigNumber(balanceBeforeDAIx).add(expectedDiff);

    // console.log("Expected diff USDCx: ", expectedDiffUSDCx);

    expect(
      getBigNumber(balanceAfterUSDCx).sub(getBigNumber(balanceBeforeUSDCx))
    ).to.be.closeTo(expectedDiff, parseUnits("1", 18));

    expect(
      getBigNumber(balanceAfterDAIx).sub(getBigNumber(balanceBeforeDAIx))
    ).to.be.closeTo(expectedDiff, parseUnits("1", 18));

    expect(await amUSDCContract.allowance(USDCWhaleAddr, app.address)).to.equal(
      parseUnits("200", 18).sub(expectedDiff)
    );

    expect(await amDAIContract.allowance(DAIWhaleAddr, app.address)).to.equal(
      parseUnits("200", 18).sub(expectedDiff)
    );
  });
});
