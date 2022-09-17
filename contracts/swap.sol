//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./priceFeed.sol";

contract DaiRubTokenSwap is Ownable {
    ERC20 public immutable DAI;
    ERC20 public immutable Ruble;
    PriceFeed public immutable RublePriceFeed;
    uint public constant FEE = 0;

    constructor(
        address _DaiAddress,
        address _RubleAddress,
        address _RublePriceFeedAddress
    ) public {
        DAI = ERC20(_DaiAddress);
        Ruble = ERC20(_RubleAddress);
        RublePriceFeed = PriceFeed(_RublePriceFeedAddress);
    }

    function getUsdRubPrice() public view returns (uint) {
        return RublePriceFeed.getUsdRubPrice();
    }

    function getRubUsdPrice() public view returns (uint) {
        return RublePriceFeed.getRubUsdPrice();
    }
}
