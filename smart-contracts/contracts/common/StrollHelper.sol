// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IStrollResolver.sol";

/**
 * @title Modified IERC20 interface
 * @dev This interface is used to access decimals of an ERC20 token
 */
interface IERC20Mod is IERC20 {
    function decimals() external view returns (uint8);
}

contract StrollHelper is Ownable {
    event StrollResolverChanged(IStrollResolver newStrollResolver);

    // For mainnet deployment
    // IConstantFlowAgreementV1 public constant CFA_V1 =
    //     IConstantFlowAgreementV1(0x6EeE6060f715257b970700bc2656De21dEdF074C);

    // For testnet deployment
    IConstantFlowAgreementV1 public constant CFA_V1 =
        IConstantFlowAgreementV1(0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873);

    IStrollResolver private strollResolver;

    constructor(IStrollResolver _strollResolver) {
        strollResolver = _strollResolver;
    }

    function changeStrollResolver(IStrollResolver _newStrollResolver)
        external
        onlyOwner
    {
        strollResolver = _newStrollResolver;

        emit StrollResolverChanged(_newStrollResolver);
    }

    function requireTopUp(ISuperToken _superToken, address _user)
        external
        view
        returns (bool, uint256)
    {
        uint128 lowerLimit = strollResolver.lowerLimit();
        uint128 upperLimit = strollResolver.upperLimit();
        int96 flowRate = CFA_V1.getNetFlow(_superToken, _user);

        if (flowRate < 0) {
            uint256 balance = _superToken.balanceOf(_user);
            uint256 positiveFlowRate = uint256(uint96(-1 * flowRate));

            if (balance <= (positiveFlowRate * lowerLimit)) {
                uint256 topUpAmount = positiveFlowRate * upperLimit;
                return (
                    true,
                    topUpAmount /
                        10 **
                            (18 -
                                IERC20Mod(_superToken.getUnderlyingToken())
                                    .decimals())
                );
            }
        }

        return (false, 0);
    }

    // /// @dev Is this function even necessary ?
    // function checkTopUp(
    //     ISuperToken _superToken,
    //     address _user
    // ) external view returns (bool) {
    //     uint128 lowerLimit = strollResolver.lowerLimit();
    //     int96 flowRate = CFA_V1.getNetFlow(_superToken, _user);

    //     if (flowRate < 0) {
    //         uint256 balance = _superToken.balanceOf(_user);
    //         uint256 positiveFlowRate = uint256(uint96(-1 * flowRate));

    //         if (balance <= (positiveFlowRate * lowerLimit)) return true;
    //     }

    //     return false;
    // }
}
