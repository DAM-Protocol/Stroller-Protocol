// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

interface IStrollManager {
    function checkTopUp(uint256 _index) external view returns (bool);

    function performTopUp(uint256 _index) external;

    function getTotalTopUps() external view returns (uint256);

    function createTopUp(
        address _superToken,
        address _strategy,
        address _liquidityToken,
        uint64 _expiry,
        uint64 _lowerLimit,
        uint64 _upperLimit
    ) external;
}
