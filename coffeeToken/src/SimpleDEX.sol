// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CoffeeToken.sol";

contract SimpleDEX {
    CoffeeToken public coffeeToken;
    address public admin;
    uint256 public rate; // combien de tokens pour 1 ETH

    event Bought(address indexed buyer, uint256 ethSpent, uint256 tokensReceived);
    event Sold(address indexed seller, uint256 tokensSold, uint256 ethReceived);

    constructor(address _coffeeToken, uint256 _rate) payable {
        admin = msg.sender;
        coffeeToken = CoffeeToken(_coffeeToken);
        rate = _rate;
    }

    // acheter du CoffeeToken avec de l'ETH
    function buy() external payable {
        uint256 tokenAmount = msg.value * rate;
        require(coffeeToken.balanceOf(address(this)) >= tokenAmount, "Not enough liquidity");
        coffeeToken.transfer(msg.sender, tokenAmount);
        emit Bought(msg.sender, msg.value, tokenAmount);
    }

    // vendre ses tokens contre de l'ETH
    function sell(uint256 tokenAmount) external {
        uint256 ethAmount = tokenAmount / rate;
        require(address(this).balance >= ethAmount, "Not enough ETH liquidity");
        coffeeToken.transferFrom(msg.sender, address(this), tokenAmount);
        payable(msg.sender).transfer(ethAmount);
        emit Sold(msg.sender, tokenAmount, ethAmount);
    }

    // l'admin peut déposer des tokens dans le pool
    function addLiquidity(uint256 tokenAmount) external payable {
        require(msg.sender == admin, "Only admin");
        coffeeToken.transferFrom(msg.sender, address(this), tokenAmount);
    }
}
