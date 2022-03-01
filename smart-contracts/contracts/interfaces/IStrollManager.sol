// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

interface IStrollManager {
    function checkTopUp(uint256 _index) external view returns (bool);

    function performTopUp(uint256 _index) external;

    function getTotalTopUps() external view returns (uint256);
}
