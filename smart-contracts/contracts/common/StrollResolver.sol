// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IStrollResolver.sol";

contract StrollResolver is Ownable, IStrollResolver {
    /// @notice Number of LP tokens or equivalent assets that a user can provide for making top ups
    uint32 public override supplyAssetLimit;

    /// @notice Number of seconds, hours or days worth of liquidity to be topped up with
    uint128 public override upperLimit;

    /// @notice Number of seconds, hours or days worth of liquidity below which top up is done
    uint128 public override lowerLimit;

    /// @notice Map of underlying tokens and their super tokens
    mapping(address => ISuperToken) public override supportedSuperToken;

    /// @notice Maps LP tokens with supported underlying tokens
    // mapping(address => mapping(address => bool))
    //     public
    //     override isSupportedUnderlyingToken;

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

    // function addSupportedUnderlyingToken(address _lpToken, _underlyingToken)
    //     external
    //     override
    // {
    //     _onlyOwner(msg.sender);
    //     require(
    //         !isSupportedUnderlyingToken[_lpToken][_underlyingToken],
    //         "Underlying already supported"
    //     );
    //     require(_lpToken != address(0) && _underlyingToken != address(0), "Null addresses");

    //     isSupportedUnderlyingToken[_lpToken][_underlyingToken] = true;

    //     emit AddSupportedUnderlyingToken(_lpToken, _underlyingToken);
    // }

    function _onlyOwner(address _caller) internal view {
        require(_caller == owner(), "Not owner");
    }
}
