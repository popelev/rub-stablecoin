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
      expect(await exchange.getReserve()).to.deep.equal(parseEther(200));
    });

    it("allows zero amounts", async () => {
      await loadFixture(deployAll);
      await token.approve(exchange.address, 0);
      await exchange.addLiquidity(0, { value: 0 });
      let balance = await getBalance(exchange.address);
      expect(balance.toNumber()).to.equal(0);
      let reserve = await exchange.getReserve();
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
      expect(formatEther(tokensOut)).to.equal("1.998001998001998001");

      tokensOut = await exchange.getTokenAmount(parseEther(100));
      expect(formatEther(tokensOut)).to.equal("181.818181818181818181");

      tokensOut = await exchange.getTokenAmount(parseEther(1000));
      expect(formatEther(tokensOut)).to.equal("1000.0");
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
      expect(formatEther(ethOut)).to.deep.equal("0.999000999000999");

      ethOut = await exchange.getEthAmount(parseEther(100));
      expect(formatEther(ethOut)).to.deep.equal("47.619047619047619047");

      ethOut = await exchange.getEthAmount(parseEther(2000));
      expect(formatEther(ethOut)).to.deep.equal("500.0");
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
        .ethToTokenSwap(parseEther(1.99), { value: parseEther(1) });

      const userBalanceAfter = await getBalance(user.address);
      expect(formatEther(userBalanceAfter - userBalanceBefore)).to.deep.equal(
        "-1.0000924032683213"
      );

      const userTokenBalance = await token.balanceOf(user.address);
      expect(formatEther(userTokenBalance)).to.deep.equal(
        "1.998001998001998001"
      );

      const exchangeEthBalance = await getBalance(exchange.address);
      expect(formatEther(exchangeEthBalance)).to.deep.equal("1001.0");

      const exchangeTokenBalance = await token.balanceOf(exchange.address);
      expect(formatEther(exchangeTokenBalance)).to.deep.equal(
        "1998.001998001998001999"
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
      expect(formatEther(userBalanceAfter - userBalanceBefore)).to.deep.equal(
        "0.9989323735380787"
      );

      const userTokenBalance = await token.balanceOf(user.address);
      expect(formatEther(userTokenBalance)).to.deep.equal("0.0");

      const exchangeEthBalance = await getBalance(exchange.address);
      expect(formatEther(exchangeEthBalance)).to.deep.equal(
        "999.000999000999001"
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
      expect(formatEther(userBalance)).to.deep.equal("9999.999864293291209264");

      const userTokenBalance = await token.balanceOf(user.address);
      expect(formatEther(userTokenBalance)).to.deep.equal("2.0");

      const exchangeEthBalance = await getBalance(exchange.address);
      expect(formatEther(exchangeEthBalance)).to.deep.equal("1000.0");

      const exchangeTokenBalance = await token.balanceOf(exchange.address);
      expect(formatEther(exchangeTokenBalance)).to.deep.equal("2000.0");
    });
  });
});
