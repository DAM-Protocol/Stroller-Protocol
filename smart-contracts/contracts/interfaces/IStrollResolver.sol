// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

interface IStrollResolver {
    function supplyAssetLimit() external view returns (uint32);

    function upperLimit() external view returns (uint128);

    function lowerLimit() external view returns (uint128);

    function supportedSuperToken(address _underlyingToken)
        external
        view
        returns (ISuperToken);

    function isSupportedUnderlyingToken(
        address _lpToken,
        address _underlyingToken
    ) external view returns (bool);

    
}
