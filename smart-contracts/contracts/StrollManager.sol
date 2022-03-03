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
        IStrategy strategyAddress;
        address token;
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

    TopUp[] private topUps;
    mapping(address => mapping(address => uint256)) private topUpMap; // user => superToken => uint
    uint256[] private deletedTopUps;

    uint256 public scanLength;
    IStrollResolver private immutable strollResolver;

    // For testnet deployment
    IConstantFlowAgreementV1 public constant CFA_V1 =
        IConstantFlowAgreementV1(0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873);

    event TopUpCreated(
        uint256 indexed id,
        address indexed user,
        address indexed superToken,
        address liquidityToken,
        address strategy,
        uint256 time
    );

    event TopUpDeleted(
        uint256 indexed id,
        address indexed user,
        address indexed superToken,
        address liquidityToken,
        address strategy,
        uint256 time
    );

    event PerformedTopUp(uint256 indexed id);

    constructor(IStrollResolver _strollResolver, uint256 _scanLength) {
        strollResolver = _strollResolver;
        scanLength = _scanLength;

        TopUp memory topUp;
        topUps.push(topUp);
    }

    // function getScanLength() public view returns (uint256) {
    //     return scanLength;
    // }

    function setScanLength(uint256 _scanLength) external onlyOwner {
        scanLength = _scanLength;
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
        uint256 index = getTopUpIndex(msg.sender, _superToken);

        require(index == 0, "TopUp already exists");

        // create new topUp
        TopUp memory topup = TopUp(
            msg.sender,
            ISuperToken(_superToken),
            Strategy(IStrategy(_strategy), _liquidityToken),
            _time,
            _lowerLimit,
            _upperLimit
        );

        if (deletedTopUps.length > 0) {
            index = deletedTopUps[deletedTopUps.length - 1];
            topUps[index] = topup;
            deletedTopUps.pop();
        } else {
            index = topUps.length;
            topUps.push(topup);
        }
        topUpMap[msg.sender][_superToken] = index;

        emit TopUpCreated(
            index,
            msg.sender,
            _superToken,
            _liquidityToken,
            _strategy,
            _time
        );
    }

    function getTopUp(address _user, address _superToken)
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
        uint256 index = getTopUpIndex(_user, _superToken);
        return getTopUpByIndex(index);
    }

    function getTopUpIndex(address _user, address _superToken)
        public
        view
        returns (uint256)
    {
        return topUpMap[_user][_superToken];
    }

    function getTopUpByIndex(uint256 _index)
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
        require(_index < topUps.length, "Index out of bounds");
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

    // function getTotalTopUps() public view returns (uint256) {
    //     return topUps.length;
    // }

    // function requireTopUp(ISuperToken _superToken, address _user)
    //     public
    //     view
    //     returns (bool, uint256)
    // {
    //     uint128 lowerLimit = strollResolver.lowerLimit(); // TODO: flexible timing
    //     uint128 upperLimit = strollResolver.upperLimit();
    //     int96 flowRate = CFA_V1.getNetFlow(_superToken, _user);

    //     if (flowRate < 0) {
    //         uint256 balance = _superToken.balanceOf(_user);
    //         uint256 positiveFlowRate = uint256(uint96(-1 * flowRate));

    //         if (balance <= (positiveFlowRate * lowerLimit)) {
    //             uint256 topUpAmount = positiveFlowRate * upperLimit;
    //             return (
    //                 true,
    //                 topUpAmount /
    //                     10 **
    //                         (18 -
    //                             IERC20Mod(_superToken.getUnderlyingToken())
    //                                 .decimals())
    //             );
    //         }
    //     }

    //     return (false, 0);
    // }

    function checkTopUp(uint256 _index) public view returns (bool, uint256) {
        if (_index >= topUps.length) return (false, 0);

        TopUp memory topup = topUps[_index];

        if (
            topup.user == address(0) || // Task exists and has a valid user
            topup.time > block.timestamp || // Task exists and current time is before task end time
            IERC20(topup.strategy.token).allowance(
                topup.user,
                address(topup.strategy.strategyAddress) // contract is allowed to spend
            ) ==
            0 ||
            IERC20(topup.strategy.token).balanceOf(topup.user) == 0 // check user balance
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

    function performTopUp(uint256 _index) public {
        TopUp memory topup = topUps[_index];
        (bool check, uint256 topUpAmount) = checkTopUp(_index);
        require(check, "TopUp check failed");
        topup.strategy.strategyAddress.topUp(
            topup.user,
            topup.strategy.token,
            ISuperToken(topup.superToken)
        );
        emit PerformedTopUp(_index);
    }

    function deleteTopUp(uint256 _index) public {
        require(_index < topUps.length, "Index out of bounds");
        TopUp memory topup = topUps[_index];
        require(
            topup.user == msg.sender || topup.time < block.timestamp,
            "Can't delete TopUp"
        );
        require(
            topUpMap[topup.user][address(topup.superToken)] > 0,
            "TopUp not found"
        );
        topUpMap[topup.user][address(topup.superToken)] = 0;

        topUps[_index].user = address(0);
        deletedTopUps.push(_index);
        emit TopUpDeleted(
            _index,
            topup.user,
            address(topup.superToken),
            topup.strategy.token,
            address(topup.strategy.strategyAddress),
            topup.time
        );
    }

    function deleteTopUp(address _user, address _superToken) public {
        require(_user != address(0), "0 Address not allowed");
        require(_superToken != address(0), "0 Address not allowed");
        uint256 index = getTopUpIndex(_user, _superToken);
        deleteTopUp(index);
    }

    function deleteBatch(uint256[] calldata _indices) public {
        // delete multiple top ups
        for (uint256 i = 0; i < _indices.length; i++) {
            deleteTopUp(_indices[i]);
        }
    }
}