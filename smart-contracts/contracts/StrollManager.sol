//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IStrategy.sol";
// import "./common/StrollHelper.sol";
import "./interfaces/IStrollResolver.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

interface IERC20Mod is IERC20 {
    function decimals() external view returns (uint8);
}

// solhint-disable not-rely-on-time
contract Registry is Ownable {
    // using StrollHelper for ISuperToken;

    struct Strategy {
        IStrategy strategy;
        address liquidityToken;
    }

    // Modify this struct later to support multiple strategies in the future
    struct TopUp {
        address user;
        ISuperToken superToken;
        Strategy strategy;
        uint64 time;
        uint64 lowerLimit;
        uint64 upperLimit;
    }

    mapping(bytes32 => TopUp) private topUps; // user => superToken => uint

    IStrollResolver private immutable strollResolver;

    // For testnet deployment
    IConstantFlowAgreementV1 public constant CFA_V1 =
        IConstantFlowAgreementV1(0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873);

    event TopUpCreated(
        bytes32 indexed id,
        address indexed user,
        address indexed superToken,
        address liquidityToken,
        address strategy,
        uint256 time
    );

    event TopUpDeleted(
        bytes32 indexed id,
        address indexed user,
        address indexed superToken,
        address liquidityToken,
        address strategy,
        uint256 time
    );

    event PerformedTopUp(bytes32 indexed id);

    constructor(IStrollResolver _strollResolver) {
        strollResolver = _strollResolver;
    }

    function getTopUpIndex(
        address _user,
        address _superToken,
        address _liquidityToken
    ) public view returns (bytes32) {
        return keccak256(abi.encode(_user, _superToken, _liquidityToken));
    }

    function createTopUp(
        address _superToken,
        address _strategy,
        address _liquidityToken,
        uint64 _time,
        uint64 _lowerLimit,
        uint64 _upperLimit
    ) external {
        require(
            _superToken != address(0) &&
                _strategy != address(0) &&
                _liquidityToken != address(0),
            "Null Address"
        );

        require(_time > block.timestamp, "Invalid time");

        // check if topUp already exists for given user and superToken
        bytes32 index = getTopUpIndex(msg.sender, _superToken, _liquidityToken);

        if (topUps[index].time == 0) {
            // create new topUp
            TopUp memory topup = TopUp(
                msg.sender,
                ISuperToken(_superToken),
                Strategy(IStrategy(_strategy), _liquidityToken),
                _time,
                _lowerLimit,
                _upperLimit
            );
            topUps[index] = topup;
        }

        emit TopUpCreated(
            index,
            msg.sender,
            _superToken,
            _liquidityToken,
            _strategy,
            _time
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
            Strategy memory,
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
            Strategy memory,
            uint64,
            uint64,
            uint64
        )
    {
        TopUp memory topup = topUps[_index];

        return (
            topup.user,
            topup.superToken,
            topup.strategy,
            topup.time,
            topup.lowerLimit,
            topup.upperLimit
        );
    }

    function checkTopUp(bytes32 _index) public view returns (bool, uint256) {
        TopUp memory topup = topUps[_index];
        if (topup.time <= block.timestamp) {
            return (false, 0);
        }

        if (
            topup.user == address(0) || // Task exists and has a valid user
            topup.time > block.timestamp || // Task exists and current time is before task end time
            IERC20(topup.strategy.liquidityToken).allowance(
                topup.user,
                address(topup.strategy.strategy) // contract is allowed to spend
            ) ==
            0 ||
            IERC20(topup.strategy.liquidityToken).balanceOf(topup.user) == 0 // check user balance
        ) return (false, 0);

        int96 flowRate = CFA_V1.getNetFlow(topup.superToken, topup.user);

        if (flowRate < 0) {
            uint256 superBalance = topup.superToken.balanceOf(topup.user);
            uint256 positiveFlowRate = uint256(uint96(-1 * flowRate));

            if (superBalance <= (positiveFlowRate * topup.lowerLimit)) {
                uint256 topUpAmount = positiveFlowRate * topup.upperLimit;
                return (
                    true,
                    topUpAmount /
                        10 **
                            (18 -
                                IERC20Mod(topup.superToken.getUnderlyingToken())
                                    .decimals())
                );
            }
        }

        return (false, 0);
    }

    function performTopUp(bytes32 _index) public {
        TopUp memory topup = topUps[_index];
        (bool check, uint256 topUpAmount) = checkTopUp(_index);
        require(check, "TopUp check failed");
        topup.strategy.strategy.topUp(
            topup.user,
            topup.strategy.liquidityToken,
            ISuperToken(topup.superToken),
            topUpAmount
        );
        emit PerformedTopUp(_index);
    }

    function deleteTopUp(bytes32 _index) public {
        TopUp memory topup = topUps[_index];
        require(topup.time > 0, "TopUp does not exist");
        require(
            topup.user == msg.sender || topup.time < block.timestamp,
            "Can't delete TopUp"
        );
        topUps[_index].time = 0;

        topUps[_index].user = address(0);
        emit TopUpDeleted(
            _index,
            topup.user,
            address(topup.superToken),
            topup.strategy.liquidityToken,
            address(topup.strategy.strategy),
            topup.time
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
        deleteTopUp(index);
    }

    function deleteBatch(bytes32[] calldata _indices) public {
        // delete multiple top ups
        for (uint256 i = 0; i < _indices.length; i++) {
            deleteTopUp(_indices[i]);
        }
    }
}
