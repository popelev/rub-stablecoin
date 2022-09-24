//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Ruble is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 _initialSupply
    ) public ERC20(name, symbol) {
        _mint(msg.sender, _initialSupply);
    }
}
