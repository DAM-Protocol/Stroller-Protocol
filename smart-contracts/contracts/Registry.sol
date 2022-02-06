//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IStrategy.sol";

// solhint-disable not-rely-on-time
contract Registry is Ownable {
    struct Strategy {
        IStrategy strategyAddress;
        address token;
    }

    // Modify this struct later to support multiple strategies in the future
    struct TopUp {
        address owner;
        address superToken;
        Strategy strategy;
        uint256 time;
    }

    TopUp[] private topUps;
    mapping(address => mapping(address => uint256)) private topUpMap; // user => superToken => uint
    uint256[] private deletedTopUps;

    uint256 private scanLength;

    constructor() {
        TopUp memory topUp;
        topUps.push(topUp);
    }

    function getScanLength() public view returns (uint256) {
        return scanLength;
    }

    function setScanLength(uint256 _scanLength) public onlyOwner {
        scanLength = _scanLength;
    }

    function createTopUp(
        address _superToken,
        address _strategy,
        address _liquidityToken,
        uint256 _time
    ) public {
        require(_superToken != address(0), "0 Address not allowed");

        // check if topUp already exists for given user and superToken
        uint256 index = getTopUpIndex(msg.sender, _superToken);

        require(index != 0, "TopUp already exists");

        // create new topUp
        TopUp memory topUp = TopUp(
            msg.sender,
            _superToken,
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
            address,
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
            address,
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
        require(_index < topUps.length, "Index out of bounds");

        TopUp memory topup = topUps[_index];
        require(topup.time > block.timestamp, "Task expired");
        require(topup.owner != address(0), "TopUp deleted");

        return true;
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
        require(topUpMap[topup.owner][topup.superToken] > 0, "TopUp not found");
        topUpMap[topup.owner][topup.superToken] = 0;

        topUps[_index].owner = address(0);
        deletedTopUps.push(_index);
    }

    function deleteTopUp(address _user, address _superToken) public {
        require(_user != address(0), "0 Address not allowed");
        require(_superToken != address(0), "0 Address not allowed");
        uint256 index = getTopUpIndex(_user, _superToken);
        deleteTopUp(index);
    }

    // function addStrategy(address _liquidityToken, address _strategy) public {
    //     require(_liquidityToken != address(0), "0 Address not allowed");
    //     require(_strategy != address(0), "0 Address not allowed");
    //     require(
    //         strategies[_liquidityToken] == IStrategy(address(0)),
    //         "Strategy already exists"
    //     );
    //     strategies[_liquidityToken] = IStrategy(address(_strategy));
    // }

    // function removeStrategy(address _liquidityToken) public {
    //     require(_liquidityToken != address(0), "0 Address not allowed");
    //     require(
    //         strategies[_liquidityToken] != IStrategy(address(0)),
    //         "Strategy does not exist"
    //     );
    //     strategies[_liquidityToken] = IStrategy(address(0));
    // }
}
