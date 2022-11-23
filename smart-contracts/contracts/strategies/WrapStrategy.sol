// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IERC20Mod.sol";
import "./StrategyBase.sol";

/// @title ERC20 Wrap Strategy contract
contract WrapStrategy is StrategyBase {
    using SafeERC20 for IERC20Mod;
    using SafeERC20 for ISuperToken;

    constructor(address _manager) {
        if (_manager == address(0)) revert ZeroAddress();

        manager = _manager;
    }

    /// @dev IStrategy.Wrap implementation.
    function Wrap(
        address _user,
        ISuperToken _superToken,
        uint256 _superTokenAmount
    ) external override {
        // Only `Manager` should be able to call this method.
        if (msg.sender != manager)
            revert UnauthorizedCaller(msg.sender, manager);

        IERC20Mod underlyingToken = IERC20Mod(_superToken.getUnderlyingToken());

        (
            uint256 underlyingAmount,
            uint256 adjustedAmount
        ) = _toUnderlyingAmount(_superTokenAmount, underlyingToken.decimals());

        // Transfer the underlying tokens from the user
        underlyingToken.safeTransferFrom(
            _user,
            address(this),
            underlyingAmount
        );

        // Giving the Supertoken max allowance for upgrades if that hasn't been done before.
        // We are checking for this condition as there is a possibility that in the lifetime of this contract,
        // `type(uint256).max` amount of allowance might be consumed (very low probability but still possible).
        // Ideally this statement should not be in this contract but rather in `Manager`. For the sake-
        // of compatibility with the existing deployments, we will not make further changes to `Manager`.
        if (
            underlyingToken.allowance(address(this), address(_superToken)) <=
            underlyingAmount
        )
            underlyingToken.safeIncreaseAllowance(
                address(_superToken),
                type(uint256).max
            );

        // Upgrade the necessary amount of supertokens and transfer them to a user.
        // We are assuming that `upgrade` function will revert upon failure of supertoken transfer to user.
        // If not, we need to check for the same after calling this method.
        _superToken.upgrade(adjustedAmount);
        _superToken.safeTransfer(_user, adjustedAmount);
        emit Wrapped(_user, address(_superToken), adjustedAmount);
    }

    /// @dev IStrategy.isSupportedSuperToken implementation.
    function isSupportedSuperToken(ISuperToken superToken)
        public
        view
        override
        returns (bool)
    {
        return superToken.getUnderlyingToken() != address(0);
    }
}
