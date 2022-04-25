// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import { ILendingPoolAddressesProvider, ILendingPool, IAToken, IProtocolDataProvider } from "../interfaces/IAaveV2.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IStrategy.sol";
import "../interfaces/IERC20Mod.sol";
import "hardhat/console.sol";

contract AaveV2StrollOut is Ownable, IStrategy {
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
    // ILendingPoolAddressesProvider
    //     private immutable LENDINGPOOL_ADDRESSES_PROVIDER =
    //     ILendingPoolAddressesProvider(
    //         0x178113104fEcbcD7fF8669a0150721e231F0FD4B
    //     );
    // IProtocolDataProvider private immutable PROTOCOL_DATA_PROVIDER =
    //     IProtocolDataProvider(0xFA3bD19110d986c5e5E9DD5F69362d05035D045B);

    ILendingPoolAddressesProvider
        private immutable LENDINGPOOL_ADDRESSES_PROVIDER;
    IProtocolDataProvider private immutable PROTOCOL_DATA_PROVIDER;

    address public strollManager;

    event StrollManagerChanged(
        address indexed oldStrollManager,
        address indexed strollManager
    );

    constructor(
        address _strollManager,
        ILendingPoolAddressesProvider _lendingPoolAddressProvider,
        IProtocolDataProvider _protocolDataProvider
    ) {
        require(_strollManager != address(0), "zero address");
        require(
            address(_lendingPoolAddressProvider) != address(0),
            "zero address"
        );
        require(address(_protocolDataProvider) != address(0), "zero address");

        strollManager = _strollManager;
        LENDINGPOOL_ADDRESSES_PROVIDER = _lendingPoolAddressProvider;
        PROTOCOL_DATA_PROVIDER = _protocolDataProvider;
    }

    function changeStrollManager(address _newStrollManager) external onlyOwner {
        require(_newStrollManager != address(0), "zero address");
        
        emit StrollManagerChanged(strollManager, _newStrollManager);
        
        strollManager = _newStrollManager;
    }

    /**
     * @dev This function assumes whatever given by StrollManager is correct. Therefore, all the necessary
     * checks such as if a top-up is required and if so how much amount needs to be topped up, do we have
     * enough allowance to perform a top-up and so on must be performed in StrollManager only.
     *
     * Should some checks still be performed ? One possible scenario is that a user might replenish their wallet
     * with supertoken that we initiated a top-up for making a top-up unnecessary. This could happen because of
     * unfortunate transaction timings or maybe by malicious actors/users (front-running ?)
     */
    function topUp(
        address _user,
        ISuperToken _superToken,
        uint256 _superTokenAmount
    ) external override {
        require(msg.sender == strollManager, "Caller not authorised");
        require(isSupportedSuperToken(_superToken), "SuperToken not supported");

        IERC20Mod underlyingToken = IERC20Mod(_superToken.getUnderlyingToken());
        address lendingPool = LENDINGPOOL_ADDRESSES_PROVIDER.getLendingPool();

        // Get underlying token address for the `aToken`.
        // NOTE: This line can revert a transaction if `aToken` isn't a valid one.
        (address aToken, , ) = PROTOCOL_DATA_PROVIDER.getReserveTokensAddresses(
            address(underlyingToken)
        );

        (
            uint256 underlyingAmount,
            uint256 adjustedAmount
        ) = _toUnderlyingAmount(_superTokenAmount, underlyingToken.decimals());

        // console.log("Underlying amount: %s", underlyingAmount);

        // Transfer the aTokens from the user
        IERC20Mod(aToken).safeTransferFrom(
            _user,
            address(this),
            underlyingAmount
        );

        // Withdraw underlying token from Aave using transferred aTokens
        ILendingPool(lendingPool).withdraw(
            address(underlyingToken),
            underlyingAmount,
            address(this)
        );

        // Giving the Supertoken max allowance for upgrades if that hasn't been done before
        if (underlyingToken.allowance(address(this), address(_superToken)) == 0)
            underlyingToken.safeIncreaseAllowance(
                address(_superToken),
                type(uint256).max
            );

        // Upgrade the necessary amount of supertokens and transfer them to a user.
        // We are assuming that `upgradeTo` function will revert upon failure of supertoken transfer to user.
        // If not, we need to check for the same after calling this method.
        _superToken.upgrade(adjustedAmount);
        _superToken.transfer(_user, adjustedAmount);

        // console.log("Top-up amount: %s", adjustedAmount);

        emit TopUp(_user, address(_superToken), adjustedAmount);
    }

    function emergencyWithdraw(address token) external onlyOwner {
        IERC20(token).transfer(
            msg.sender,
            IERC20(token).balanceOf(address(this))
        );
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

    function _toUnderlyingAmount(uint256 _amount, uint256 _underlyingDecimals)
        internal
        pure
        returns (uint256 _underlyingAmount, uint256 _adjustedAmount)
    {
        uint256 factor;
        if (_underlyingDecimals < 18) {
            // If underlying has less decimals
            // one can upgrade less "granular" amount of tokens
            factor = 10**(18 - _underlyingDecimals);
            _underlyingAmount = _amount / factor;
            // remove precision errors
            _adjustedAmount = _underlyingAmount * factor;
        } else if (_underlyingDecimals > 18) {
            // If underlying has more decimals
            // one can upgrade more "granular" amount of tokens
            factor = 10**(_underlyingDecimals - 18);
            _underlyingAmount = _amount * factor;
            _adjustedAmount = _amount;
        } else {
            _underlyingAmount = _adjustedAmount = _amount;
        }
    }
}
