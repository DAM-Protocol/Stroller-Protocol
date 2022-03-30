//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import {
ISuperfluid, ISuperToken
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

import {
IConstantFlowAgreementV1
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockReceiverContract {

    IConstantFlowAgreementV1 immutable public cfa;
    ISuperfluid immutable public host;

    constructor(
        ISuperfluid _host,
        IConstantFlowAgreementV1 _cfa
    ) {
        cfa = _cfa;
        host = _host;
    }

    function approve(IERC20 token, address spender, uint256 amount) public {
        token.approve(spender, amount);
    }

    function createFlow(
        address receiver,
        ISuperToken token,
        int96 flowRate
    ) public {
        host.callAgreement(
            cfa,
            abi.encodeWithSelector(
                cfa.createFlow.selector,
                token,
                receiver,
                flowRate,
                new bytes(0)
            ),
            "0x"
        );
    }
}