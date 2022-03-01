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

    function checkUpkeep(uint256 _checkData)
        public
        view
        returns (bool upkeepNeeded, bytes memory performData)
    {
        uint256 startIndex = _checkData * scanLength;
        uint256 endIndex = startIndex + scanLength;
        if (endIndex > manager.getTotalTopUps()) {
            endIndex = manager.getTotalTopUps();
        }
        for (uint256 i = startIndex; i < endIndex; i++) {
            if (manager.checkTopUp(i)) {
                return (
                    true,
                    abi.encodeWithSelector(this.performUpkeep.selector, i)
                );
            }
        }
    }

    function performUpkeep(uint256 _index) external {
        manager.performTopUp(_index);
    }
}
