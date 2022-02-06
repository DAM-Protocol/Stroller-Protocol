//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IStrategy.sol";
import "./common/StrollHelper.sol";
import "./interfaces/IStrollResolver.sol";
import "hardhat/console.sol";

// solhint-disable not-rely-on-time
contract Registry is Ownable {
    using StrollHelper for ISuperToken;

    struct Strategy {
        IStrategy strategyAddress;
        address token;
    }

    // Modify this struct later to support multiple strategies in the future
    struct TopUp {
        address owner;
        ISuperToken superToken;
        Strategy strategy;
        uint256 time;
    }

    TopUp[] private topUps;
    mapping(address => mapping(address => uint256)) private topUpMap; // user => superToken => uint
    uint256[] private deletedTopUps;

    uint256 public scanLength;
    IStrollResolver private immutable strollResolver;

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
        uint256 _time
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
        TopUp memory topUp = TopUp(
            msg.sender,
            ISuperToken(_superToken),
            Strategy(IStrategy(_strategy), _liquidityToken),
            _time
        );

        if (deletedTopUps.length > 0) {
            index = deletedTopUps[deletedTopUps.length - 1];
            topUps[index] = topUp;
            deletedTopUps.pop();
        } else {
            index = topUps.length;
            topUps.push(topUp);
        }
        topUpMap[msg.sender][_superToken] = index;
    }

    function getTopUp(address _user, address _superToken)
        public
        view
        returns (
            address,
            ISuperToken,
            Strategy memory,
            uint256
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
            uint256
        )
    {
        require(_index < topUps.length, "Index out of bounds");
        return (
            topUps[_index].owner,
            topUps[_index].superToken,
            topUps[_index].strategy,
            topUps[_index].time
        );
    }

    function getTotalTopUps() public view returns (uint256) {
        return topUps.length;
    }

    function checkTopUp(uint256 _index) public view returns (bool) {
        if (_index >= topUps.length) return false;

        TopUp memory topup = topUps[_index];
        if (
            topup.owner == address(0) ||
            topup.time < block.timestamp ||
            IERC20(topup.strategy.token).allowance(
                topup.owner,
                address(topup.strategy.strategyAddress)
            ) ==
            0
        ) return false;

        return
            topup.superToken.checkTopUp(
                topup.owner,
                strollResolver.lowerLimit()
            );
    }

    function performTopUp(uint256 _index) public {
        TopUp memory topup = topUps[_index];
        topup.strategy.strategyAddress.topUp(
            topup.owner,
            topup.strategy.token,
            ISuperToken(topup.superToken)
        );
    }

    // ChainLink functions
    function checkUpkeep(bytes calldata checkData)
        public
        view
        returns (bool upkeepNeeded, bytes memory performData)
    {
        uint256 startIndex = abi.decode(checkData, (uint256)) * scanLength;
        uint256 endIndex = startIndex + scanLength;
        for (uint256 i = startIndex; i < endIndex; i++) {
            if (checkTopUp(i)) {
                return (true, abi.encode(i));
            }
        }
    }

    function performUpkeep(bytes calldata performData) external {
        uint256 index = abi.decode(performData, (uint256));
        performTopUp(index);
    }

    function deleteTopUp(uint256 _index) public {
        require(_index < topUps.length, "Index out of bounds");
        TopUp memory topup = topUps[_index];
        require(
            topup.owner == msg.sender || topup.time < block.timestamp,
            "Can't delete TopUp"
        );
        require(
            topUpMap[topup.owner][address(topup.superToken)] > 0,
            "TopUp not found"
        );
        topUpMap[topup.owner][address(topup.superToken)] = 0;

        topUps[_index].owner = address(0);
        deletedTopUps.push(_index);
    }

    function deleteTopUp(address _user, address _superToken) public {
        require(_user != address(0), "0 Address not allowed");
        require(_superToken != address(0), "0 Address not allowed");
        uint256 index = getTopUpIndex(_user, _superToken);
        deleteTopUp(index);
    }

    function deleteBatch(uint256[] calldata _indices) public {
        for (uint256 i = 0; i < _indices.length; i++) {
            deleteTopUp(_indices[i]);
        }
    }
}
