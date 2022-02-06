// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

interface IStrategy {
    event TopUp(address _user, address _superToken, uint256 _amount);

    function topUp(address _user, address _lpToken, ISuperToken _superToken) external;

    function isSupportedUnderlying(address _underlyingToken) external view returns(bool);
}
