/* eslint-disable node/no-unpublished-require */
/* eslint-disable no-undef */
const readlineSync = require("readline-sync");
const { getSeconds } = require("../helpers/helpers");

module.exports = async function ({ deployments, getNamedAccounts }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.info("Beginning infrastructure deployment...");

  const skipDeploy = !readlineSync.keyInYN(
    "Do you want to re-deploy if deployed already?\n"
  );

  let upperLimit, lowerLimit;
  if (skipDeploy) {
    const StrollManagerAddress = await deployments.get("StrollManager");
    const StrollManagerDeployed = await ethers.getContractAt(
      "StrollManager",
      StrollManagerAddress.address
    );

    upperLimit = await StrollManagerDeployed.minUpper();
    lowerLimit = await StrollManagerDeployed.minLower();
  } else {
    upperLimit = getSeconds(
      readlineSync.questionInt(
        "Enter the desired minimum upper limit (in days): "
      )
    );

    lowerLimit = getSeconds(
      readlineSync.questionInt(
        "Enter the desired minimum lower limit (in days): "
      )
    );
  }

  const StrollManager = await deploy("StrollManager", {
    from: deployer,
    args: [process.env.CFA_ADDRESS, lowerLimit, upperLimit],
    log: true,
    skipIfAlreadyDeployed: skipDeploy,
  });

  const ERC20StrollOut = await deploy("ERC20StrollOut", {
    from: deployer,
    args: [StrollManager.address],
    log: true,
    skipIfAlreadyDeployed: skipDeploy,
  });

  const AaveV2StrollOut = await deploy("AaveV2StrollOut", {
    from: deployer,
    args: [
      StrollManager.address,
      process.env.AAVE_LENDING_ADDRESSES_PROVIDER,
      process.env.AAVE_PROTOCOL_DATA_PROVIDER,
    ],
    log: true,
    skipIfAlreadyDeployed: skipDeploy,
  });

  if (readlineSync.keyInYN("Do you want to verify contracts?\n")) {
    try {
      await hre.run("verify:verify", {
        address: StrollManager.address,
        constructorArguments: [process.env.CFA_ADDRESS, lowerLimit, upperLimit],
        contract: "contracts/StrollManager.sol:StrollManager",
      });
    } catch (error) {
      console.log(
        `${error.message} for StrollManager at address ${StrollManager.address}`
      );
    }

    try {
      await hre.run("verify:verify", {
        address: ERC20StrollOut.address,
        constructorArguments: [StrollManager.address],
        contract: "contracts/strategies/ERC20StrollOut.sol:ERC20StrollOut",
      });
    } catch (error) {
      console.log(
        `${error.message} for ERC20StrollOut at address ${ERC20StrollOut.address}`
      );
    }

    try {
      await hre.run("verify:verify", {
        address: AaveV2StrollOut.address,
        constructorArguments: [
          StrollManager.address,
          process.env.AAVE_LENDING_ADDRESSES_PROVIDER,
          process.env.AAVE_PROTOCOL_DATA_PROVIDER,
        ],
        contract: "contracts/strategies/AaveV2StrollOut.sol:AaveV2StrollOut",
      });
    } catch (error) {
      console.log(
        `${error.message} for AaveV2StrollOut at address ${AaveV2StrollOut.address}`
      );
    }
  }

  console.info("Infrastructure setup complete !");
};
