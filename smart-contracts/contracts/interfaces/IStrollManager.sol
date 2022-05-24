// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.13;

import { ISuperToken } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import "../interfaces/IStrategy.sol";

interface IStrollManager {
    event TopUpCreated(
        bytes32 indexed id,
        address indexed user,
        address indexed superToken,
        address strategy,
        address liquidityToken,
        uint256 expiry,
        uint256 lowerLimit,
        uint256 upperLimit
    );
    event TopUpDeleted(
        bytes32 indexed id,
        address indexed user,
        address indexed superToken,
        address strategy,
        address liquidityToken
    );
    event PerformedTopUp(bytes32 indexed id, uint256 topUpAmount);
    event AddedApprovedStrategy(address indexed strategy);
    event RemovedApprovedStrategy(address indexed strategy);

    /// Custom error to indicate that null address has been passed.
    error ZeroAddress();

    error InvalidStrategy(address _strategy);

    error TopUpNotRequired(bytes32 index);

    /// Custom error to indicate that supertoken provided isn't supported.
    /// @param superToken Address of the supertoken which isn't supported.
    error UnsupportedSuperToken(address superToken);

    error UnauthorizedCaller(address caller, address expectedCaller);

    error InvalidExpirationTime(uint64 expirationTimeGiven, uint256 timeNow);

    error InsufficientLimits(uint64 limitGiven, uint64 minLimit);

    struct TopUp {
        address user;
        ISuperToken superToken;
        IStrategy strategy;
        address liquidityToken;
        uint64 expiry;
        uint64 lowerLimit;
        uint64 upperLimit;
    }

    function createTopUp(
        address _superToken,
        address _strategy,
        address _liquidityToken,
        uint64 _expiry,
        uint64 _lowerLimit,
        uint64 _upperLimit
    ) external;

    function performTopUp(
        address _user,
        address _superToken,
        address _liquidityToken
    ) external;

    function deleteTopUp(
        address _user,
        address _superToken,
        address _liquidityToken
    ) external;

    function performTopUpByIndex(bytes32 _index) external;

    function deleteTopUpByIndex(bytes32 _index) external;

    function deleteBatch(bytes32[] calldata _indices) external;

    function addApprovedStrategy(address _strategy) external;

    function removeApprovedStrategy(address _strategy) external;

    function minLower() external view returns (uint64);

    function minUpper() external view returns (uint64);

    function approvedStrategies(address _strategy) external view returns (bool);

    function checkTopUp(
        address _user,
        address _superToken,
        address _liquidityToken
    ) external view returns (uint256);

    function getTopUpByIndex(bytes32 _index)
        external
        view
        returns (TopUp memory);

    function checkTopUpByIndex(bytes32 _index)
        external
        view
        returns (uint256 _amount);

    function getTopUpIndex(
        address _user,
        address _superToken,
        address _liquidityToken
    ) external pure returns (bytes32);
}
