// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.13;

import { IConstantFlowAgreementV1 } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC20Mod.sol";
import "./interfaces/IStrollManager.sol";


// solhint-disable not-rely-on-time
/// @title StrollManager
/// @author Harsh Prakash <0xharsh@proton.me>
/// @notice StrollManager is a contract that manages top ups for the Stroll protocol.
contract StrollManager is IStrollManager, Ownable {
    IConstantFlowAgreementV1 public immutable CFA_V1;

    /// @dev IStrollManager.minLower implementation.
    uint64 public override minLower;

    /// @dev IStrollManager.minUpper implementation.
    uint64 public override minUpper;

    /// @dev IStrollManager.approvedStrategies implementation.
    mapping(address => bool) public override approvedStrategies;

    mapping(bytes32 => TopUp) private topUps; //id = sha3(user, superToken, liquidityToken)

    constructor(
        address _icfa,
        uint64 _minLower,
        uint64 _minUpper
    ) {
        if (_icfa == address(0)) revert ZeroAddress();
        if (_minLower >= _minUpper) revert WrongLimits(_minLower, _minUpper);

        CFA_V1 = IConstantFlowAgreementV1(_icfa);
        minLower = _minLower;
        minUpper = _minUpper;
    }

    /// @dev IStrollManager.createTopUp implementation.
    function createTopUp(
        address _superToken,
        address _strategy,
        address _liquidityToken,
        uint64 _expiry,
        uint64 _lowerLimit,
        uint64 _upperLimit
    ) external override {
        if (_expiry <= block.timestamp)
            revert InvalidExpirationTime(_expiry, block.timestamp);

        if (_lowerLimit < minLower)
            revert InsufficientLimits(_lowerLimit, minLower);

        if (_upperLimit < minUpper)
            revert InsufficientLimits(_upperLimit, minUpper);

        bytes32 index = getTopUpIndex(msg.sender, _superToken, _liquidityToken);

        // If index owner/user is address(0), we are creating a new top-up.
        if (topUps[index].user != msg.sender) {
            if (
                _superToken == address(0) ||
                _strategy == address(0) ||
                _liquidityToken == address(0)
            ) revert ZeroAddress();

            if (!approvedStrategies[_strategy])
                revert InvalidStrategy(_strategy);
            if (
                !IStrategy(_strategy).isSupportedSuperToken(
                    ISuperToken(_superToken)
                )
            ) revert UnsupportedSuperToken(address(_superToken));

            TopUp memory topUp = TopUp( // create new TopUp or update topup
                msg.sender,
                ISuperToken(_superToken),
                IStrategy(_strategy),
                _liquidityToken,
                _expiry,
                _lowerLimit,
                _upperLimit
            );

            topUps[index] = topUp;
        } else {
            // Else just update the limits and expiry, save gas.

            topUps[index].expiry = _expiry;
            topUps[index].lowerLimit = _lowerLimit;
            topUps[index].upperLimit = _upperLimit;
        }

        emit TopUpCreated(
            index,
            msg.sender,
            _superToken,
            _strategy,
            _liquidityToken,
            _expiry,
            _lowerLimit,
            _upperLimit
        );
    }

    /// @dev IStrollManager.performTopUp implementation.
    function performTopUp(
        address _user,
        address _superToken,
        address _liquidityToken
    ) external override {
        performTopUpByIndex(getTopUpIndex(_user, _superToken, _liquidityToken));
    }

    /// @dev IStrollManager.deleteTopUp implementation.
    function deleteTopUp(
        address _user,
        address _superToken,
        address _liquidityToken
    ) external override {
        deleteTopUpByIndex(getTopUpIndex(_user, _superToken, _liquidityToken));
    }

    /// @dev IStrollManager.deleteBatch implementation.
    function deleteBatch(bytes32[] calldata _indices) external override {
        // delete multiple top ups
        uint256 length = _indices.length;
        for (uint256 i; i < length; ++i) {
            deleteTopUpByIndex(_indices[i]);
        }
    }

    /// @dev IStrollManager.addApprovedStrategy implementation.
    function addApprovedStrategy(address _strategy)
        external
        override
        onlyOwner
    {
        if (_strategy == address(0)) revert InvalidStrategy(_strategy);
        if (!approvedStrategies[_strategy]) {
            approvedStrategies[_strategy] = true;
            emit AddedApprovedStrategy(_strategy);
        }
    }

    /// @dev IStrollManager.removeApprovedStrategy implementation.
    function removeApprovedStrategy(address _strategy) external onlyOwner {
        if (approvedStrategies[_strategy]) {
            delete approvedStrategies[_strategy];
            emit RemovedApprovedStrategy(_strategy);
        }
    }

    /// @dev IStrollManager.setLimits implementation.
    function setLimits(uint64 _lowerLimit, uint64 _upperLimit)
        external
        onlyOwner
    {
        if (_lowerLimit >= _upperLimit)
            revert WrongLimits(_lowerLimit, _upperLimit);

        minLower = _lowerLimit;
        minUpper = _upperLimit;

        emit LimitsChanged(_lowerLimit, _upperLimit);
    }

    /// @dev IStrollManager.getTopUp implementation.
    function getTopUp(
        address _user,
        address _superToken,
        address _liquidityToken
    ) external view returns (TopUp memory) {
        return
            getTopUpByIndex(getTopUpIndex(_user, _superToken, _liquidityToken));
    }

    /// @dev IStrollManager.checkTopUp implementation.
    function checkTopUp(
        address _user,
        address _superToken,
        address _liquidityToken
    ) external view override returns (uint256) {
        return
            checkTopUpByIndex(
                getTopUpIndex(_user, _superToken, _liquidityToken)
            );
    }

    /// @dev IStrollManager.performTopUpByIndex implementation.
    function performTopUpByIndex(bytes32 _index) public {
        uint256 topUpAmount = checkTopUpByIndex(_index);

        if (topUpAmount == 0) revert TopUpNotRequired(_index);

        TopUp storage topUp = topUps[_index];

        ISuperToken superToken = topUp.superToken;
        IStrategy strategy = topUp.strategy;

        if (!strategy.isSupportedSuperToken(superToken))
            revert UnsupportedSuperToken(address(superToken));

        strategy.topUp(topUp.user, superToken, topUpAmount);
        emit PerformedTopUp(_index, topUpAmount);
    }

    /// @dev IStrollManager.deleteTopUpByIndex implementation.
    function deleteTopUpByIndex(bytes32 _index) public {
        TopUp storage topUp = topUps[_index];

        address user = topUp.user;

        if (user != msg.sender && topUp.expiry >= block.timestamp)
            revert UnauthorizedCaller(msg.sender, user);

        emit TopUpDeleted(
            _index,
            topUp.user,
            address(topUp.superToken),
            address(topUp.strategy),
            topUp.liquidityToken
        );

        delete topUps[_index];
    }

    /// @dev IStrollManager.getTopUpByIndex implementation.
    function getTopUpByIndex(bytes32 _index)
        public
        view
        returns (TopUp memory)
    {
        return topUps[_index];
    }

    /// @dev IStrollManager.checkTopUpByIndex implementation.
    function checkTopUpByIndex(bytes32 _index)
        public
        view
        returns (uint256 _amount)
    {
        TopUp storage topUp = topUps[_index];

        if (
            topUp.user == address(0) || // Task exists and has a valid user
            topUp.expiry <= block.timestamp || // Task exists and current time is before task end time
            IERC20Mod(topUp.liquidityToken).allowance(
                topUp.user,
                address(topUp.strategy) // contract is allowed to spend
            ) ==
            0 ||
            IERC20Mod(topUp.liquidityToken).balanceOf(topUp.user) == 0 || // check user balance
            !IStrategy(topUp.strategy).isSupportedSuperToken(topUp.superToken) // Supertoken isn't supported anymore.
        ) return 0;

        int96 flowRate = CFA_V1.getNetFlow(topUp.superToken, topUp.user);

        if (flowRate < 0) {
            uint256 superBalance = topUp.superToken.balanceOf(topUp.user);
            uint256 positiveFlowRate = uint256(uint96(-1 * flowRate));

            // Selecting max between user defined limits and global limits.
            uint64 maxLowerLimit = (topUp.lowerLimit < minLower)? minLower: topUp.lowerLimit;
            uint64 maxUpperLimit = (topUp.upperLimit < minUpper)? minUpper: topUp.upperLimit;

            if (superBalance <= (positiveFlowRate * maxLowerLimit)) {
                return positiveFlowRate * maxUpperLimit;
            }
        }

        return 0;
    }

    /// @dev IStrollManager.getTopUpIndex implementation.
    function getTopUpIndex(
        address _user,
        address _superToken,
        address _liquidityToken
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(_user, _superToken, _liquidityToken));
    }
}
