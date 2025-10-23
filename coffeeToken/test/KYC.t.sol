// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/KYC.sol";

contract KYCTest is Test {
    KYC public kyc;
    address user1 = address(0x1);
    address user2 = address(0x2);

    function setUp() public {
        kyc = new KYC();
    }

    function testAdminIsDeployer() public {
        assertEq(kyc.admin(), address(this));
    }

    function testWhitelistAndBlacklist() public {
        kyc.setWhitelist(user1, true);
        assertTrue(kyc.whitelist(user1));
        assertTrue(kyc.isAllowed(user1));

        kyc.setBlacklist(user1, true);
        assertTrue(kyc.blacklist(user1));
        assertFalse(kyc.isAllowed(user1));
    }

    function testOnlyAdminCanUpdate() public {
        vm.prank(user2);
        vm.expectRevert("Not admin");
        kyc.setWhitelist(user1, true);
    }
}
