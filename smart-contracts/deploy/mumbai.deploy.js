const { getBigNumber, getSeconds } = require("../helpers/helpers");

module.exports = async function ({ deployments, getNamedAccounts }) {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.info("\n--Beginning infrastructure deployment--\n");

    const strollHelper = await deploy("StrollHelper", {
        from: deployer,
        log: true,
        skipIfAlreadyDeployed: true,
    });

    const strollResolver = await deploy("StrollResolver", {
        from: deployer,
        args: [1, getSeconds(5), getSeconds(1)],
        log: true,
        skipIfAlreadyDeployed: true,
    });

    const aaveStrollOut = await deploy("AaveStrollOut", {
        from: deployer,
        args: [strollResolver.address],
        libraries: {
            StrollHelper: strollHelper.address,
        },
        log: true,
        skipIfAlreadyDeployed: true,
    });

    const registry = await deploy("Registry", {
        from: deployer,
        args: [strollResolver.address, "100"],
        libraries: {
            StrollHelper: strollHelper.address,
        },
        log: true,
        skipIfAlreadyDeployed: true,
    });

    const resolver = await ethers.getContractAt("StrollResolver", strollResolver.address);

    await resolver.changeStrollRegistry(registry.address);

    try {
        await hre.run("verify:verify", {
            address: strollHelper.address,
            contract: "contracts/common/StrollHelper.sol:StrollHelper",
        });
    } catch (error) {
        console.log(`${error.message} for StrollHelper at address ${strollHelper.address}`);
    }

    try {
        await hre.run("verify:verify", {
            address: strollResolver.address,
            contract: "contracts/common/StrollResolver.sol:StrollResolver",
        });
    } catch (error) {
        console.log(`${error.message} for StrollResolver at address ${strollResolver.address}`);
    }

    try {
        await hre.run("verify:verify", {
            address: aaveStrollOut.address,
            libraries: {
                StrollHelper: strollHelper.address,
            },
            contract: "contracts/strategies/AaveStrollOut.sol:AaveStrollOut",
        });
    } catch (error) {
        console.log(`${error.message} for AaveStrollOut at address ${aaveStrollOut.address}`);
    }

    try {
        await hre.run("verify:verify", {
            address: registry.address,
            libraries: {
                StrollHelper: strollHelper.address,
            },
            contract: "contracts/Registry.sol:Registry",
        });
    } catch (error) {
        console.log(`${error.message} for Registry at address ${registry.address}`);
    }

    console.info("\n--Infrastructure setup complete !--\n");
};
