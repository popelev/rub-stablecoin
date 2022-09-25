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

describe("Factory", function () {
  let owner;
  let factory;
  let token;

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployAll() {
    // Contracts are deployed using the first signer/account by default
    const [Owner] = await ethers.getSigners();
    owner = Owner;

    const Ruble = await ethers.getContractFactory("Ruble");
    token = await Ruble.deploy("Ruble", "RUB", parseEther(1000000), {
      value: 0,
    });

    const Factory = await ethers.getContractFactory("Factory");
    factory = await Factory.deploy({ value: 0 });

    return {
      token,
      factory,
      owner,
    };
  }

  describe("Deployment", function () {
    it("is deployed", async () => {
      await loadFixture(deployAll);

      expect(await factory.deployed()).to.equal(factory);
    });
  });

  describe("createExchange", () => {
    it("deploys an exchange", async () => {
      await loadFixture(deployAll);

      const exchangeAddress = await factory.callStatic.createExchange(
        token.address
      );
      await factory.createExchange(token.address);

      expect(await factory.tokenToExchange(token.address)).to.equal(
        exchangeAddress
      );

      const Exchange = await ethers.getContractFactory("Exchange");
      const exchange = await Exchange.attach(exchangeAddress);
      expect(await exchange.name()).to.equal("Dex-LP-V1");
      expect(await exchange.symbol()).to.equal("DLP-V1");
      expect(await exchange.factoryAddress()).to.equal(factory.address);
    });

    it("doesn't allow zero address", async () => {
      await loadFixture(deployAll);

      await expect(
        factory.createExchange("0x0000000000000000000000000000000000000000")
      ).to.be.revertedWith("invalid token address");
    });

    it("fails when exchange exists", async () => {
      await loadFixture(deployAll);

      await factory.createExchange(token.address);

      await expect(factory.createExchange(token.address)).to.be.revertedWith(
        "exchange already exists"
      );
    });
  });

  describe("getExchange", () => {
    it("returns exchange address by token address", async () => {
      await loadFixture(deployAll);

      const exchangeAddress = await factory.callStatic.createExchange(
        token.address
      );
      await factory.createExchange(token.address);

      expect(await factory.getExchange(token.address)).to.equal(
        exchangeAddress
      );
    });
  });
});
