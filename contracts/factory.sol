//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./exchangeV1.sol";

interface IFactory {
    function getExchange(address _tokenAddress) external returns (address);
}

/**
 * @title Contract for
 */
contract FactoryV1 is IFactory {
    mapping(address => address) public tokenToExchangeV1;

    function createExchange(address _tokenAddress) public returns (address) {
        require(_tokenAddress != address(0), "invalid token address");
        require(
            tokenToExchangeV1[_tokenAddress] == address(0),
            "exchangeV1 already exists"
        );

        ExchangeV1 exchangeV1 = new ExchangeV1(_tokenAddress);
        tokenToExchangeV1[_tokenAddress] = address(exchangeV1);

        return address(exchangeV1);
    }

    function getExchange(address _tokenAddress) public view returns (address) {
        return tokenToExchangeV1[_tokenAddress];
    }
}
