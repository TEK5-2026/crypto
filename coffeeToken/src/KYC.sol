// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract KYC {
    address public admin;
    mapping(address => bool) public whitelist;
    mapping(address => bool) public blacklist;

    event Whitelisted(address indexed user, bool allowed);
    event Blacklisted(address indexed user, bool blocked);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    function setWhitelist(address user, bool allowed) external onlyAdmin {
        whitelist[user] = allowed;
        emit Whitelisted(user, allowed);
    }

    function setBlacklist(address user, bool blocked) external onlyAdmin {
        blacklist[user] = blocked;
        emit Blacklisted(user, blocked);
    }

    function isAllowed(address user) public view returns (bool) {
        return whitelist[user] && !blacklist[user];
    }
}
