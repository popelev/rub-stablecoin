//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/interfaces/FeedRegistryInterface.sol";
import "@chainlink/contracts/src/v0.8/Denominations.sol";

contract PriceFeed {
    FeedRegistryInterface internal registry;

    /**
     * Network: Mainnet
     * Feed Registry: 0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf
     */
    constructor(address _registry) public {
        registry = FeedRegistryInterface(_registry);
    }

    /**
     * Returns the USD / RUB price
     */
    function getUsdRubPrice() public view returns (uint) {
        (
            ,
            /*uint80 roundID*/
            int price, /*uint startedAt*/ /*uint timeStamp*/ /*uint80 answeredInRound*/
            ,
            ,

        ) = registry.latestRoundData(Denominations.USD, Denominations.RUB);
        return uint(price);
    }

    /**
     * Returns the RUB / USD price
     */
    function getRubUsdPrice() public view returns (uint) {
        (
            ,
            /*uint80 roundID*/
            int price, /*uint startedAt*/ /*uint timeStamp*/ /*uint80 answeredInRound*/
            ,
            ,

        ) = registry.latestRoundData(Denominations.RUB, Denominations.USD);
        return uint(price);
    }

    /**
     * Returns the latest price
     */
    function getPrice(address base, address quote) public view returns (uint) {
        (
            ,
            /*uint80 roundID*/
            int price, /*uint startedAt*/ /*uint timeStamp*/ /*uint80 answeredInRound*/
            ,
            ,

        ) = registry.latestRoundData(base, quote);
        return uint(price);
    }
}
