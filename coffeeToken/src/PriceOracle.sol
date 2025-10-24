// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PriceOracle is Ownable {
    uint256 public price; // price of 1 CTK in USD cents

    event PriceUpdated(uint256 newPrice);

    constructor(uint256 _initialPrice) Ownable(msg.sender) {
        price = _initialPrice;
    }

    function updatePrice(uint256 _newPrice) external onlyOwner {
        price = _newPrice;
        emit PriceUpdated(_newPrice);
    }

    function getPrice() external view returns (uint256) {
        return price;
    }
}
