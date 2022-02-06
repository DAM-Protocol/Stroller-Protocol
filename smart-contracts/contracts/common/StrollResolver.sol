// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IStrollResolver.sol";

/**
 * @title Resolver contract for Stroll
 * @author rashtrakoff
 * @dev
 */
contract StrollResolver is Ownable, IStrollResolver {
    /// @notice Number of LP tokens or equivalent assets that a user can provide for making top ups
    uint32 public override supplyAssetLimit;

    /// @notice Number of seconds, hours or days worth of liquidity to be topped up with
    uint128 public override upperLimit;

    /// @notice Number of seconds, hours or days worth of liquidity below which top up is done
    uint128 public override lowerLimit;

    /// @notice Registry contract containing top up data
    address public override strollRegistry;

    /// @notice Map of underlying tokens and their super tokens
    mapping(address => ISuperToken) public override supportedSuperToken;

    constructor(
        uint32 _supplyAssetLimit,
        uint128 _upperLimit,
        uint128 _lowerLimit
    ) {
        supplyAssetLimit = _supplyAssetLimit;
        upperLimit = _upperLimit;
        lowerLimit = _lowerLimit;
    }

    /// @dev Check if this function needs to be modified for native super tokens
    function addSupportedSuperToken(ISuperToken _superToken) external override {
        _onlyOwner(msg.sender);
        address underlyingToken = _superToken.getUnderlyingToken();

        require(
            address(supportedSuperToken[underlyingToken]) == address(0),
            "Supertoken already exists"
        );

        supportedSuperToken[underlyingToken] = _superToken;

        emit AddSuperToken(underlyingToken, address(_superToken));
    }

    function changeSupplyAssetLimit(uint32 _newSupplyLimit) external override {
        _onlyOwner(msg.sender);
        require(supplyAssetLimit > 0, "Invalid supply assets limit");

        supplyAssetLimit = _newSupplyLimit;

        emit ChangedSupplyAssetLimit(_newSupplyLimit);
    }

    function changeUpperLimit(uint128 _newUpperLimit) external override {
        _onlyOwner(msg.sender);
        require(_newUpperLimit > lowerLimit, "Invalid upper limit");

        upperLimit = _newUpperLimit;

        emit ChangedUpperLimit(_newUpperLimit);
    }

    function changeLowerLimit(uint128 _newLowerLimit) external override {
        _onlyOwner(msg.sender);
        require(_newLowerLimit < upperLimit, "Invalid lower limit");

        lowerLimit = _newLowerLimit;

        emit ChangedLowerLimit(_newLowerLimit);
    }

    function changeStrollRegistry(address _strollRegistry) external override {
        _onlyOwner(msg.sender);
        require(_strollRegistry != address(0), "Null address");

        strollRegistry = _strollRegistry;

        emit ChangedStrollRegistry(_strollRegistry);
    }

    function _onlyOwner(address _caller) internal view {
        require(_caller == owner(), "Not owner");
    }
}
