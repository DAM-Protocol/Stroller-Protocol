/* eslint-disable node/no-extraneous-require */
// eslint-disable-next-line node/no-unpublished-require
const { network, ethers } = require("hardhat");
const { hexValue } = require("@ethersproject/bytes");
const { parseEther } = require("@ethersproject/units");

const getBigNumber = (number) => ethers.BigNumber.from(number);

const getTimeStamp = (date) => Math.floor(date / 1000);

const getTimeStampNow = () => Math.floor(Date.now() / 1000);

const getDate = (timestamp) => new Date(timestamp * 1000).toDateString();

const getSeconds = (days) => 3600 * 24 * days; // Changes days to seconds

const impersonateAccounts = async (accounts) => {
  const signers = [];

  for (let i = 0; i < accounts.length; ++i) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [accounts[i]],
    });

    await network.provider.send("hardhat_setBalance", [
      accounts[i],
      hexValue(parseEther("1000")),
    ]);

    signers[i] = await ethers.getSigner(accounts[i]);
  }

  return signers;
};

const currentBlockTimestamp = async () => {
  const currentBlockNumber = await ethers.provider.getBlockNumber();
  return (await ethers.provider.getBlock(currentBlockNumber)).timestamp;
};

const increaseTime = async (seconds) => {
  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine");
};

const setNextBlockTimestamp = async (timestamp) => {
  await network.provider.send("evm_setNextBlockTimestamp", [timestamp]);
  await network.provider.send("evm_mine");
};

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

module.exports = {
  getBigNumber,
  getTimeStamp,
  getTimeStampNow,
  getDate,
  getSeconds,
  increaseTime,
  currentBlockTimestamp,
  setNextBlockTimestamp,
  impersonateAccounts,
  getEvents,
  expectedRevert,
};
