//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./priceFeed.sol";

contract TokenFarm is Ownable {
    string public name;
    ERC20 public immutable Ruble;
    PriceFeed public immutable RublePriceFeed;

    address[] public stakers;
    // token > address
    mapping(address => mapping(address => uint256)) public stakingBalance;
    mapping(address => uint256) public uniqueTokensStaked;

    constructor(address _RubleAddress, address _RublePriceFeedAddress) public {
        Ruble = ERC20(_RubleAddress);
        RublePriceFeed = PriceFeed(_RublePriceFeedAddress);
        name = Ruble.name();
    }

    function stakeTokens(uint256 _amount, address token) public {
        require(_amount > 0, "amount cannot be 0");
        updateUniqueTokensStaked(msg.sender, token);
        ERC20(token).transferFrom(msg.sender, address(this), _amount);
        stakingBalance[token][msg.sender] = stakingBalance[token][msg.sender] + _amount;
        if (uniqueTokensStaked[msg.sender] == 1) {
            stakers.push(msg.sender);
        }

        issueTokens(msg.sender, _amount);
    }

    function unstakeTokens(address token) public {
        uint256 balance = stakingBalance[token][msg.sender];
        require(balance > 0, "staking balance cannot be 0");
        ERC20(token).transfer(msg.sender, balance);
        stakingBalance[token][msg.sender] = 0;
        uniqueTokensStaked[msg.sender] = uniqueTokensStaked[msg.sender] - 1;

        uint256 balanceRuble = Ruble.balanceOf(address(msg.sender));
        Ruble.transferFrom(msg.sender, address(this), balanceRuble);
    }

    function updateUniqueTokensStaked(address user, address token) internal {
        if (stakingBalance[token][user] <= 0) {
            uniqueTokensStaked[user] = uniqueTokensStaked[user] + 1;
        }
    }

    function issueTokens(
        address recipient,
        uint256 /*amount*/
    ) internal {
        Ruble.transfer(recipient, RublePriceFeed.getUsdRubPrice());
    }
}
