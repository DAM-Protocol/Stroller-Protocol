//SPDX-License-Identifier: Unlicense
pragma solidity =0.8.13;

import { IConstantFlowAgreementV1 } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC20Mod.sol";
import "./interfaces/IStrollManager.sol";

// solhint-disable not-rely-on-time
contract StrollManager is IStrollManager, Ownable {
    uint64 public override minLower;
    uint64 public override minUpper;

    mapping(bytes32 => TopUp) private topUps; //id = sha3(user, superToken, liquidityToken)
    mapping(address => bool) public override approvedStrategies;

    IConstantFlowAgreementV1 public immutable CFA_V1;

    constructor(
        address _icfa,
        uint64 _minLower,
        uint64 _minUpper
    ) {
        CFA_V1 = IConstantFlowAgreementV1(_icfa);
        minLower = _minLower;
        minUpper = _minUpper;
    }

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

    function performTopUp(
        address _user,
        address _superToken,
        address _liquidityToken
    ) external override {
        performTopUpByIndex(getTopUpIndex(_user, _superToken, _liquidityToken));
    }

    function deleteTopUp(
        address _user,
        address _superToken,
        address _liquidityToken
    ) external override {
        deleteTopUpByIndex(getTopUpIndex(_user, _superToken, _liquidityToken));
    }

    function deleteBatch(bytes32[] calldata _indices) external override {
        // delete multiple top ups
        for (uint256 i = 0; i < _indices.length; i++) {
            deleteTopUpByIndex(_indices[i]);
        }
    }

    function addApprovedStrategy(address _strategy)
        external
        override
        onlyOwner
    {
        if (_strategy == address(0)) revert InvalidStrategy(_strategy);

        approvedStrategies[_strategy] = true;
        emit AddedApprovedStrategy(_strategy);
    }

    function removeApprovedStrategy(address _strategy) external onlyOwner {
        if (approvedStrategies[_strategy]) {
            delete approvedStrategies[_strategy];
            emit RemovedApprovedStrategy(_strategy);
        }
    }

    function getTopUp(
        address _user,
        address _superToken,
        address _liquidityToken
    ) external view returns (TopUp memory) {
        return
            getTopUpByIndex(getTopUpIndex(_user, _superToken, _liquidityToken));
    }

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

    function performTopUpByIndex(bytes32 _index) public {
        uint256 topUpAmount = checkTopUpByIndex(_index);

        if (topUpAmount == 0) revert TopUpNotRequired(_index);

        TopUp memory topUp = topUps[_index];
        topUp.strategy.topUp(
            topUp.user,
            ISuperToken(topUp.superToken),
            topUpAmount
        );
        emit PerformedTopUp(_index, topUpAmount);
    }

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

    function getTopUpByIndex(bytes32 _index)
        public
        view
        returns (TopUp memory)
    {
        return topUps[_index];
    }

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

    function getTopUpIndex(
        address _user,
        address _superToken,
        address _liquidityToken
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(_user, _superToken, _liquidityToken));
    }
}
