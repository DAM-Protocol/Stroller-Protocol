// SPDX-License-Identifier: Unlicense
pragma solidity =0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IERC20Mod.sol";
import "../interfaces/IStrategy.sol";

abstract contract StrategyBase is IStrategy, Ownable {
    address public override strollManager;

    function changeStrollManager(address _newStrollManager)
        external
        override
        onlyOwner
    {
        if (_newStrollManager == address(0)) revert ZeroAddress();

        emit StrollManagerChanged(strollManager, _newStrollManager);

        strollManager = _newStrollManager;
    }

    function emergencyWithdraw(address _token) external override onlyOwner {
        uint256 tokenBalance = IERC20Mod(_token).balanceOf(address(this));

        if (!IERC20Mod(_token).transfer(msg.sender, tokenBalance))
            revert TransferFailed(msg.sender, _token, tokenBalance);

        emit EmergencyWithdrawInitiated(msg.sender, _token, tokenBalance);
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
