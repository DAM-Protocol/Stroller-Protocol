// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.13;

import { ISuperToken } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

interface IStrategy {
    event TopUp(
        address indexed user,
        address indexed superToken,
        uint256 superTokenAmount
    );
    event StrollManagerChanged(
        address indexed oldStrollManager,
        address indexed strollManager
    );
    event EmergencyWithdrawInitiated(
        address indexed receiver,
        address indexed token,
        uint256 amount
    );

    /// Custom error to indicate that null address has been passed.
    error ZeroAddress();

    /// Custom error to indicate that supertoken provided isn't supported.
    /// @param superToken Address of the supertoken which isn't supported.
    error UnsupportedSuperToken(address superToken);

    /// Custom error to indicate that the caller is unauthorized to call a function.
    /// @param caller Address of the caller of the function.
    /// @param expectedCaller Address of the expected caller of the function.
    error UnauthorizedCaller(address caller, address expectedCaller);

    /// Custom error to indicate that a ERC20 token transfer has failed.
    /// @param receiver Address of the receiver of the transfer event.
    /// @param token Address of the token being transferred in the event.
    /// @param amount Amount of tokens being transferred in the event.
    error TransferFailed(address receiver, address token, uint256 amount);

    /// Function to get the current StrollManager contract which interacts with the-
    /// strategy contract.
    /// @return StrollManager contract address.
    function strollManager() external returns (address);

    /// Function to top-up an account based on certain conditions pre-defined in the StrollManager contract.
    /// @param _user Address of the user whose account needs to be topped-up.
    /// @param _superToken Supertoken which needs to be replenished.
    /// @param _superTokenAmount Amount of supertoken to be replenished.
    /// @dev This function assumes whatever given by StrollManager is correct. Therefore, all the necessary-
    /// checks such as if a top-up is required and if so how much amount needs to be topped up, do we have-
    /// enough allowance to perform a top-up and so on must be performed in StrollManager only.
    function topUp(
        address _user,
        ISuperToken _superToken,
        uint256 _superTokenAmount
    ) external;

    /// Function to check whether a supertoken is supported by a strategy or not.
    /// @dev More specifically, this function checks whether the underlying token of the supertoken-
    /// is supported or not.
    /// @param _superToken Supertoken which needs to be checked for support.
    /// @return Boolean indicating the support of the supertoken.
    function isSupportedSuperToken(ISuperToken _superToken)
        external
        view
        returns (bool);

    /// Function to change the StrollManager contract that a strategy interacts with.
    /// This function can only be called by the owner of the strategy contract.
    /// @param _newStrollManager Address of the new StrollManager contract the strategy should interact with.
    function changeStrollManager(address _newStrollManager) external;

    /// Function to withdraw any token locked in the contract in case of an emergency.
    /// Ideally, no tokens should ever be sent directly to the contract but in case it happens,
    /// this function can be used by the owner of the strategy contract to transfer all the locked tokens-
    /// to their address.
    /// @param _token Address of the locked token which is to be transferred to the owner address.
    function emergencyWithdraw(address _token) external;
}
