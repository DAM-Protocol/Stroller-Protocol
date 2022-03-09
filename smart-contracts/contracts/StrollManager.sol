//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

// import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IStrategy.sol";
import {OpsReady, IOps} from "./keepers/OpsReady.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

interface IERC20Mod is IERC20 {
    function decimals() external view returns (uint8);
}

// solhint-disable not-rely-on-time
contract Registry is Ownable, OpsReady {
    // Modify this struct later to support multiple strategies in the future
    struct TopUp {
        address user;
        ISuperToken superToken;
        IStrategy strategy;
        address liquidityToken;
        uint64 time;
        uint64 lowerLimit;
        uint64 upperLimit;
    }

    uint64 public minLower;
    uint64 public minUpper;
    mapping(bytes32 => TopUp) private topUps; // user => superToken => uint

    // For testnet deployment
    // solhint-disable-next-line
    IConstantFlowAgreementV1 public immutable CFA_V1;
    // IConstantFlowAgreementV1(0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873);

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

    event PerformedTopUp(bytes32 indexed id);

    constructor(
        address _icfa,
        address _ops,
        uint64 _minLower,
        uint64 _minUpper
    ) OpsReady(_ops) {
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
            TopUp memory topUp = TopUp(
                msg.sender,
                ISuperToken(_superToken),
                IStrategy(_strategy),
                _liquidityToken,
                _time,
                _lowerLimit,
                _upperLimit
            );
            topUps[index] = topUp;
        }

        IOps(ops).createTask(
            address(this),
            this.gelatoPerformTopUp.selector,
            address(this),
            abi.encodeWithSelector(this.gelatoCheckTopUp.selector, index)
        );

        emit TopUpCreated(
            index,
            msg.sender,
            _superToken,
            _strategy,
            _liquidityToken,
            _time,
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
            topUp.time,
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
        return checkTopUp(index);
    }

    function checkTopUp(bytes32 _index) public view returns (uint256) {
        TopUp memory topUp = topUps[_index];

        if (
            topUp.user == address(0) || // Task exists and has a valid user
            topUp.time > block.timestamp || // Task exists and current time is before task end time
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
                uint256 topUpAmount = positiveFlowRate * topUp.upperLimit;
                return
                    topUpAmount /
                    10 **
                        (18 -
                            IERC20Mod(topUp.superToken.getUnderlyingToken())
                                .decimals());
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
        performTopUp(index);
    }

    function performTopUp(bytes32 _index) public {
        TopUp memory topUp = topUps[_index];
        uint256 topUpAmount = checkTopUp(_index);
        require(topUpAmount > 0, "TopUp check failed");
        topUp.strategy.topUp(
            topUp.user,
            topUp.liquidityToken,
            ISuperToken(topUp.superToken),
            topUpAmount
        );
        emit PerformedTopUp(_index);
    }

    function gelatoCheckTopUp(bytes32 _index)
        public
        view
        returns (bool canExec, bytes memory execPayload)
    {
        // TopUp memory topup = topUps[_index];
        uint256 topUpAmount = checkTopUp(_index);

        canExec = topUpAmount > 0;
        execPayload = abi.encodeWithSelector(
            this.gelatoPerformTopUp.selector,
            _index
        );
    }

    function gelatoPerformTopUp(bytes32 _index) public onlyOps {
        performTopUp(_index); //perform TopUp

        (uint256 fee, address feeToken) = IOps(ops).getFeeDetails(); //pay fee to gelato
        _transfer(fee, feeToken);
    }

    function deleteTopUp(bytes32 _index) public {
        TopUp memory topUp = topUps[_index];
        require(topUp.time > 0, "TopUp does not exist");
        require(
            topUp.user == msg.sender || topUp.time < block.timestamp,
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
        deleteTopUp(index);
    }

    function deleteBatch(bytes32[] calldata _indices) public {
        // delete multiple top ups
        for (uint256 i = 0; i < _indices.length; i++) {
            deleteTopUp(_indices[i]);
        }
    }
}
