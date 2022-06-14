//SPDX-License-Identifier: Unlicense
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
        if (
            _superToken == address(0) ||
            _strategy == address(0) ||
            _liquidityToken == address(0)
        ) revert ZeroAddress();

        if (_expiry <= block.timestamp)
            revert InvalidExpirationTime(_expiry, block.timestamp);

        if (_lowerLimit < minLower)
            revert InsufficientLimits(_lowerLimit, minLower);

        if (_upperLimit < minUpper)
            revert InsufficientLimits(_upperLimit, minUpper);


        if (!approvedStrategies[_strategy]) revert InvalidStrategy(_strategy);
        if (
            !IStrategy(_strategy).isSupportedSuperToken(
                ISuperToken(_superToken)
            )
        ) revert UnsupportedSuperToken(address(_superToken));

        // check if topUp already exists for given user and superToken
        bytes32 index = getTopUpIndex(msg.sender, _superToken, _liquidityToken);

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
        if(!approvedStrategies[_strategy]) {
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

        TopUp memory topUp = topUps[_index];
        topUp.strategy.topUp(
            topUp.user,
            topUp.superToken,
            topUpAmount
        );
        emit PerformedTopUp(_index, topUpAmount);
    }

    /// @dev IStrollManager.deleteTopUpByIndex implementation.
    function deleteTopUpByIndex(bytes32 _index) public {
        TopUp memory topUp = topUps[_index];

        if (topUp.user != msg.sender && topUp.expiry >= block.timestamp)
            revert UnauthorizedCaller(msg.sender, topUp.user);

        delete topUps[_index];

        emit TopUpDeleted(
            _index,
            topUp.user,
            address(topUp.superToken),
            address(topUp.strategy),
            topUp.liquidityToken
        );
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
        TopUp memory topUp = topUps[_index];

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

            if (superBalance <= (positiveFlowRate * topUp.lowerLimit)) {
                return positiveFlowRate * topUp.upperLimit;
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
