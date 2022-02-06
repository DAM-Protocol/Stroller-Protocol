// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

interface IStrollResolver {
    event AddSuperToken(address _underlyingToken, address _superToken);
    event AddSupportedUnderlyingToken(
        address _lpToken,
        address _underlyingToken
    );
    event ChangedSupplyAssetLimit(uint32 _newSupplyLimit);
    event ChangedUpperLimit(uint128 _newUpperLimit);
    event ChangedLowerLimit(uint128 _newLowerLimit);
    event ChangedStrollRegistry(address _newStrollRegistry);

    function addSupportedSuperToken(ISuperToken _superToken) external;

    function changeSupplyAssetLimit(uint32 _newSupplyLimit) external;

    function changeUpperLimit(uint128 _newUpperLimit) external;

    function changeStrollRegistry(address _strollRegistry) external;

    function changeLowerLimit(uint128 _newLowerLimit) external;

    function supplyAssetLimit() external view returns (uint32);

    function upperLimit() external view returns (uint128);

    function lowerLimit() external view returns (uint128);

    function strollRegistry() external view returns (address);

    function supportedSuperToken(address _underlyingToken)
        external
        view
        returns (ISuperToken);
}
