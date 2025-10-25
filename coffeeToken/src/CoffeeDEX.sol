// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CoffeeToken.sol";
import "./KYC.sol";

contract CoffeeDEX {
    CoffeeToken public token;
    KYC public kyc;
    uint256 public tokenReserve;
    uint256 public ethReserve;

    event LiquidityAdded(address indexed provider, uint256 tokenAmount, uint256 ethAmount);
    event Swapped(address indexed user, uint256 tokenIn, uint256 ethOut);

    constructor(address _token, address _kyc) {
        token = CoffeeToken(_token);
        kyc = KYC(_kyc);
    }

    modifier onlyAllowed(address user) {
        require(kyc.isAllowed(user), "User not KYC verified or blacklisted");
        _;
    }

    // 👇 Ajouter de la liquidité
    function addLiquidity(uint256 tokenAmount) external payable onlyAllowed(msg.sender) {
        require(token.balanceOf(msg.sender) >= tokenAmount, "Not enough tokens");
        // pull tokens from the liquidity provider into the DEX using allowance
        token.transferFrom(msg.sender, address(this), tokenAmount);
        tokenReserve += tokenAmount;
        ethReserve += msg.value;

        emit LiquidityAdded(msg.sender, tokenAmount, msg.value);
    }

    // Swap ETH -> CTK (simplifié)
    function swapEthToToken() external payable onlyAllowed(msg.sender) {
        require(msg.value > 0, "Send ETH to swap");
        require(ethReserve > 0 && tokenReserve > 0, "INSUFFICIENT_LIQUIDITY");
        uint256 ethIn = msg.value;

        // Standard formula: tokenOut = (ethIn * tokenReserve) / (ethReserve + ethIn)
        uint256 tokenOut = (ethIn * tokenReserve) / (ethReserve + ethIn);
        require(token.balanceOf(address(this)) >= tokenOut, "Not enough tokens in pool");

        ethReserve += ethIn;
        tokenReserve -= tokenOut;

        token.transfer(msg.sender, tokenOut);
        emit Swapped(msg.sender, 0, tokenOut);
    }

    // Swap CTK -> ETH (simplifié)
    function swapTokenToEth(uint256 tokenIn) external onlyAllowed(msg.sender) {
        require(tokenIn > 0, "Send tokens to swap");
        require(token.balanceOf(msg.sender) >= tokenIn, "Not enough tokens");
        require(tokenReserve > 0, "NO_LIQUIDITY");
        uint256 ethOut = (tokenIn * ethReserve) / (tokenReserve + tokenIn);

        require(address(this).balance >= ethOut, "Not enough ETH in pool");
        
        token.transferFrom(msg.sender, address(this), tokenIn);
        tokenReserve += tokenIn;
        ethReserve -= ethOut;

        payable(msg.sender).transfer(ethOut);
        emit Swapped(msg.sender, tokenIn, ethOut);
    }
}
