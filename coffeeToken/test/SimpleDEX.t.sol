// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/KYC.sol";
import "../src/CoffeeToken.sol";
import "../src/SimpleDEX.sol";

contract SimpleDEXTest is Test {
    KYC kyc;
    CoffeeToken token;
    SimpleDEX dex;
    address alice = address(0xA11CE);

    function setUp() public {
        kyc = new KYC();
        token = new CoffeeToken(address(kyc));
        kyc.setWhitelist(address(this), true);
        kyc.setWhitelist(alice, true);

        token.mint(address(this), 1000 ether);

    dex = new SimpleDEX(address(token), 100); // 1 ETH = 100 CTK
    // whitelist the DEX so it can receive tokens
    kyc.setWhitelist(address(dex), true);
    token.transfer(address(dex), 500 ether); // pool initial
        vm.deal(alice, 10 ether);
    }

    function testBuyTokens() public {
        vm.startPrank(alice);
        dex.buy{value: 1 ether}();
        assertEq(token.balanceOf(alice), 100 ether);
        vm.stopPrank();
    }

    function testSellTokens() public {
        vm.startPrank(alice);
        dex.buy{value: 1 ether}();
        token.approve(address(dex), 100 ether);
        dex.sell(100 ether);
        assertGt(alice.balance, 9 ether); // a récupéré de l'ETH
        vm.stopPrank();
    }
}
