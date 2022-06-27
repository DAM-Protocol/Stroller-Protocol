// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.13;

interface IStrollManager {
    function checkTopUp(
        address _user,
        address _superToken,
        address _liquidityToken
    ) external view returns (uint256);

    function performTopUp(
        address _user,
        address _superToken,
        address _liquidityToken
    ) external;
}

contract StrollKeeper {
    IStrollManager public immutable strollManager;

    constructor(IStrollManager _strollManager) {
        strollManager = _strollManager;
    }

    function executor(
        address _user,
        address _superToken,
        address _liquidityToken
    ) external {
        strollManager.performTopUp(_user, _superToken, _liquidityToken);
    }

    function checker(
        address _user,
        address _superToken,
        address _liquidityToken
    ) external view returns (bool _canExec, bytes memory _execPayload) {
        if (strollManager.checkTopUp(_user, _superToken, _liquidityToken) > 0) {
            _canExec = true;
            _execPayload = abi.encodeWithSelector(
                StrollKeeper.executor.selector,
                _user,
                _superToken,
                _liquidityToken
            );
        }
    }
}
