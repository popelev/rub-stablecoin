const { ethers } = require("hardhat");
const { expect } = require("chai");
const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");

const parseEther = (value) => ethers.utils.parseEther(value.toString());
const formatEther = (value) =>
  ethers.utils.formatEther(
    typeof value === "string" ? value : value.toString()
  );
const getBalance = (value) => ethers.provider.getBalance(value.toString());

describe("Exchange", function () {
  let token;
  let exchange;
  let owner;
  let user;

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployAll() {
    // Contracts are deployed using the first signer/account by default
    const [Owner, User] = await ethers.getSigners();
    owner = Owner;
    user = User;

    const Ruble = await ethers.getContractFactory("Ruble");
    token = await Ruble.deploy("Ruble", "RUB", parseEther(1000000), {
      value: 0,
    });

    const Exchange = await ethers.getContractFactory("Exchange");
    exchange = await Exchange.deploy(token.address, { value: 0 });

    return {
      token,
      exchange,
      owner,
      user,
    };
  }

  describe("Deployment", function () {
    it("addLiquidity", async function () {
      await loadFixture(deployAll);

      await token.approve(exchange.address, parseEther(200));
      await exchange.addLiquidity(parseEther(200), { value: parseEther(100) });

      expect(await getBalance(exchange.address)).to.deep.equal(parseEther(100));
      expect(await exchange.getTokenReserve()).to.deep.equal(parseEther(200));
    });

    it("allows zero amounts", async () => {
      await loadFixture(deployAll);

      await token.approve(exchange.address, 0);
      await exchange.addLiquidity(0, { value: 0 });

      let balance = await getBalance(exchange.address);
      expect(balance.toNumber()).to.equal(0);

      let reserve = await exchange.getTokenReserve();
      expect(reserve.toNumber()).to.equal(0);
    });
  });

  describe("getTokenAmount", async () => {
    it("returns correct token amount", async () => {
      await loadFixture(deployAll);

      await token.approve(exchange.address, parseEther(2000));

      await exchange.addLiquidity(parseEther(2000), {
        value: parseEther(1000),
      });

      let tokensOut = await exchange.getTokenAmount(parseEther(1));
      expect(formatEther(tokensOut)).to.equal("1.978041738678708079");

      tokensOut = await exchange.getTokenAmount(parseEther(100));
      expect(formatEther(tokensOut)).to.equal("180.1637852593266606");

      tokensOut = await exchange.getTokenAmount(parseEther(1000));
      expect(formatEther(tokensOut)).to.equal("994.974874371859296482");
    });
  });

  describe("getEthAmount", async () => {
    it("returns correct ether amount", async () => {
      await loadFixture(deployAll);

      await token.approve(exchange.address, parseEther(2000));

      await exchange.addLiquidity(parseEther(2000), {
        value: parseEther(1000),
      });

      let ethOut = await exchange.getEthAmount(parseEther(2));
      expect(formatEther(ethOut)).to.deep.equal("0.989020869339354039");

      ethOut = await exchange.getEthAmount(parseEther(100));
      expect(formatEther(ethOut)).to.deep.equal("47.16531681753215817");

      ethOut = await exchange.getEthAmount(parseEther(2000));
      expect(formatEther(ethOut)).to.deep.equal("497.487437185929648241");
    });
  });

  describe("ethToTokenSwap", async () => {
    beforeEach(async () => {
      await loadFixture(deployAll);

      await token.approve(exchange.address, parseEther(2000));

      await exchange.addLiquidity(parseEther(2000), {
        value: parseEther(1000),
      });
    });

    it("transfers at least min amount of tokens", async () => {
      const userBalanceBefore = await getBalance(user.address);

      await exchange
        .connect(user)
        .ethToTokenSwap(parseEther(1.97), { value: parseEther(1) });

      const userBalanceAfter = await getBalance(user.address);
      expect(
        formatEther(userBalanceAfter.sub(userBalanceBefore))
      ).to.deep.equal("-1.000093753588062724");

      const userTokenBalance = await token.balanceOf(user.address);
      expect(formatEther(userTokenBalance)).to.deep.equal(
        "1.978041738678708079"
      );

      const exchangeEthBalance = await getBalance(exchange.address);
      expect(formatEther(exchangeEthBalance)).to.deep.equal("1001.0");

      const exchangeTokenBalance = await token.balanceOf(exchange.address);
      expect(formatEther(exchangeTokenBalance)).to.deep.equal(
        "1998.021958261321291921"
      );
    });

    it("fails when output amount is less than min amount", async () => {
      await expect(
        exchange
          .connect(user)
          .ethToTokenSwap(parseEther(2), { value: parseEther(1) })
      ).to.be.revertedWith("insufficient output amount");
    });

    it("allows zero swaps", async () => {
      await exchange
        .connect(user)
        .ethToTokenSwap(parseEther(0), { value: parseEther(0) });

      const userTokenBalance = await token.balanceOf(user.address);
      expect(formatEther(userTokenBalance)).to.deep.equal("0.0");

      const exchangeEthBalance = await getBalance(exchange.address);
      expect(formatEther(exchangeEthBalance)).to.deep.equal("1000.0");

      const exchangeTokenBalance = await token.balanceOf(exchange.address);
      expect(formatEther(exchangeTokenBalance)).to.deep.equal("2000.0");
    });
  });

  describe("tokenToEthSwap", async () => {
    beforeEach(async () => {
      await loadFixture(deployAll);

      await token.transfer(user.address, parseEther(2));

      await token.connect(user).approve(exchange.address, parseEther(2));
      await token.approve(exchange.address, parseEther(2000));

      await exchange.addLiquidity(parseEther(2000), {
        value: parseEther(1000),
      });
    });

    it("transfers at least min amount of tokens", async () => {
      const userBalanceBefore = await getBalance(user.address);

      await exchange
        .connect(user)
        .tokenToEthSwap(parseEther(2), parseEther(0.9));

      const userBalanceAfter = await getBalance(user.address);
      expect(
        formatEther(userBalanceAfter.sub(userBalanceBefore))
      ).to.deep.equal("0.988951178130649915");

      const userTokenBalance = await token.balanceOf(user.address);
      expect(formatEther(userTokenBalance)).to.deep.equal("0.0");

      const exchangeEthBalance = await getBalance(exchange.address);
      expect(formatEther(exchangeEthBalance)).to.deep.equal(
        "999.010979130660645961"
      );

      const exchangeTokenBalance = await token.balanceOf(exchange.address);
      expect(formatEther(exchangeTokenBalance)).to.deep.equal("2002.0");
    });

    it("fails when output amount is less than min amount", async () => {
      await expect(
        exchange.connect(user).tokenToEthSwap(parseEther(2), parseEther(1.0))
      ).to.be.revertedWith("insufficient output amount");
    });

    it("allows zero swaps", async () => {
      await exchange.connect(user).tokenToEthSwap(parseEther(0), parseEther(0));

      const userBalance = await getBalance(user.address);
      expect(formatEther(userBalance)).to.deep.equal("9999.99986285069798223");

      const userTokenBalance = await token.balanceOf(user.address);
      expect(formatEther(userTokenBalance)).to.deep.equal("2.0");

      const exchangeEthBalance = await getBalance(exchange.address);
      expect(formatEther(exchangeEthBalance)).to.deep.equal("1000.0");

      const exchangeTokenBalance = await token.balanceOf(exchange.address);
      expect(formatEther(exchangeTokenBalance)).to.deep.equal("2000.0");
    });
  });

  describe("removeLiquidity", async () => {
    beforeEach(async () => {
      await loadFixture(deployAll);

      await token.approve(exchange.address, parseEther(300));
      await exchange.addLiquidity(parseEther(200), {
        value: parseEther(100),
      });
    });

    it("removes some liquidity", async () => {
      const userEtherBalanceBefore = await getBalance(owner.address);
      const userTokenBalanceBefore = await token.balanceOf(owner.address);

      await exchange.removeLiquidity(parseEther(25));

      expect(await exchange.getTokenReserve()).to.equal(parseEther(150));
      expect(await getBalance(exchange.address)).to.equal(parseEther(75));

      const userEtherBalanceAfter = await getBalance(owner.address);
      const userTokenBalanceAfter = await token.balanceOf(owner.address);

      expect(
        formatEther(userEtherBalanceAfter.sub(userEtherBalanceBefore))
      ).to.equal("24.999902725931060155"); // 25 - gas fees

      expect(
        formatEther(userTokenBalanceAfter.sub(userTokenBalanceBefore))
      ).to.equal("50.0");
    });

    it("removes all liquidity", async () => {
      const userEtherBalanceBefore = await getBalance(owner.address);
      const userTokenBalanceBefore = await token.balanceOf(owner.address);

      await exchange.removeLiquidity(parseEther(100));

      expect(await exchange.getTokenReserve()).to.equal(parseEther(0));
      expect(await getBalance(exchange.address)).to.equal(parseEther(0));

      const userEtherBalanceAfter = await getBalance(owner.address);
      const userTokenBalanceAfter = await token.balanceOf(owner.address);

      expect(
        formatEther(userEtherBalanceAfter.sub(userEtherBalanceBefore))
      ).to.equal("99.999922180744848124"); // 100 - gas fees

      expect(
        formatEther(userTokenBalanceAfter.sub(userTokenBalanceBefore))
      ).to.equal("200.0");
    });

    it("pays for provided liquidity", async () => {
      const userEtherBalanceBefore = await getBalance(owner.address);
      const userTokenBalanceBefore = await token.balanceOf(owner.address);

      await exchange
        .connect(user)
        .ethToTokenSwap(parseEther(18), { value: parseEther(10) });

      await exchange.removeLiquidity(parseEther(100));

      expect(await exchange.getTokenReserve()).to.equal(parseEther(0));
      expect(await getBalance(exchange.address)).to.equal(parseEther(0));
      expect(formatEther(await token.balanceOf(user.address))).to.equal(
        "18.01637852593266606"
      );

      const userEtherBalanceAfter = await getBalance(owner.address);
      const userTokenBalanceAfter = await token.balanceOf(owner.address);

      expect(
        formatEther(userEtherBalanceAfter.sub(userEtherBalanceBefore))
      ).to.equal("109.999925544870311096"); // 110 - gas fees

      expect(
        formatEther(userTokenBalanceAfter.sub(userTokenBalanceBefore))
      ).to.equal("181.98362147406733394");
    });

    it("burns LP-tokens", async () => {
      await expect(
        exchange.removeLiquidity(parseEther(25))
      ).to.changeTokenBalance(exchange, owner, parseEther(-25));

      expect(await exchange.totalSupply()).to.equal(parseEther(75));
    });

    it("doesn't allow invalid amount", async () => {
      await expect(
        exchange.removeLiquidity(parseEther(100.1))
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });
  });
});
