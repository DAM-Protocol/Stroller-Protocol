//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Keeper is Ownable {
    address private registry;

    function checkUpkeep(bytes calldata checkData)
        public
        view
        returns (bool, bytes memory)
    {
        address wallet = abi.decode(checkData, (address));
        return (wallet.balance < 1 ether, bytes(""));
    }

    function performUpkeep(bytes calldata performData) external {
        address[] memory wallets = abi.decode(performData, (address[]));
        for (uint256 i = 0; i < wallets.length; i++) {
            payable(wallets[i]).transfer(1 ether);
        }
    }
}
