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

const createExchangeV2 = async (factory, tokenAddress, sender) => {
  const exchangeV2Address = await factory
    .connect(sender)
    .callStatic.createExchangeV2(tokenAddress);

  await factory.connect(sender).createExchangeV2(tokenAddress);

  const ExchangeV2 = await ethers.getContractFactory("ExchangeV2");

  return await ExchangeV2.attach(exchangeV2Address);
};

describe("ExchangeV2", function () {
  let dai;
  let token;
  let exchangeV2;
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

    const Token = await ethers.getContractFactory("Ruble");
    token = await Token.deploy("Ruble", "RUB", parseEther(1000000), {
      value: 0,
    });

    dai = await Token.deploy("USD-eDAI", "eDAI", parseEther(1000000), {
      value: 0,
    });

    const ExchangeV2 = await ethers.getContractFactory("ExchangeV2");
    exchangeV2 = await ExchangeV2.deploy(dai.address, token.address, {
      value: 0,
    });

    return {
      token,
      dai,
      exchangeV2,
      owner,
      user,
    };
  }

  describe("Deployment", function () {
    it("is deployed", async () => {
      await loadFixture(deployAll);

      expect(await exchangeV2.deployed()).to.equal(exchangeV2);
      expect(await exchangeV2.name()).to.equal("Dex-LP-V2");
      expect(await exchangeV2.symbol()).to.equal("DLP-V2");
      expect(await exchangeV2.totalSupply()).to.equal(parseEther(0));
      expect(await exchangeV2.factoryAddress()).to.equal(owner.address);
    });
  });

  describe("addLiquidity", async () => {
    describe("empty reserves", async () => {
      beforeEach(async () => {
        await loadFixture(deployAll);
      });

      it("adds liquidity", async () => {
        await dai.approve(exchangeV2.address, parseEther(200));
        await token.approve(exchangeV2.address, parseEther(200));
        await exchangeV2.addLiquidity(parseEther(200), parseEther(200));

        expect(await exchangeV2.getToken1Reserve()).to.equal(parseEther(200));
        expect(await exchangeV2.getToken2Reserve()).to.equal(parseEther(200));
      });

      it("mints LP tokens", async () => {
        await dai.approve(exchangeV2.address, parseEther(200));
        await token.approve(exchangeV2.address, parseEther(200));
        await exchangeV2.addLiquidity(parseEther(100), parseEther(200));

        expect(await exchangeV2.balanceOf(owner.address)).to.eq(
          parseEther(100)
        );
        expect(await exchangeV2.totalSupply()).to.eq(parseEther(100));
      });

      it("allows zero amounts", async () => {
        await dai.approve(exchangeV2.address, parseEther(200));
        await token.approve(exchangeV2.address, 0);
        await exchangeV2.addLiquidity(0, 0);

        expect(await exchangeV2.getToken1Reserve()).to.equal(0);
        expect(await exchangeV2.getToken2Reserve()).to.equal(0);
      });
    });

    describe("existing reserves", async () => {
      beforeEach(async () => {
        await loadFixture(deployAll);

        await dai.approve(exchangeV2.address, parseEther(200));
        await token.approve(exchangeV2.address, parseEther(300));
        await exchangeV2.addLiquidity(parseEther(100), parseEther(200));
      });

      it("preserves exchangeV2 rate", async () => {
        await exchangeV2.addLiquidity(parseEther(50), parseEther(200));

        expect(await exchangeV2.getToken1Reserve()).to.equal(parseEther(150));
        expect(await exchangeV2.getToken2Reserve()).to.equal(parseEther(300));
      });

      it("mints LP tokens", async () => {
        await exchangeV2.addLiquidity(parseEther(50), parseEther(200));

        expect(await exchangeV2.getToken1Reserve()).to.equal(parseEther(150));
        expect(await exchangeV2.totalSupply()).to.eq(parseEther(150));
      });

      it("fails when not enough tokens", async () => {
        await expect(
          exchangeV2.addLiquidity(parseEther(50), parseEther(50))
        ).to.be.revertedWith("insufficient token amount");
      });
    });
  });
});
