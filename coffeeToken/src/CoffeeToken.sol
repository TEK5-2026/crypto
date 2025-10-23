// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IKYC {
    function isAllowed(address user) external view returns (bool);
}

contract CoffeeToken {
    string public name = "Coffee Token";
    string public symbol = "CTK";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    address public admin;
    IKYC public kyc;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    modifier onlyAllowed(address user) {
        require(kyc.isAllowed(user), "User not KYC verified or blacklisted");
        _;
    }

constructor(address _kyc) {
    admin = msg.sender;
    kyc = IKYC(_kyc);
    balanceOf[admin] = 1000 * 10 ** uint256(decimals);
    totalSupply = 1000 * 10 ** uint256(decimals);
    emit Transfer(address(0), admin, totalSupply);
}


    function transfer(address to, uint256 amount)
        external
        onlyAllowed(msg.sender)
        onlyAllowed(to)
        returns (bool)
    {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount)
        external
        onlyAllowed(from)
        onlyAllowed(to)
        returns (bool)
    {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Not approved");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == admin, "Only admin can mint");
        _mint(to, amount);
    }

    function _mint(address to, uint256 amount) internal onlyAllowed(to) {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}
