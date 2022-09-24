//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Contract for exchange Eth - Erc20 (Uniswap v1 like)
 */
contract Exchange is ERC20 {
    IERC20 public token;

    constructor(address _token) ERC20("Dex-LP-V1", "DLP-V1") {
        require(_token != address(0), "invalid token address");

        token = IERC20(_token);
    }

    /**
     * @notice This function will add liquidity to pool if you send token amount and ether
     */
    function addLiquidity(uint256 _tokenAmount)
        public
        payable
        returns (uint256 liquidity)
    {
        if (getTokenReserve() == 0) {
            // init
            token.transferFrom(msg.sender, address(this), _tokenAmount);
            liquidity = address(this).balance;
        } else {
            // save current liquidity ratio
            uint256 ethReserve = address(this).balance - msg.value;
            uint256 tokenReserve = getTokenReserve();
            uint256 tokenAmount = (msg.value * tokenReserve) / ethReserve;

            require(_tokenAmount >= tokenAmount, "insufficient token amount");

            token.transferFrom(msg.sender, address(this), tokenAmount);
            liquidity = (totalSupply() * msg.value) / ethReserve;
        }

        _mint(msg.sender, liquidity);
    }

    /**
     * @notice This function will remove liquidity from pool and send rewards
     */
    function removeLiquidity(uint256 _amount)
        public
        returns (uint256 ethAmount, uint256 tokenAmount)
    {
        require(_amount > 0, "invalid amount");

        ethAmount = (address(this).balance * _amount) / totalSupply();
        tokenAmount = (getTokenReserve() * _amount) / totalSupply();

        _burn(msg.sender, _amount);

        payable(msg.sender).transfer(ethAmount);

        token.transfer(msg.sender, tokenAmount);
    }

    /**
     * @notice This function will return token reserves in pool
     */
    function getTokenReserve() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /**
     * @notice This function will return token amout which you will recieve if sale some ether
     */
    function getTokenAmount(uint256 _ethSold)
        public
        view
        returns (uint256 tokenAmount)
    {
        require(_ethSold > 0, "ethSold is too small");

        tokenAmount = getAmount(
            _ethSold,
            address(this).balance,
            getTokenReserve()
        );
    }

    /**
     * @notice This function will return ether amout which you will recieve if sale some tokens
     */
    function getEthAmount(uint256 _tokenSold)
        public
        view
        returns (uint256 ethAmount)
    {
        require(_tokenSold > 0, "tokenSold is too small");

        uint256 tokenReserve = getTokenReserve();
        ethAmount = getAmount(_tokenSold, tokenReserve, address(this).balance);
    }

    /**
     * @notice This function will swap Eth to token
     */
    function ethToTokenSwap(uint256 _minTokens) public payable {
        uint256 tokenReserve = getTokenReserve();
        uint256 tokensBought = getAmount(
            msg.value,
            address(this).balance - msg.value,
            tokenReserve
        );

        require(tokensBought >= _minTokens, "insufficient output amount");

        token.transfer(msg.sender, tokensBought);
    }

    /**
     * @notice This function will swap token to Eth
     */
    function tokenToEthSwap(uint256 _tokensSold, uint256 _minEth) public {
        uint256 tokenReserve = getTokenReserve();
        uint256 ethBought = getAmount(
            _tokensSold,
            tokenReserve,
            address(this).balance
        );

        require(ethBought >= _minEth, "insufficient output amount");

        token.transferFrom(msg.sender, address(this), _tokensSold);
        payable(msg.sender).transfer(ethBought);
    }

    /**
     * @notice This function will calculate amout of something by curve
     */
    function getAmount(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) private pure returns (uint256 outputAmount) {
        require(inputReserve > 0 && outputReserve > 0, "invalid reserves");

        uint256 inputAmountWithFee = inputAmount * 99;
        uint256 numerator = inputAmountWithFee * outputReserve;
        uint256 denominator = (inputReserve * 100) + inputAmountWithFee;

        outputAmount = numerator / denominator;
    }
}
