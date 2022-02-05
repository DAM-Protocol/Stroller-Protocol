//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Registry is Ownable {
    address private keeper;

    struct TopUp {
        address owner;
        address superToken;
        address[] liquidityToken;
        uint256 time;
    }

    TopUp[] public topups;

    constructor(address _keeper) {
        keeper = _keeper;
    }

    function addTask(
        address _superToken,
        address[] memory _liquidityToken,
        uint256 _time
    ) public {
        require(_superToken != address(0), "0 Address not allowed");

        TopUp memory task = TopUp(
            msg.sender,
            _superToken,
            _liquidityToken,
            _time
        );
        topups.push(task);
    }

    function deleteTask(uint256 _index) public {
        require(_index < topups.length, "Index out of bounds");
        require(
            topups[_index].owner == msg.sender,
            "Only owner can delete task"
        );

        topups[_index] = topups[topups.length - 1];
        topups.pop();
    }

    function getTask(uint256 _index)
        public
        view
        returns (
            address,
            address,
            address[] memory,
            uint256
        )
    {
        require(_index < topups.length, "Index out of bounds");
        return (
            topups[_index].owner,
            topups[_index].superToken,
            topups[_index].liquidityToken,
            topups[_index].time
        );
    }

    function checkTask(uint256 _index) public {}
}
