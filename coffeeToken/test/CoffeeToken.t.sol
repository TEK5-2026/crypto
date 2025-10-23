// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/KYC.sol";
import "../src/CoffeeToken.sol";

contract CoffeeTokenTest is Test {
    KYC kyc;
    CoffeeToken token;
    address user1 = address(0x1);
    address user2 = address(0x2);

    function setUp() public {
        kyc = new KYC();
        token = new CoffeeToken(address(kyc));

        // Admin et utilisateurs KYC
        kyc.setWhitelist(address(this), true);
        kyc.setWhitelist(user1, true);
        kyc.setWhitelist(user2, true);
    }

    function testInitialSupplyToAdmin() public view {
        assertEq(token.balanceOf(address(this)), 1000 ether);
    }

    function testTransferBetweenKYCUsers() public {
        token.transfer(user1, 100 ether);
        assertEq(token.balanceOf(user1), 100 ether);
    }

    function test_RevertWhen_TransferToNonKYCUser() public {
        address badUser = address(0x3);
        vm.expectRevert("User not KYC verified or blacklisted");
        token.transfer(badUser, 10 ether);
    }

    function testBlacklistPreventsTransfer() public {
        kyc.setBlacklist(user1, true);
        vm.expectRevert("User not KYC verified or blacklisted");
        token.transfer(user1, 10 ether);
    }
}
