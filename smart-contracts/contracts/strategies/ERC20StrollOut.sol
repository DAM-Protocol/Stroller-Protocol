// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IStrategy.sol";
import "../interfaces/IERC20Mod.sol";
import "hardhat/console.sol";

contract ERC20StrollOut is Ownable, IStrategy {
    using SafeERC20 for IERC20Mod;

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
        address _underlyingToken,
        ISuperToken _superToken,
        uint256 _amount
    ) external override {
        require(msg.sender == strollManager, "Caller not authorised");

        require(
            _superToken.getUnderlyingToken() == _underlyingToken,
            "Incorrect supertoken"
        );

        // Transfer the aTokens from the user
        IERC20Mod(_underlyingToken).safeTransferFrom(
            _user,
            address(this),
            _amount
        );

        // Giving the Supertoken max allowance for upgrades if that hasn't been done before
        if (
            IERC20Mod(_underlyingToken).allowance(
                address(this),
                address(_superToken)
            ) == 0
        )
            IERC20Mod(_underlyingToken).safeIncreaseAllowance(
                address(_superToken),
                type(uint256).max
            );

        // As the underlying token may have less than 18 decimals, we have to scale it up for supertoken upgrades
        // Here we are assuming an underlying token cannot have decimals greater than 18
        uint256 upgradeAmount = _amount *
            (10**(18 - IERC20Mod(_underlyingToken).decimals()));

        // Upgrade the necessary amount of supertokens
        _superToken.upgrade(upgradeAmount);

        // Supertoken transfer should succeed
        require(
            _superToken.transfer(_user, upgradeAmount),
            "Supertoken transfer failed"
        );

        emit TopUp(_user, address(_superToken), upgradeAmount);
    }

    function isSupportedSuperToken(ISuperToken _superToken)
        public
        view
        override
        returns (bool)
    {
        // All supertokens are supported except native supertokens.
        // Here we are assuming a call to the method `getUnderlyingToken` will fail for a native supertoken
        try _superToken.getUnderlyingToken() returns(address) {
            return true;
        } catch (bytes memory /* _error */) {
            return false;
        }
    }
}
