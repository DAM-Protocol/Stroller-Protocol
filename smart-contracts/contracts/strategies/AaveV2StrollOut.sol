// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.13;

import { ILendingPoolAddressesProvider, ILendingPool, IProtocolDataProvider } from "../interfaces/IAaveV2.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./StrategyBase.sol";

/// @title AaveV2 strategy for Stroller Protocol.
/// @author rashtrakoff (rashtrakoff@pm.me).
contract AaveV2StrollOut is StrategyBase {
    using SafeERC20 for IERC20Mod;

    ILendingPoolAddressesProvider
        private immutable LENDINGPOOL_ADDRESSES_PROVIDER;
    IProtocolDataProvider private immutable PROTOCOL_DATA_PROVIDER;

    constructor(
        address _strollManager,
        ILendingPoolAddressesProvider _lendingPoolAddressProvider,
        IProtocolDataProvider _protocolDataProvider
    ) {
        if (
            _strollManager == address(0) ||
            address(_lendingPoolAddressProvider) == address(0) ||
            address(_protocolDataProvider) == address(0)
        ) revert ZeroAddress();

        strollManager = _strollManager;
        LENDINGPOOL_ADDRESSES_PROVIDER = _lendingPoolAddressProvider;
        PROTOCOL_DATA_PROVIDER = _protocolDataProvider;
    }

    function topUp(
        address _user,
        ISuperToken _superToken,
        uint256 _superTokenAmount
    ) external override {
        // Only `StrollManager` should be able to call this method.
        if (msg.sender != strollManager)
            revert UnauthorizedCaller(msg.sender, strollManager);

        IERC20Mod underlyingToken = IERC20Mod(_superToken.getUnderlyingToken());
        address lendingPool = LENDINGPOOL_ADDRESSES_PROVIDER.getLendingPool();
        (address aToken, , ) = PROTOCOL_DATA_PROVIDER.getReserveTokensAddresses(
            address(underlyingToken)
        );
        (
            uint256 underlyingAmount,
            uint256 adjustedAmount
        ) = _toUnderlyingAmount(_superTokenAmount, underlyingToken.decimals());

        // Transfer the aTokens from the user.
        IERC20Mod(aToken).safeTransferFrom(
            _user,
            address(this),
            underlyingAmount
        );

        // Withdraw underlying token from Aave using transferred aTokens.
        ILendingPool(lendingPool).withdraw(
            address(underlyingToken),
            underlyingAmount,
            address(this)
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

        if (!_superToken.transfer(_user, adjustedAmount))
            revert TransferFailed(_user, address(_superToken), adjustedAmount);

        emit TopUp(_user, address(_superToken), adjustedAmount);
    }

    function isSupportedSuperToken(ISuperToken _superToken)
        public
        view
        override
        returns (bool)
    {
        try
            PROTOCOL_DATA_PROVIDER.getReserveTokensAddresses(
                _superToken.getUnderlyingToken()
            )
        returns (address, address, address) {
            return true;
        } catch {
            return false;
        }
    }
}
