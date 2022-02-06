//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IRegistry.sol";

contract Keeper is Ownable {
    IRegistry private registry;
    uint256 private scanLength;

    constructor(address registryAddress) {
        registry = IRegistry(registryAddress);
        scanLength = 100;
    }

    function getRegistry() public view returns (address) {
        return address(registry);
    }

    function setRegistry(address _registry) public onlyOwner {
        registry = IRegistry(_registry);
    }

    function getScanLength() public view returns (uint256) {
        return scanLength;
    }

    function setScanLength(uint256 _scanLength) public onlyOwner {
        scanLength = _scanLength;
    }

    function checkUpkeep(bytes calldata checkData)
        public
        view
        returns (bool upkeepNeeded, bytes memory performData)
    {
        uint256 startIndex = abi.decode(checkData, (uint256)) * scanLength;
        uint256 endIndex = startIndex + scanLength;
        for (uint256 i = startIndex; i < endIndex; i++) {
            if (registry.checkTopUp(i)) {
                return (true, abi.encode(i));
            }
        }
    }

    function performUpkeep(bytes calldata performData) external {
        uint256 index = abi.decode(performData, (uint256));

        registry.performTopUp(index);
    }
}
