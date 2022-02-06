// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

interface IRegistry {
    function checkTopUp(uint256 _index) external view returns (bool);

    function performTopUp(uint256 _index) external;
}
