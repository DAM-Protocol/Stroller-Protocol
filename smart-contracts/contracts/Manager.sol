// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import { IConstantFlowAgreementV1 } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC20Mod.sol";
import "./interfaces/IManager.sol";

contract Manager is IManager, Ownable {

    IConstantFlowAgreementV1 public immutable cfaV1;

    /// @dev IManager.minLower implementation.
    uint64 public override minLower;

    /// @dev IManager.minUpper implementation.
    uint64 public override minUpper;

    /// @dev IManager.approvedStrategies implementation.
    mapping(address => bool) public override approvedStrategies;

    mapping(bytes32 => Wrap) private wraps; //id = sha3(user, superToken, liquidityToken)

    constructor(
        address _cfa,
        uint64 _minLower,
        uint64 _minUpper
    ) {
        if (_cfa == address(0)) revert ZeroAddress();
        if (_minLower >= _minUpper) revert WrongLimits(_minLower, _minUpper);

        cfaV1 = IConstantFlowAgreementV1(_cfa);
        minLower = _minLower;
        minUpper = _minUpper;
    }

    /// @dev IManager.createWrap implementation.
    function createWrap(
        address superToken,
        address strategy,
        address liquidityToken,
        uint64 expiry,
        uint64 lowerLimit,
        uint64 upperLimit
    ) external override {
        if (expiry <= block.timestamp)
            revert InvalidExpirationTime(expiry, block.timestamp);

        if (lowerLimit < minLower)
            revert InsufficientLimits(lowerLimit, minLower);

        if (upperLimit < minUpper)
            revert InsufficientLimits(upperLimit, minUpper);

        bytes32 index = getWrapIndex(msg.sender, superToken, liquidityToken);

        // If index owner/user is address(0), we are creating a new top-up.
        if (wraps[index].user != msg.sender) {
            if (
                superToken == address(0) ||
                strategy == address(0) ||
                liquidityToken == address(0)
            ) revert ZeroAddress();

            if (!approvedStrategies[strategy])
                revert InvalidStrategy(strategy);
            if (
                !IStrategy(strategy).isSupportedSuperToken(
                    ISuperToken(superToken)
                )
            ) revert UnsupportedSuperToken(address(superToken));

            Wrap memory wrap = Wrap( // create new Wrap or update wrap
                msg.sender,
                ISuperToken(superToken),
                IStrategy(strategy),
                liquidityToken,
                expiry,
                lowerLimit,
                upperLimit
            );

            wraps[index] = wrap;
        } else {
            // Else just update the limits and expiry, save gas.

            wraps[index].expiry = expiry;
            wraps[index].lowerLimit = lowerLimit;
            wraps[index].upperLimit = upperLimit;
        }

        emit WrapCreated(
            index,
            msg.sender,
            superToken,
            strategy,
            liquidityToken,
            expiry,
            lowerLimit,
            upperLimit
        );
    }

    /// @dev IManager.performWrap implementation.
    function performWrap(
        address user,
        address superToken,
        address liquidityToken
    ) external override {
        performWrapByIndex(getWrapIndex(user, superToken, liquidityToken));
    }

    /// @dev IManager.deleteWrap implementation.
    function deleteWrap(
        address user,
        address superToken,
        address liquidityToken
    ) external override {
        deleteWrapByIndex(getWrapIndex(user, superToken, liquidityToken));
    }

    /// @dev IManager.deleteBatch implementation.
    function deleteBatch(bytes32[] calldata indices) external override {
        // delete multiple top ups
        uint256 length = indices.length;
        for (uint256 i; i < length; ++i) {
            deleteWrapByIndex(indices[i]);
        }
    }

    /// @dev IManager.addApprovedStrategy implementation.
    function addApprovedStrategy(address strategy)
        external
        override
        onlyOwner
    {
        if (strategy == address(0)) revert InvalidStrategy(strategy);
        if (!approvedStrategies[strategy]) {
            approvedStrategies[strategy] = true;
            emit AddedApprovedStrategy(strategy);
        }
    }

    /// @dev IManager.removeApprovedStrategy implementation.
    function removeApprovedStrategy(address strategy) external onlyOwner {
        if (approvedStrategies[strategy]) {
            delete approvedStrategies[strategy];
            emit RemovedApprovedStrategy(strategy);
        }
    }

    /// @dev IManager.setLimits implementation.
    function setLimits(uint64 lowerLimit, uint64 upperLimit)
        external
        onlyOwner
    {
        if (lowerLimit >= upperLimit)
            revert WrongLimits(lowerLimit, upperLimit);

        minLower = lowerLimit;
        minUpper = upperLimit;

        emit LimitsChanged(lowerLimit, upperLimit);
    }

    /// @dev IManager.getWrap implementation.
    function getWrap(
        address user,
        address superToken,
        address liquidityToken
    ) external view returns (Wrap memory) {
        return
            getWrapByIndex(getWrapIndex(user, superToken, liquidityToken));
    }

    /// @dev IManager.checkWrap implementation.
    function checkWrap(
        address user,
        address superToken,
        address liquidityToken
    ) external view override returns (uint256) {
        return
            checkWrapByIndex(
                getWrapIndex(user, superToken, liquidityToken)
            );
    }

    /// @dev IManager.performWrapByIndex implementation.
    function performWrapByIndex(bytes32 index) public {
        uint256 WrapAmount = checkWrapByIndex(index);

        if (WrapAmount == 0) revert WrapNotRequired(index);

        Wrap storage Wrap = wraps[index];

        ISuperToken superToken = Wrap.superToken;
        IStrategy strategy = Wrap.strategy;

        if (!strategy.isSupportedSuperToken(superToken))
            revert UnsupportedSuperToken(address(superToken));

        strategy.Wrap(Wrap.user, superToken, WrapAmount);
        emit PerformedWrap(index, WrapAmount);
    }

    /// @dev IManager.deleteWrapByIndex implementation.
    function deleteWrapByIndex(bytes32 index) public {
        Wrap storage Wrap = wraps[index];

        address user = Wrap.user;

        if (user != msg.sender && Wrap.expiry >= block.timestamp)
            revert UnauthorizedCaller(msg.sender, user);

        emit WrapDeleted(
            index,
            Wrap.user,
            address(Wrap.superToken),
            address(Wrap.strategy),
            Wrap.liquidityToken
        );

        delete wraps[index];
    }

    /// @dev IManager.getWrapByIndex implementation.
    function getWrapByIndex(bytes32 index)
        public
        view
        returns (Wrap memory)
    {
        return wraps[index];
    }

    /// @dev IManager.checkWrapByIndex implementation.
    function checkWrapByIndex(bytes32 index)
        public
        view
        returns (uint256 amount)
    {
        Wrap storage Wrap = wraps[index];

        if (
            Wrap.user == address(0) || // Task exists and has a valid user
            Wrap.expiry <= block.timestamp || // Task exists and current time is before task end time
            IERC20Mod(Wrap.liquidityToken).allowance(
                Wrap.user,
                address(Wrap.strategy) // contract is allowed to spend
            ) ==
            0 ||
            IERC20Mod(Wrap.liquidityToken).balanceOf(Wrap.user) == 0 || // check user balance
            !IStrategy(Wrap.strategy).isSupportedSuperToken(Wrap.superToken) // Supertoken isn't supported anymore.
        ) return 0;

        int96 flowRate = cfaV1.getNetFlow(Wrap.superToken, Wrap.user);

        if (flowRate < 0) {
            uint256 superBalance = Wrap.superToken.balanceOf(Wrap.user);
            uint256 positiveFlowRate = uint256(uint96(-1 * flowRate));

            // Selecting max between user defined limits and global limits.
            uint64 maxLowerLimit = (Wrap.lowerLimit < minLower)? minLower: Wrap.lowerLimit;
            uint64 maxUpperLimit = (Wrap.upperLimit < minUpper)? minUpper: Wrap.upperLimit;

            if (superBalance <= (positiveFlowRate * maxLowerLimit)) {
                return positiveFlowRate * maxUpperLimit;
            }
        }

        return 0;
    }

    /// @dev IManager.getWrapIndex implementation.
    function getWrapIndex(
        address user,
        address superToken,
        address liquidityToken
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(user, superToken, liquidityToken));
    }
}
