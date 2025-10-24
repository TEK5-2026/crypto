// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PriceOracle.sol";

// We simulate real world asset price here: ICO Coffee Market~ 300 à 450 cents USD/kg
contract DeployOracle is Script {
    function run() external {
        vm.startBroadcast();

        PriceOracle oracle = new PriceOracle(300); // $3.00 initial

        vm.stopBroadcast();
    }
}
