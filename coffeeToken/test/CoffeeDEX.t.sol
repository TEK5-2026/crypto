// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CoffeeToken.sol";
import "../src/KYC.sol";
import "../src/CoffeeDEX.sol";

contract CoffeeDEXTest is Test {
    KYC kyc;
    CoffeeToken token;
    CoffeeDEX dex;
    address user1 = address(0x1);

    function setUp() public {
        kyc = new KYC();
        token = new CoffeeToken(address(kyc));
        dex = new CoffeeDEX(address(token), address(kyc));

        kyc.setWhitelist(address(this), true);
        kyc.setWhitelist(user1, true);

        // Donner des tokens à user1 pour swap
        token.transfer(user1, 100 ether);
    }

    function testAddLiquidity() public {
        token.approve(address(dex), 50 ether);
        dex.addLiquidity{value: 1 ether}(50 ether);
        assertEq(token.balanceOf(address(dex)), 50 ether);
        assertEq(address(dex).balance, 1 ether);
    }

    function testSwapEthToToken() public {
        token.approve(address(dex), 50 ether);
        dex.addLiquidity{value: 1 ether}(50 ether);

        dex.swapEthToToken{value: 0.1 ether}();
        assert(token.balanceOf(address(this)) > 0);
    }

    function testSwapTokenToEth() public {
        token.approve(address(dex), 50 ether);
        dex.addLiquidity{value: 1 ether}(50 ether);

        token.approve(address(dex), 10 ether);
        dex.swapTokenToEth(10 ether);
        assert(address(this).balance > 0);
    }
}
