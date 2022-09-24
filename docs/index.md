# Solidity API

## Exchange

### tokenAddress

```solidity
address tokenAddress
```

### constructor

```solidity
constructor(address _token) public
```

### addLiquidity

```solidity
function addLiquidity(uint256 _tokenAmount) public payable
```

This function will add liquidity to pool if you send token amount and ether

### getTokenReserve

```solidity
function getTokenReserve() public view returns (uint256)
```

This function will return token reserves in pool

### getTokenAmount

```solidity
function getTokenAmount(uint256 _ethSold) public view returns (uint256 tokenAmount)
```

This function will return token amout which you will recieve if sale some ether

### getEthAmount

```solidity
function getEthAmount(uint256 _tokenSold) public view returns (uint256 ethAmount)
```

This function will return ether amout which you will recieve if sale some tokens

### ethToTokenSwap

```solidity
function ethToTokenSwap(uint256 _minTokens) public payable
```

This function will swap Eth to token

### tokenToEthSwap

```solidity
function tokenToEthSwap(uint256 _tokensSold, uint256 _minEth) public
```

This function will swap token to Eth

### getAmount

```solidity
function getAmount(uint256 inputAmount, uint256 inputReserve, uint256 outputReserve) private pure returns (uint256 outputAmount)
```

This function will calculate amout of something by curve

## Ruble

### constructor

```solidity
constructor(string name, string symbol, uint256 _initialSupply) public
```

## DaiTokenMock

### constructor

```solidity
constructor() public
```

## PriceFeedMock

### registry

```solidity
contract FeedRegistryInterface registry
```

### UsdRubPrice

```solidity
uint256 UsdRubPrice
```

### decimals

```solidity
uint256 decimals
```

### constructor

```solidity
constructor(address _registry) public
```

Network: Mainnet
Feed Registry: 0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf

### getUsdRubPrice

```solidity
function getUsdRubPrice() public view returns (uint256)
```

Returns the USD / RUB price

### getRubUsdPrice

```solidity
function getRubUsdPrice() public view returns (uint256)
```

Returns the RUB / USD price

### getPrice

```solidity
function getPrice(address base, address quote) public pure returns (uint256)
```

Returns the latest price

### setUsdRubPrice

```solidity
function setUsdRubPrice(uint256 _UsdRubPrice) public
```

## PriceFeed

### registry

```solidity
contract FeedRegistryInterface registry
```

### constructor

```solidity
constructor(address _registry) public
```

Network: Mainnet
Feed Registry: 0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf

### getUsdRubPrice

```solidity
function getUsdRubPrice() public view returns (uint256)
```

Returns the USD / RUB price

### getRubUsdPrice

```solidity
function getRubUsdPrice() public view returns (uint256)
```

Returns the RUB / USD price

### getPrice

```solidity
function getPrice(address base, address quote) public view returns (uint256)
```

Returns the latest price

## TokenFarm

### name

```solidity
string name
```

### Ruble

```solidity
contract ERC20 Ruble
```

### RublePriceFeed

```solidity
contract PriceFeed RublePriceFeed
```

### stakers

```solidity
address[] stakers
```

### stakingBalance

```solidity
mapping(address => mapping(address => uint256)) stakingBalance
```

### uniqueTokensStaked

```solidity
mapping(address => uint256) uniqueTokensStaked
```

### constructor

```solidity
constructor(address _RubleAddress, address _RublePriceFeedAddress) public
```

### stakeTokens

```solidity
function stakeTokens(uint256 _amount, address token) public
```

### unstakeTokens

```solidity
function unstakeTokens(address token) public
```

### updateUniqueTokensStaked

```solidity
function updateUniqueTokensStaked(address user, address token) internal
```

### issueTokens

```solidity
function issueTokens(address recipient, uint256) internal
```

## DaiRubTokenSwap

### DAI

```solidity
contract ERC20 DAI
```

### Ruble

```solidity
contract ERC20 Ruble
```

### RublePriceFeed

```solidity
contract PriceFeed RublePriceFeed
```

### FEE

```solidity
uint256 FEE
```

### constructor

```solidity
constructor(address _DaiAddress, address _RubleAddress, address _RublePriceFeedAddress) public
```

### getUsdRubPrice

```solidity
function getUsdRubPrice() public view returns (uint256)
```

### getRubUsdPrice

```solidity
function getRubUsdPrice() public view returns (uint256)
```

