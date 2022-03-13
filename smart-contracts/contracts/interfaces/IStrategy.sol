// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

interface IStrategy {
    event TopUp(address _user, address _superToken, uint256 _superTokenAmount);

    function topUp(address _user, ISuperToken _superToken, uint256 _superTokenAmount) external;

    function isSupportedSuperToken(ISuperToken _superToken) external view returns(bool);
}
