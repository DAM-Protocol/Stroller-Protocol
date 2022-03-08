// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import { ILendingPoolAddressesProvider, ILendingPool, IAToken, IProtocolDataProvider } from "./interfaces/AaveInterfaces.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IStrategy.sol";
import "../interfaces/IERC20Mod.sol";
import "hardhat/console.sol";

contract AaveStrollOut is Ownable, IStrategy {
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

    address private strollManager;

    constructor(address _strollManager) {
        strollManager = _strollManager;
    }

    function changeStrollManager(address _newStrollManager) external onlyOwner {
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
        address _aToken,
        ISuperToken _superToken,
        uint256 _amount
    ) external override {
        require(msg.sender == strollManager, "Caller not authorised");

        // Get underlying token address for the `_aToken`
        // NOTE: This line can revert a transaction if `_aToken` isn't a valid one
        address underlyingToken = IAToken(_aToken).UNDERLYING_ASSET_ADDRESS();

        require(
            _superToken.getUnderlyingToken() == underlyingToken,
            "Incorrect supertoken"
        );

        address lendingPool = LENDINGPOOL_ADDRESSES_PROVIDER.getLendingPool();

        // Transfer the aTokens from the user
        IERC20Mod(_aToken).safeTransferFrom(_user, address(this), _amount);

        // Withdraw underlying token from Aave using transferred aTokens
        ILendingPool(lendingPool).withdraw(
            underlyingToken,
            _amount,
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

        // As the underlying token may have less than 18 decimals, we have to scale it up for supertoken upgrades
        // Here we are assuming an underlying token cannot have decimals greater than 18
        uint256 upgradeAmount = _amount *
            (10**(18 - IERC20Mod(underlyingToken).decimals()));

        // // Upgrade the necessary amount of supertokens
        // _superToken.upgrade(upgradeAmount);

        // // Supertoken transfer should succeed
        // require(
        //     _superToken.transfer(_user, upgradeAmount),
        //     "Supertoken transfer failed"
        // );

        // Upgrade the necessary amount of supertokens and transfer them to a user.
        // We are assuming that `upgradeTo` function will revert upon failure of supertoken transfer to user.
        // If not, we need to check for the same after calling this method.
        _superToken.upgradeTo(_user, upgradeAmount, " ");
        
        console.log("Withdraw amount: %s", upgradeAmount);

        emit TopUp(_user, address(_superToken), upgradeAmount);
    }

    function isSupportedSuperToken(ISuperToken _superToken)
        public
        view
        override
        returns (bool)
    {
        (address aToken, , ) = PROTOCOL_DATA_PROVIDER.getReserveTokensAddresses(
            _superToken.getUnderlyingToken()
        );

        return aToken != address(0);
    }
}
