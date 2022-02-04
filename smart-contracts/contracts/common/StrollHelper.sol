// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

library StrollHelper {
    IConstantFlowAgreementV1 public constant CFA_V1 =
        IConstantFlowAgreementV1(0x6EeE6060f715257b970700bc2656De21dEdF074C);

    function requireTopUp(
        ISuperToken _superToken,
        address _user,
        uint128 _lowerLimit,
        uint128 _upperLimit
    ) external view returns (bool, uint256) {
        int96 flowRate = CFA_V1.getNetFlow(_superToken, _user);
        if (flowRate < 0) {
            uint256 balance = _superToken.balanceOf(_user);
            uint256 positiveFlowRate = uint256(uint96(-1 * flowRate));

            if (balance <= (positiveFlowRate * _lowerLimit)) {
                uint256 topUpAmount = positiveFlowRate * _upperLimit;
                return (true, topUpAmount);
            }
        }

        return (false, 0);
    }
}
