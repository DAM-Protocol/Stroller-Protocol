// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import { ILendingPoolAddressesProvider, ILendingPool, IAToken, IProtocolDataProvider } from "./interfaces/AaveInterfaces.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IStrategy.sol";
import "../interfaces/IStrollResolver.sol";
import "../common/StrollHelper.sol";
import "hardhat/console.sol";

contract AaveStrollOut is IStrategy {
    using SafeERC20 for IERC20Mod;
    // using StrollHelper for ISuperToken;

    // For Polygon mainnet
    // ILendingPoolAddressesProvider
    //     private constant LENDINGPOOL_ADDRESSES_PROVIDER =
    //     ILendingPoolAddressesProvider(
    //         0xd05e3E715d945B59290df0ae8eF85c1BdB684744
    //     );
    // IProtocolDataProvider private constant PROTOCOL_DATA_PROVIDER =
    //     IProtocolDataProvider(0x7551b5D2763519d4e37e8B81929D336De671d46d);

    // For Mumbai testnet
    ILendingPoolAddressesProvider
        private constant LENDINGPOOL_ADDRESSES_PROVIDER =
        ILendingPoolAddressesProvider(
            0x178113104fEcbcD7fF8669a0150721e231F0FD4B
        );
    IProtocolDataProvider private constant PROTOCOL_DATA_PROVIDER =
        IProtocolDataProvider(0xFA3bD19110d986c5e5E9DD5F69362d05035D045B);

    IStrollResolver private immutable strollResolver;

    constructor(IStrollResolver _strollResolver) {
        strollResolver = _strollResolver;
    }

    function topUp(
        address _user,
        address _aToken,
        ISuperToken _superToken
    ) external override {
        // Get underlying token address for the `_aToken`
        // NOTE: This line can revert a transaction if `_aToken` isn't a valid one
        address underlyingToken = IAToken(_aToken).UNDERLYING_ASSET_ADDRESS();

        require(
            _superToken.getUnderlyingToken() == underlyingToken,
            "Incorrect supertoken"
        );

        (bool reqTopUp, uint256 idealWithdrawAmount) = strollHelper.requireTopUp(
            _superToken,
            _user
        );

        // Topup is necessary only if liquidity will last for less than lowerLimit
        require(reqTopUp, "TopUp not required");

        // Get the allowance given by the user to this contract
        uint256 totalWithdrawable = IERC20Mod(_aToken).allowance(
            _user,
            address(this)
        );

        require(totalWithdrawable > 0, "Not enough allowance");

        address lendingPool = LENDINGPOOL_ADDRESSES_PROVIDER.getLendingPool();

        // If the totalWithdrawable amount is less than the idealWithdrawAmount
        // then withdraw all the aTokens available
        uint256 withdrawAmount = (totalWithdrawable > idealWithdrawAmount)
            ? idealWithdrawAmount
            : totalWithdrawable;

        // Transfer the aTokens from the user
        IERC20Mod(_aToken).safeTransferFrom(
            _user,
            address(this),
            withdrawAmount
        );

        // Withdraw underlying token from Aave using transferred aTokens
        ILendingPool(lendingPool).withdraw(
            underlyingToken,
            withdrawAmount,
            address(this)
        );

        // Giving the Supertoken max allowance for upgrades if that hasn't been done before
        if (
            IERC20Mod(underlyingToken).allowance(
                address(this),
                address(_superToken)
            ) == 0
        )
            IERC20Mod(underlyingToken).safeIncreaseAllowance(
                address(_superToken),
                type(uint256).max
            );

        // As underlying token may have less than 18 decimals, we have to scale it up for supertoken upgrades
        // Here we are assuming an underlying token cannot have decimals greater than 18
        uint256 upgradeAmount = withdrawAmount *
            (10**(18 - IERC20Mod(underlyingToken).decimals()));

        _superToken.upgrade(upgradeAmount);

        // Supertoken transfer should succeed
        require(
            _superToken.transfer(_user, upgradeAmount),
            "Supertoken transfer failed"
        );

        console.log("Withdraw amount: %s", upgradeAmount);

        emit TopUp(_user, address(_superToken), upgradeAmount);
    }

    function isSupportedUnderlying(address _underlyingToken)
        public
        view
        override
        returns (bool)
    {
        (address aToken, , ) = PROTOCOL_DATA_PROVIDER.getReserveTokensAddresses(
            _underlyingToken
        );

        return aToken != address(0);
    }

    // /// @dev As aToken and it's underlying token are 1:1 correlated
    // /// just return the amount of aToken as value of the same
    // function checkValue(
    //     address, // _user
    //     address, // _aToken
    //     uint256 _amount
    // ) public pure returns (uint256) {
    //     return _amount;
    // }
}
