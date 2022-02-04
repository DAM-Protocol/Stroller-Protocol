// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import {ILendingPoolAddressesProvider, ILendingPool, IAToken, IProtocolDataProvider} from "../interfaces/AaveInterfaces.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IStrategy.sol";
import "../interfaces/IStrollResolver.sol";
import "../common/StrollHelper.sol";

contract AaveStrollOut is IStrategy {
    using SafeERC20 for IERC20;
    using StrollHelper for ISuperToken;

    ILendingPoolAddressesProvider
        private constant LENDINGPOOL_ADDRESSES_PROVIDER =
        ILendingPoolAddressesProvider(
            0xd05e3E715d945B59290df0ae8eF85c1BdB684744
        );
    IProtocolDataProvider private constant PROTOCOL_DATA_PROVIDER =
        IProtocolDataProvider(0x7551b5D2763519d4e37e8B81929D336De671d46d);

    IStrollResolver private immutable strollResolver;

    constructor(IStrollResolver _strollResolver) {
        strollResolver = _strollResolver;
    }

    /// @dev Check for wrong/unsupported aToken
    function topUp(address _user, address _aToken) external override {
        // Get underlying token address for the aToken
        address underlyingToken = IAToken(_aToken).UNDERLYING_ASSET_ADDRESS();

        // Check for the supertoken of the underlying token
        ISuperToken superToken = strollResolver.supportedSuperToken(
            underlyingToken
        );

        (bool reqTopUp, uint256 idealWithdrawAmount) = superToken.requireTopUp(
            _user,
            strollResolver.lowerLimit(),
            strollResolver.upperLimit()
        );

        // Get the allowance given by the user to this contract
        uint256 totalWithdrawable = IERC20(_aToken).allowance(
            _user,
            address(this)
        );

        // Topup is necessary only if liquidity will last for less than lowerLimit
        require(reqTopUp, "TopUp not required");
        require(totalWithdrawable > 0, "Not enough allowance");

        address lendingPool = LENDINGPOOL_ADDRESSES_PROVIDER.getLendingPool();

        // If the totalWithdrawable amount is less than the idealWithdrawAmount
        // then withdraw all the aTokens available
        uint256 withdrawAmount = (totalWithdrawable > idealWithdrawAmount)
            ? idealWithdrawAmount
            : totalWithdrawable;

        // Transfer the aTokens from the user
        IERC20(_aToken).safeTransferFrom(_user, address(this), withdrawAmount);

        // Withdraw underlying token from Aave using transferred aTokens
        ILendingPool(lendingPool).withdraw(
            underlyingToken,
            withdrawAmount,
            address(this)
        );

        // Upgrade the underlying tokens just withdrawn taking care of the decimals of the underlying token
        // Here we are assuming an underlying token cannot have decimals greater than 18
        superToken.upgrade(
            withdrawAmount * (10**(18 - ERC20(underlyingToken).decimals()))
        );

        // Supertoken transfer should succeed
        require(
            superToken.transfer(_user, withdrawAmount),
            "Supertoken transfer failed"
        );

        emit TopUp(_user, address(superToken), withdrawAmount);
    }

    /// @dev As aToken and it's underlying token are 1:1 correlated
    /// just return the amount of aToken as value of the same
    function checkValue(
        address, // _user
        address, // _aToken
        uint256 _amount
    ) public pure override returns (uint256) {
        return _amount;
    }
}
