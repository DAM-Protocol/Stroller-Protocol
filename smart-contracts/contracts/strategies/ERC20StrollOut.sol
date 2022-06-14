// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IERC20Mod.sol";
import "./StrategyBase.sol";

/// @title ERC20 auto top-up contract.
/// @author rashtrakoff (rashtrakoff@pm.me).
contract ERC20StrollOut is StrategyBase {
    using SafeERC20 for IERC20Mod;
    using SafeERC20 for ISuperToken;

    constructor(address _strollManager) {
        if (_strollManager == address(0)) revert ZeroAddress();

        strollManager = _strollManager;
    }

    /// @dev IStrategy.topUp implementation.
    function topUp(
        address _user,
        ISuperToken _superToken,
        uint256 _superTokenAmount
    ) external override {
        // Only `StrollManager` should be able to call this method.
        if (msg.sender != strollManager)
            revert UnauthorizedCaller(msg.sender, strollManager);

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
        // Ideally this statement should not be in this contract but rather in `StrollManager`. For the sake-
        // of compatibility with the existing deployments, we will not make further changes to `StrollManager`.
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
        emit TopUp(_user, address(_superToken), adjustedAmount);
    }

    /// @dev IStrategy.isSupportedSuperToken implementation.
    function isSupportedSuperToken(ISuperToken _superToken)
        public
        view
        override
        returns (bool)
    {
        return _superToken.getUnderlyingToken() != address(0);
    }
}
