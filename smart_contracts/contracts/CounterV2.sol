// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Counter.sol";

contract CounterV2 is Counter {
    function reset() public {
        count = 0;
    }

    function getVersion() public pure returns (string memory) {
        return "V2";
    }

    uint256 public lastResetTime;

    function resetWithTimestamp() public {
        count = 0;
        lastResetTime = block.timestamp;
    }
}

