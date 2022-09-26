//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./factory.sol";

interface IExchangeV2 {
    /*addmodfunction ethToTokenSwap(uint256 _minTokens) external payable;

    function ethToTokenTransfer(uint256 _minTokens, address _recipient)
        external;*/
}

/**
 * @title Contract for ExchangeV2 Erc20 - Erc20
 */
contract ExchangeV2 is IExchangeV2, ERC20 {
    IERC20 public immutable token1;
    IERC20 public immutable token2;

    address public factoryAddress;

    constructor(address _token1, address _token2) ERC20("Dex-LP-V2", "DLP-V2") {
        require(_token1 != address(0), "invalid token address");
        require(_token2 != address(0), "invalid token address");

        token1 = IERC20(_token1);
        token2 = IERC20(_token2);

        factoryAddress = msg.sender;
    }

    /**
     * @notice This function will add liquidity to pool if you send token amount and ether
     */
    function addLiquidity(uint256 _token1Amount, uint256 _token2Amount)
        public
        returns (uint256 liquidity)
    {
        //require(_token1Amount > 0, "insufficient token amount");
        //require(_token2Amount > 0, "insufficient token amount");

        if (getTokenReserve(token2) == 0) {
            // init
            token1.transferFrom(msg.sender, address(this), _token1Amount);
            token2.transferFrom(msg.sender, address(this), _token2Amount);
            liquidity = getTokenReserve(token1);
        } else {
            // save current liquidity ratio
            uint256 token1Reserve = getTokenReserve(token1);
            token1.transferFrom(msg.sender, address(this), _token1Amount);
            uint256 token2Reserve = getTokenReserve(token2);
            uint256 token2Amount = (_token1Amount * token2Reserve) /
                token1Reserve;

            require(_token2Amount >= token2Amount, "insufficient token amount");

            token2.transferFrom(msg.sender, address(this), token2Amount);
            liquidity = (totalSupply() * _token1Amount) / token1Reserve;
        }

        _mint(msg.sender, liquidity);
    }

    /**
     * @notice This function will remove liquidity from pool and send rewards
     */
    function removeLiquidity(uint256 _amount)
        public
        returns (uint256 token1Amount, uint256 token2Amount)
    {
        require(_amount > 0, "invalid amount");

        token1Amount = (getTokenReserve(token1) * _amount) / totalSupply();
        token2Amount = (getTokenReserve(token2) * _amount) / totalSupply();

        _burn(msg.sender, _amount);

        token1.transfer(msg.sender, token1Amount);
        token2.transfer(msg.sender, token2Amount);
    }

    /**
     * @notice This function will return token reserves in pool
     */
    function getTokenReserve(IERC20 token) internal view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /**
     * @notice This function will return token reserves in pool
     */
    function getToken1Reserve() public view returns (uint256) {
        return getTokenReserve(token1);
    }

    /**
     * @notice This function will return token reserves in pool
     */
    function getToken2Reserve() public view returns (uint256) {
        return getTokenReserve(token2);
    }

    /**
     * @notice This function will return token amout which you will recieve if sale some token1er
     */
    function getToken1Amount(uint256 _tokenSold)
        public
        view
        returns (uint256 tokenAmount)
    {
        require(_tokenSold > 0, "tokenSold is too small");

        tokenAmount = getAmount(
            _tokenSold,
            getTokenReserve(token1),
            getTokenReserve(token2)
        );
    }

    /**
     * @notice This function will return token amout which you will recieve if sale some token1er
     */
    function getToken2Amount(uint256 _tokenSold)
        public
        view
        returns (uint256 tokenAmount)
    {
        require(_tokenSold > 0, "tokenSold is too small");

        tokenAmount = getAmount(
            _tokenSold,
            getTokenReserve(token2),
            getTokenReserve(token1)
        );
    }

    function Token1ToToken2Swap(
        uint256 _tokenSold,
        uint256 _minTokens,
        address recipient
    ) internal {
        TokenToTokenSwap(token1, token2, _tokenSold, _minTokens, recipient);
    }

    function Token2ToToken1Swap(
        uint256 _tokenSold,
        uint256 _minTokens,
        address recipient
    ) internal {
        TokenToTokenSwap(token2, token1, _tokenSold, _minTokens, recipient);
    }

    function TokenToTokenSwap(
        IERC20 _token1,
        IERC20 _token2,
        uint256 _tokenSold,
        uint256 _minTokens,
        address recipient
    ) internal {
        uint256 tokenReserve1 = getTokenReserve(_token1);
        uint256 tokenReserve2 = getTokenReserve(_token2);
        uint256 tokensBought = getAmount(
            _tokenSold,
            tokenReserve1,
            tokenReserve2
        );

        require(tokensBought >= _minTokens, "insufficient output amount");

        _token1.transferFrom(msg.sender, address(this), _tokenSold);
        _token2.transfer(recipient, tokensBought);
    }

    /**
     * @notice This function will calculate amout of something by curve
     */
    function getAmount(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) internal pure returns (uint256 outputAmount) {
        require(inputReserve > 0 && outputReserve > 0, "invalid reserves");

        uint256 inputAmountWithFee = inputAmount * 99;
        uint256 numerator = inputAmountWithFee * outputReserve;
        uint256 denominator = (inputReserve * 100) + inputAmountWithFee;

        outputAmount = numerator / denominator;
    }
}
