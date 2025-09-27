// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract Counter is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    uint256 public count;

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        count = 0;
    }

    function increment() public {
        count++;
    }

    function decrement() public {
        count--;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    // 预留存储间隙，支持未来升级
    uint256[50] private __gap;
}

