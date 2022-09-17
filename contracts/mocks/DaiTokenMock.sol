//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DaiTokenMock is ERC20 {
    constructor() ERC20("MockDaiToken", "DAI") {
        _mint(msg.sender, 100000000 * 10**decimals());
    }
}
