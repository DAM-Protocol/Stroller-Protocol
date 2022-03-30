// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IStrategy.sol";
import "../interfaces/IERC20Mod.sol";

contract ERC20StrollOut is Ownable, IStrategy {
    using SafeERC20 for IERC20Mod;

    address public strollManager;

    event StrollManagerChanged(address indexed oldStrollManager, address indexed strollManager);

    constructor(address _strollManager) {
        require(_strollManager != address(0), "zero address");
        strollManager = _strollManager;
    }

    function changeStrollManager(address _newStrollManager) external onlyOwner {
        require(_newStrollManager != address(0), "zero address");
        emit StrollManagerChanged(strollManager, _newStrollManager);
        strollManager = _newStrollManager;
    }

    /*
     * This function assumes whatever given by StrollManager is correct. Therefore, all the necessary
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
        // Only `StrollManager` can call this method
        require(msg.sender == strollManager, "Caller not authorised");
        require(isSupportedSuperToken(_superToken), "SuperToken not supported");

        IERC20Mod underlyingToken = IERC20Mod(_superToken.getUnderlyingToken());

        (
        uint256 underlyingAmount,
        uint256 adjustedAmount
        ) = _toUnderlyingAmount(
            _superTokenAmount,
            underlyingToken.decimals()
        );

        // Transfer the underlying tokens from the user
        underlyingToken.safeTransferFrom(
            _user,
            address(this),
            underlyingAmount
        );

        // Giving the Supertoken max allowance for upgrades if that hasn't been done before
        if (
            underlyingToken.allowance(
                address(this),
                address(_superToken)
            ) == 0
        )
            underlyingToken.safeIncreaseAllowance(
                address(_superToken),
                type(uint256).max
            );

        // Upgrade the necessary amount of supertokens and transfer them to a user.
        // We are assuming that `upgradeTo` function will revert upon failure of supertoken transfer to user.
        // If not, we need to check for the same after calling this method.
        _superToken.upgrade(adjustedAmount);
        _superToken.transfer(_user, adjustedAmount);


        emit TopUp(_user, address(_superToken), adjustedAmount);
    }

    function isSupportedSuperToken(ISuperToken _superToken)
    public
    view
    override
    returns (bool)
    {
        return _superToken.getUnderlyingToken() != address(0);
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

    function emergencyWithdraw(address token) public onlyOwner {
        IERC20(token).transfer(msg.sender, IERC20(token).balanceOf(address(this)));
    }
}