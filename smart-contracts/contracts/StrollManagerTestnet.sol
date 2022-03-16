//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IStrategy.sol";
import "./interfaces/IERC20Mod.sol";
import { IConstantFlowAgreementV1 } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

// solhint-disable not-rely-on-time
contract StrollManagerTestnet is Ownable {
    // Modify this struct later to support multiple strategies in the future
    struct TopUp {
        address user;
        ISuperToken superToken;
        IStrategy strategy;
        address liquidityToken;
        uint64 expiry;
        uint64 lowerLimit;
        uint64 upperLimit;
    }

    uint64 public minLower;
    uint64 public minUpper;
    mapping(bytes32 => TopUp) private topUps; // user => superToken => uint

    // solhint-disable-next-line
    IConstantFlowAgreementV1 public immutable CFA_V1;

    event TopUpCreated(
        bytes32 indexed id,
        address indexed user,
        address indexed superToken,
        address strategy,
        address liquidityToken,
        uint256 time,
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

    constructor(
        address _icfa,
        uint64 _minLower,
        uint64 _minUpper
    ) {
        CFA_V1 = IConstantFlowAgreementV1(_icfa);
        minLower = _minLower;
        minUpper = _minUpper;
    }

    function getTopUpIndex(
        address _user,
        address _superToken,
        address _liquidityToken
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(_user, _superToken, _liquidityToken));
    }

    function createTopUp(
        address _superToken,
        address _strategy,
        address _liquidityToken,
        uint64 _expiry,
        uint64 _lowerLimit,
        uint64 _upperLimit
    ) external {
        require(
            _superToken != address(0) &&
                _strategy != address(0) &&
                _liquidityToken != address(0),
            "Null Address"
        );

        require(_expiry > block.timestamp, "Invalid time");
        require(_lowerLimit >= minLower, "Increase lower limit");
        require(_upperLimit >= minUpper, "Increase upper limit");

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

    function getTopUp(
        address _user,
        address _superToken,
        address _liquidityToken
    )
        public
        view
        returns (
            address,
            ISuperToken,
            IStrategy,
            address,
            uint64,
            uint64,
            uint64
        )
    {
        bytes32 index = getTopUpIndex(_user, _superToken, _liquidityToken);
        return getTopUpByIndex(index);
    }

    function getTopUpByIndex(bytes32 _index)
        public
        view
        returns (
            address,
            ISuperToken,
            IStrategy,
            address,
            uint64,
            uint64,
            uint64
        )
    {
        TopUp memory topUp = topUps[_index];

        return (
            topUp.user,
            topUp.superToken,
            topUp.strategy,
            topUp.liquidityToken,
            topUp.expiry,
            topUp.lowerLimit,
            topUp.upperLimit
        );
    }

    function checkTopUp(
        address _user,
        address _superToken,
        address _liquidityToken
    ) public view returns (uint256) {
        bytes32 index = getTopUpIndex(_user, _superToken, _liquidityToken);
        return checkTopUpByIndex(index);
    }

    function checkTopUpByIndex(bytes32 _index) public view returns (uint256 amount) {
        TopUp memory topUp = topUps[_index];

        if (
            topUp.user == address(0) || // Task exists and has a valid user
            topUp.expiry <= block.timestamp || // Task exists and current time is before task end time
            IERC20(topUp.liquidityToken).allowance(
                topUp.user,
                address(topUp.strategy) // contract is allowed to spend
            ) ==
            0 ||
            IERC20(topUp.liquidityToken).balanceOf(topUp.user) == 0 // check user balance
        ) return 0;

        int96 flowRate = CFA_V1.getNetFlow(topUp.superToken, topUp.user);

        if (flowRate < 0) {
            uint256 superBalance = topUp.superToken.balanceOf(topUp.user);
            uint256 positiveFlowRate = uint256(uint96(-1 * flowRate));

            if (superBalance <= (positiveFlowRate * topUp.lowerLimit)) {
                return
                    positiveFlowRate * topUp.upperLimit;
            }
        }

        return 0;
    }

    function performTopUp(
        address _user,
        address _superToken,
        address _liquidityToken
    ) external {
        bytes32 index = getTopUpIndex(_user, _superToken, _liquidityToken);
        performTopUpByIndex(index);
    }

    function performTopUpByIndex(bytes32 _index) public {
        uint256 topUpAmount = checkTopUpByIndex(_index);
        require(topUpAmount > 0, "TopUp check failed");

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
        require(topUp.expiry > 0, "TopUp does not exist");
        require(
            topUp.user == msg.sender || topUp.expiry < block.timestamp,
            "Can't delete TopUp"
        );
        delete topUps[_index];

        emit TopUpDeleted(
            _index,
            topUp.user,
            address(topUp.superToken),
            address(topUp.strategy),
            topUp.liquidityToken
        );
    }

    function deleteTopUp(
        address _user,
        address _superToken,
        address _liquidityToken
    ) public {
        require(_user != address(0), "0 Address not allowed");
        require(_superToken != address(0), "0 Address not allowed");
        bytes32 index = getTopUpIndex(_user, _superToken, _liquidityToken);
        deleteTopUpByIndex(index);
    }

    function deleteBatch(bytes32[] calldata _indices) public {
        // delete multiple top ups
        for (uint256 i = 0; i < _indices.length; i++) {
            deleteTopUpByIndex(_indices[i]);
        }
    }
}