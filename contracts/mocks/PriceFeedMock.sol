//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/interfaces/FeedRegistryInterface.sol";
import "@chainlink/contracts/src/v0.8/Denominations.sol";

contract PriceFeedMock {
    FeedRegistryInterface internal registry;
    uint256 UsdRubPrice;
    uint256 public decimals = 8;

    /**
     * Network: Mainnet
     * Feed Registry: 0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf
     */
    constructor(address _registry) public {
        registry = FeedRegistryInterface(_registry);
        uint256 UsdRubPrice = 60 * 10**decimals;
    }

    /**
     * Returns the USD / RUB price
     */
    function getUsdRubPrice() public view returns (uint256) {
        return UsdRubPrice;
    }

    /**
     * Returns the RUB / USD price
     */
    function getRubUsdPrice() public view returns (uint256) {
        uint256 price = (1 * 10**decimals) / UsdRubPrice;
        return price;
    }

    /**
     * Returns the latest price
     */
    function getPrice(address base, address quote) public pure returns (uint256) {
        return 0;
    }

    function setUsdRubPrice(uint256 _UsdRubPrice) public {
        UsdRubPrice = _UsdRubPrice;
    }
}
