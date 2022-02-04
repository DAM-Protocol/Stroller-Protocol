// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

interface IStrategy {
    event TopUp(address _user, address _superToken, uint256 _amount);
    function topUp(address _user, address _lpToken) external;
    function checkValue(address _user, address _lpToken, uint256 _amount) external view returns(uint256);
}