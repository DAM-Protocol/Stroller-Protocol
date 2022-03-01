//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "../interfaces/IStrollManager.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ChainLinkKeeper is Ownable {
    IStrollManager public manager;
    uint256 public scanLength;

    constructor(IStrollManager _manager, uint256 _scanLength) {
        manager = _manager;
        scanLength = _scanLength;
    }

    function setManager(IStrollManager _manager) public onlyOwner {
        manager = _manager;
    }

    function checkUpkeep(bytes calldata checkData)
        public
        view
        returns (bool upkeepNeeded, bytes memory performData)
    {
        uint256 startIndex = abi.decode(checkData, (uint256)) * scanLength;
        uint256 endIndex = startIndex + scanLength;
        if (endIndex > manager.getTotalTopUps()) {
            endIndex = manager.getTotalTopUps();
        }
        for (uint256 i = startIndex; i < endIndex; i++) {
            if (manager.checkTopUp(i)) {
                return (true, abi.encode(i));
            }
        }
    }

    function performUpkeep(bytes calldata performData) external {
        uint256 index = abi.decode(performData, (uint256));
        manager.performTopUp(index);
    }
}
