const { getSeconds } = require("../helpers/helpers");

module.exports = async function ({ deployments, getNamedAccounts }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.info("\n--Beginning infrastructure deployment--\n");

  const strollManagerTestnet = await deploy("StrollManagerTestnet", {
    from: deployer,
    args: [
      "0xF4C5310E51F6079F601a5fb7120bC72a70b96e2A",
      12 * 60 * 60,
      getSeconds(2),
    ],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  const ERC20StrollOut = await deploy("ERC20StrollOut", {
    from: deployer,
    args: [strollManagerTestnet.address],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  try {
    await hre.run("verify:verify", {
      address: strollManagerTestnet.address,
      constructorArguments: [
        "0xF4C5310E51F6079F601a5fb7120bC72a70b96e2A",
        12 * 60 * 60,
        getSeconds(2),
      ],
      contract: "contracts/StrollManagerTestnet.sol:StrollManagerTestnet",
    });
  } catch (error) {
    console.log(
      `${error.message} for StrollManagerTestnet at address ${strollManagerTestnet.address}`
    );
  }

  try {
    await hre.run("verify:verify", {
      address: ERC20StrollOut.address,
      constructorArguments: [strollManagerTestnet.address],
      contract: "contracts/strategies/ERC20StrollOut.sol:ERC20StrollOut",
    });
  } catch (error) {
    console.log(
      `${error.message} for ERC20StrollOut at address ${ERC20StrollOut.address}`
    );
  }

  console.info("\n--Infrastructure setup complete !--\n");
};

module.exports.tags = ["rinkeby"];
