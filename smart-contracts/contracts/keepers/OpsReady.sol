// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IOps {
    function gelato() external view returns (address payable);

    function getFeeDetails() external view returns (uint256, address);

    function createTask(
        address _execAddress,
        bytes4 _execSelector,
        address _resolverAddress,
        bytes calldata _resolverData
    ) external returns (bytes32 task);

    function createTaskNoPrepayment(
        address _execAddress,
        bytes4 _execSelector,
        address _resolverAddress,
        bytes calldata _resolverData,
        address _feeToken
    ) external returns (bytes32 task);

    function cancelTask(bytes32 _taskId) external;
}

abstract contract OpsReady {
    IOps public immutable ops;
    address payable public immutable gelato;
    address public constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    modifier onlyOps() {
        require(msg.sender == address(ops), "OpsReady: onlyOps");
        _;
    }

    constructor(address _ops) {
        ops = IOps(_ops);
        gelato = IOps(_ops).gelato();
    }

    function _transfer(uint256 _amount, address _paymentToken) internal {
        if (_paymentToken == ETH) {
            (bool success, ) = gelato.call{value: _amount}("");
            require(success, "_transfer: ETH transfer failed");
        } else {
            SafeERC20.safeTransfer(IERC20(_paymentToken), gelato, _amount);
        }
    }

    function getResolverHash(
        address _resolverAddress,
        bytes memory _resolverData
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(_resolverAddress, _resolverData));
    }

    function getTaskId(
        address _taskCreator,
        address _execAddress,
        bytes4 _selector,
        bool _useTaskTreasuryFunds,
        address _feeToken,
        bytes32 _resolverHash
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    _taskCreator,
                    _execAddress,
                    _selector,
                    _useTaskTreasuryFunds,
                    _feeToken,
                    _resolverHash
                )
            );
    }
}
