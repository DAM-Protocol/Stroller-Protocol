// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

interface IStrollResolver {
    event AddSuperToken(address _underlyingToken, address _superToken);
    event AddSupportedUnderlyingToken(address _lpToken, address _underlyingToken);
    
    function addSupportedSuperToken(ISuperToken _superToken) external;

    // function addSupportedUnderlyingToken(address _lpToken, address _underlyingToken) external;

    function supplyAssetLimit() external view returns (uint32);

    function upperLimit() external view returns (uint128);

    function lowerLimit() external view returns (uint128);

    function supportedSuperToken(address _underlyingToken)
        external
        view
        returns (ISuperToken);

    // function isSupportedUnderlyingToken(
    //     address _lpToken,
    //     address _underlyingToken
    // ) external view returns (bool);
}
