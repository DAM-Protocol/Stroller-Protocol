// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract StrollResolver is Ownable {
    /// @notice Number of LP tokens or equivalent assets that a user can provide for making top ups
    uint32 public supplyAssetLimit;

    /// @notice Number of seconds, hours or days worth of liquidity to be topped up with
    uint128 public upperLimit;

    /// @notice Number of seconds, hours or days worth of liquidity below which top up is done
    uint128 public lowerLimit;

    /// @notice Map of underlying tokens and their super tokens
    mapping(address => address) public supportedSuperToken;

    /// @notice Maps LP tokens with supported underlying tokens
    mapping(address => mapping(address => bool))
        public isSupportedUnderlyingToken;

    constructor(
        uint32 _supplyAssetLimit,
        uint128 _upperLimit,
        uint128 _lowerLimit
    ) {
        supplyAssetLimit = _supplyAssetLimit;
        upperLimit = _upperLimit;
        lowerLimit = _lowerLimit;
    }
}
