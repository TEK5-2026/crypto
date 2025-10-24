// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PriceOracle.sol";

contract PriceOracleTest is Test {
    PriceOracle oracle;
    address owner = address(0x1);
    address attacker = address(0x2);

    function setUp() public {
        // Deploy Oracle with initial price $3.00 -> 300 cents
        vm.prank(owner);
        oracle = new PriceOracle(300);
    }

    function testInitialPrice() public {
        uint256 price = oracle.getPrice();
        assertEq(price, 300);
    }

    function testUpdatePriceSuccess() public {
        vm.startPrank(owner);

        vm.expectEmit(true, true, true, true);
        emit PriceUpdated(500);

        oracle.updatePrice(500);
        assertEq(oracle.getPrice(), 500);

        vm.stopPrank();
    }

    function testUpdatePriceFail_NotOwner() public {
        vm.prank(attacker);
        vm.expectRevert(); // should fail
        oracle.updatePrice(400);
    }

    event PriceUpdated(uint256 newPrice);
}
