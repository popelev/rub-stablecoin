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

const createExchangeV1 = async (factory, tokenAddress, sender) => {
  const exchangeV1Address = await factory
    .connect(sender)
    .callStatic.createExchangeV1(tokenAddress);

  await factory.connect(sender).createExchangeV1(tokenAddress);

  const ExchangeV1 = await ethers.getContractFactory("ExchangeV1");

  return await ExchangeV1.attach(exchangeV1Address);
};

xdescribe("ExchangeV1", function () {
  let token;
  let exchangeV1;
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

    const ExchangeV1 = await ethers.getContractFactory("ExchangeV1");
    exchangeV1 = await ExchangeV1.deploy(token.address, { value: 0 });

    return {
      token,
      exchangeV1,
      owner,
      user,
    };
  }

  describe("Deployment", function () {
    it("is deployed", async () => {
      await loadFixture(deployAll);

      expect(await exchangeV1.deployed()).to.equal(exchangeV1);
      expect(await exchangeV1.name()).to.equal("Dex-LP-V1");
      expect(await exchangeV1.symbol()).to.equal("DLP-V1");
      expect(await exchangeV1.totalSupply()).to.equal(parseEther(0));
      expect(await exchangeV1.factoryAddress()).to.equal(owner.address);
    });
  });

  describe("addLiquidity", async () => {
    describe("empty reserves", async () => {
      beforeEach(async () => {
        await loadFixture(deployAll);
      });

      it("adds liquidity", async () => {
        await token.approve(exchangeV1.address, parseEther(200));
        await exchangeV1.addLiquidity(parseEther(200), {
          value: parseEther(100),
        });

        expect(await getBalance(exchangeV1.address)).to.equal(parseEther(100));
        expect(await exchangeV1.getTokenReserve()).to.equal(parseEther(200));
      });

      it("mints LP tokens", async () => {
        await token.approve(exchangeV1.address, parseEther(200));
        await exchangeV1.addLiquidity(parseEther(200), {
          value: parseEther(100),
        });

        expect(await exchangeV1.balanceOf(owner.address)).to.eq(
          parseEther(100)
        );
        expect(await exchangeV1.totalSupply()).to.eq(parseEther(100));
      });

      it("allows zero amounts", async () => {
        await token.approve(exchangeV1.address, 0);
        await exchangeV1.addLiquidity(0, { value: 0 });

        expect(await getBalance(exchangeV1.address)).to.equal(0);
        expect(await exchangeV1.getTokenReserve()).to.equal(0);
      });
    });

    describe("existing reserves", async () => {
      beforeEach(async () => {
        await loadFixture(deployAll);

        await token.approve(exchangeV1.address, parseEther(300));
        await exchangeV1.addLiquidity(parseEther(200), {
          value: parseEther(100),
        });
      });

      it("preserves exchangeV1 rate", async () => {
        await exchangeV1.addLiquidity(parseEther(200), {
          value: parseEther(50),
        });

        expect(await getBalance(exchangeV1.address)).to.equal(parseEther(150));
        expect(await exchangeV1.getTokenReserve()).to.equal(parseEther(300));
      });

      it("mints LP tokens", async () => {
        await exchangeV1.addLiquidity(parseEther(200), {
          value: parseEther(50),
        });

        expect(await exchangeV1.balanceOf(owner.address)).to.eq(
          parseEther(150)
        );
        expect(await exchangeV1.totalSupply()).to.eq(parseEther(150));
      });

      it("fails when not enough tokens", async () => {
        await expect(
          exchangeV1.addLiquidity(parseEther(50), { value: parseEther(50) })
        ).to.be.revertedWith("insufficient token amount");
      });
    });
  });

  describe("removeLiquidity", async () => {
    beforeEach(async () => {
      await loadFixture(deployAll);

      await token.approve(exchangeV1.address, parseEther(300));
      await exchangeV1.addLiquidity(parseEther(200), {
        value: parseEther(100),
      });
    });

    it("removes some liquidity", async () => {
      const userEtherBalanceBefore = await getBalance(owner.address);
      const userTokenBalanceBefore = await token.balanceOf(owner.address);

      await exchangeV1.removeLiquidity(parseEther(25));

      expect(await exchangeV1.getTokenReserve()).to.equal(parseEther(150));
      expect(await getBalance(exchangeV1.address)).to.equal(parseEther(75));

      const userEtherBalanceAfter = await getBalance(owner.address);
      const userTokenBalanceAfter = await token.balanceOf(owner.address);

      expect(
        formatEther(userEtherBalanceAfter.sub(userEtherBalanceBefore))
      ).to.equal("24.99990263646793855"); // 25 - gas fees

      expect(
        formatEther(userTokenBalanceAfter.sub(userTokenBalanceBefore))
      ).to.equal("50.0");
    });

    it("removes all liquidity", async () => {
      const userEtherBalanceBefore = await getBalance(owner.address);
      const userTokenBalanceBefore = await token.balanceOf(owner.address);

      await exchangeV1.removeLiquidity(parseEther(100));

      expect(await exchangeV1.getTokenReserve()).to.equal(parseEther(0));
      expect(await getBalance(exchangeV1.address)).to.equal(parseEther(0));

      const userEtherBalanceAfter = await getBalance(owner.address);
      const userTokenBalanceAfter = await token.balanceOf(owner.address);

      expect(
        formatEther(userEtherBalanceAfter.sub(userEtherBalanceBefore))
      ).to.equal("99.99992210917435084"); // 100 - gas fees

      expect(
        formatEther(userTokenBalanceAfter.sub(userTokenBalanceBefore))
      ).to.equal("200.0");
    });

    it("pays for provided liquidity", async () => {
      const userEtherBalanceBefore = await getBalance(owner.address);
      const userTokenBalanceBefore = await token.balanceOf(owner.address);

      await exchangeV1
        .connect(user)
        .ethToTokenSwap(parseEther(18), { value: parseEther(10) });

      await exchangeV1.removeLiquidity(parseEther(100));

      expect(await exchangeV1.getTokenReserve()).to.equal(parseEther(0));
      expect(await getBalance(exchangeV1.address)).to.equal(parseEther(0));
      expect(formatEther(await token.balanceOf(user.address))).to.equal(
        "18.01637852593266606"
      );

      const userEtherBalanceAfter = await getBalance(owner.address);
      const userTokenBalanceAfter = await token.balanceOf(owner.address);

      expect(
        formatEther(userEtherBalanceAfter.sub(userEtherBalanceBefore))
      ).to.equal("109.999925482196987192"); // 110 - gas fees

      expect(
        formatEther(userTokenBalanceAfter.sub(userTokenBalanceBefore))
      ).to.equal("181.98362147406733394");
    });

    it("burns LP-tokens", async () => {
      await expect(() =>
        exchangeV1.removeLiquidity(parseEther(25))
      ).to.changeTokenBalance(exchangeV1, owner, parseEther(-25));

      expect(await exchangeV1.totalSupply()).to.equal(parseEther(75));
    });

    it("doesn't allow invalid amount", async () => {
      await expect(
        exchangeV1.removeLiquidity(parseEther(100.1))
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });
  });

  describe("getTokenAmount", async () => {
    it("returns correct token amount", async () => {
      await loadFixture(deployAll);

      await token.approve(exchangeV1.address, parseEther(2000));
      await exchangeV1.addLiquidity(parseEther(2000), {
        value: parseEther(1000),
      });

      let tokensOut = await exchangeV1.getTokenAmount(parseEther(1));
      expect(formatEther(tokensOut)).to.equal("1.978041738678708079");

      tokensOut = await exchangeV1.getTokenAmount(parseEther(100));
      expect(formatEther(tokensOut)).to.equal("180.1637852593266606");

      tokensOut = await exchangeV1.getTokenAmount(parseEther(1000));
      expect(formatEther(tokensOut)).to.equal("994.974874371859296482");
    });
  });

  describe("getEthAmount", async () => {
    it("returns correct ether amount", async () => {
      await loadFixture(deployAll);

      await token.approve(exchangeV1.address, parseEther(2000));
      await exchangeV1.addLiquidity(parseEther(2000), {
        value: parseEther(1000),
      });

      let ethOut = await exchangeV1.getEthAmount(parseEther(2));
      expect(formatEther(ethOut)).to.equal("0.989020869339354039");

      ethOut = await exchangeV1.getEthAmount(parseEther(100));
      expect(formatEther(ethOut)).to.equal("47.16531681753215817");

      ethOut = await exchangeV1.getEthAmount(parseEther(2000));
      expect(formatEther(ethOut)).to.equal("497.487437185929648241");
    });
  });

  describe("ethToTokenTransfer", async () => {
    beforeEach(async () => {
      await loadFixture(deployAll);

      await token.approve(exchangeV1.address, parseEther(2000));
      await exchangeV1.addLiquidity(parseEther(2000), {
        value: parseEther(1000),
      });
    });

    it("transfers at least min amount of tokens to recipient", async () => {
      const userBalanceBefore = await getBalance(user.address);

      await exchangeV1
        .connect(user)
        .ethToTokenTransfer(parseEther(1.97), user.address, {
          value: parseEther(1),
        });

      const userBalanceAfter = await getBalance(user.address);
      expect(formatEther(userBalanceAfter.sub(userBalanceBefore))).to.equal(
        "-1.000094698503778816"
      );

      const userTokenBalance = await token.balanceOf(user.address);
      expect(formatEther(userTokenBalance)).to.equal("1.978041738678708079");

      const exchangeV1EthBalance = await getBalance(exchangeV1.address);
      expect(formatEther(exchangeV1EthBalance)).to.equal("1001.0");

      const exchangeV1TokenBalance = await token.balanceOf(exchangeV1.address);
      expect(formatEther(exchangeV1TokenBalance)).to.equal(
        "1998.021958261321291921"
      );
    });
  });

  describe("ethToTokenSwap", async () => {
    beforeEach(async () => {
      await loadFixture(deployAll);

      await token.approve(exchangeV1.address, parseEther(2000));
      await exchangeV1.addLiquidity(parseEther(2000), {
        value: parseEther(1000),
      });
    });

    it("transfers at least min amount of tokens", async () => {
      const userBalanceBefore = await getBalance(user.address);

      await exchangeV1
        .connect(user)
        .ethToTokenSwap(parseEther(1.97), { value: parseEther(1) });

      const userBalanceAfter = await getBalance(user.address);
      expect(formatEther(userBalanceAfter.sub(userBalanceBefore))).to.equal(
        "-1.000093925680081408"
      );

      const userTokenBalance = await token.balanceOf(user.address);
      expect(formatEther(userTokenBalance)).to.equal("1.978041738678708079");

      const exchangeV1EthBalance = await getBalance(exchangeV1.address);
      expect(formatEther(exchangeV1EthBalance)).to.equal("1001.0");

      const exchangeV1TokenBalance = await token.balanceOf(exchangeV1.address);
      expect(formatEther(exchangeV1TokenBalance)).to.equal(
        "1998.021958261321291921"
      );
    });

    it("affects exchangeV1 rate", async () => {
      let tokensOut = await exchangeV1.getTokenAmount(parseEther(10));
      expect(formatEther(tokensOut)).to.equal("19.605901574413308248");

      await exchangeV1
        .connect(user)
        .ethToTokenSwap(parseEther(9), { value: parseEther(10) });

      tokensOut = await exchangeV1.getTokenAmount(parseEther(10));
      expect(formatEther(tokensOut)).to.equal("19.223356774598792281");
    });

    it("fails when output amount is less than min amount", async () => {
      await expect(
        exchangeV1
          .connect(user)
          .ethToTokenSwap(parseEther(2), { value: parseEther(1) })
      ).to.be.revertedWith("insufficient output amount");
    });

    it("allows zero swaps", async () => {
      await exchangeV1
        .connect(user)
        .ethToTokenSwap(parseEther(0), { value: parseEther(0) });

      const userTokenBalance = await token.balanceOf(user.address);
      expect(formatEther(userTokenBalance)).to.equal("0.0");

      const exchangeV1EthBalance = await getBalance(exchangeV1.address);
      expect(formatEther(exchangeV1EthBalance)).to.equal("1000.0");

      const exchangeV1TokenBalance = await token.balanceOf(exchangeV1.address);
      expect(formatEther(exchangeV1TokenBalance)).to.equal("2000.0");
    });
  });

  describe("tokenToEthSwap", async () => {
    beforeEach(async () => {
      await loadFixture(deployAll);

      await token.transfer(user.address, parseEther(22));
      await token.connect(user).approve(exchangeV1.address, parseEther(22));

      await token.approve(exchangeV1.address, parseEther(2000));
      await exchangeV1.addLiquidity(parseEther(2000), {
        value: parseEther(1000),
      });
    });

    it("transfers at least min amount of tokens", async () => {
      const userBalanceBefore = await getBalance(user.address);
      const exchangeV1BalanceBefore = await getBalance(exchangeV1.address);

      await exchangeV1
        .connect(user)
        .tokenToEthSwap(parseEther(2), parseEther(0.9));

      const userBalanceAfter = await getBalance(user.address);
      expect(formatEther(userBalanceAfter.sub(userBalanceBefore))).to.equal(
        "0.988937600618373419"
      );

      const userTokenBalance = await token.balanceOf(user.address);
      expect(formatEther(userTokenBalance)).to.equal("20.0");

      const exchangeV1BalanceAfter = await getBalance(exchangeV1.address);
      expect(
        formatEther(exchangeV1BalanceAfter.sub(exchangeV1BalanceBefore))
      ).to.equal("-0.989020869339354039");

      const exchangeV1TokenBalance = await token.balanceOf(exchangeV1.address);
      expect(formatEther(exchangeV1TokenBalance)).to.equal("2002.0");
    });

    it("affects exchangeV1 rate", async () => {
      let ethOut = await exchangeV1.getEthAmount(parseEther(20));
      expect(formatEther(ethOut)).to.equal("9.802950787206654124");

      await exchangeV1
        .connect(user)
        .tokenToEthSwap(parseEther(20), parseEther(9));

      ethOut = await exchangeV1.getEthAmount(parseEther(20));
      expect(formatEther(ethOut)).to.equal("9.61167838729939614");
    });

    it("fails when output amount is less than min amount", async () => {
      await expect(
        exchangeV1.connect(user).tokenToEthSwap(parseEther(2), parseEther(1.0))
      ).to.be.revertedWith("insufficient output amount");
    });

    it("allows zero swaps", async () => {
      const userBalanceBefore = await getBalance(user.address);
      await exchangeV1
        .connect(user)
        .tokenToEthSwap(parseEther(0), parseEther(0));

      const userBalanceAfter = await getBalance(user.address);
      expect(formatEther(userBalanceAfter.sub(userBalanceBefore))).to.equal(
        "-0.00006179365190996"
      );

      const userTokenBalance = await token.balanceOf(user.address);
      expect(formatEther(userTokenBalance)).to.equal("22.0");

      const exchangeV1EthBalance = await getBalance(exchangeV1.address);
      expect(formatEther(exchangeV1EthBalance)).to.equal("1000.0");

      const exchangeV1TokenBalance = await token.balanceOf(exchangeV1.address);
      expect(formatEther(exchangeV1TokenBalance)).to.equal("2000.0");
    });
  });

  describe("tokenToTokenSwap", async () => {
    it("swaps token for token", async () => {
      const Factory = await ethers.getContractFactory("Factory");
      const Token = await ethers.getContractFactory("Ruble");

      const factory = await Factory.deploy();
      const token1 = await Token.deploy("TokenA", "AAA", parseEther(1000000));
      const token2 = await Token.connect(user).deploy(
        "TokenB",
        "BBBB",
        parseEther(1000000)
      );

      await factory.deployed();
      await token1.deployed();
      await token2.deployed();

      const exchangeV1 = await createExchangeV1(factory, token1.address, owner);
      const exchangeV12 = await createExchangeV1(factory, token2.address, user);

      await token1.approve(exchangeV1.address, parseEther(2000));
      await exchangeV1.addLiquidity(parseEther(2000), {
        value: parseEther(1000),
      });

      await token2.connect(user).approve(exchangeV12.address, parseEther(1000));
      await exchangeV12
        .connect(user)
        .addLiquidity(parseEther(1000), { value: parseEther(1000) });

      expect(await token2.balanceOf(owner.address)).to.equal(0);

      await token1.approve(exchangeV1.address, parseEther(10));
      await exchangeV1.tokenToTokenSwap(
        parseEther(10),
        parseEther(4.8),
        token2.address
      );

      expect(formatEther(await token2.balanceOf(owner.address))).to.equal(
        "4.852698493489877956"
      );

      expect(await token1.balanceOf(user.address)).to.equal(0);

      await token2.connect(user).approve(exchangeV12.address, parseEther(10));
      await exchangeV12
        .connect(user)
        .tokenToTokenSwap(parseEther(10), parseEther(19.6), token1.address);

      expect(formatEther(await token1.balanceOf(user.address))).to.equal(
        "19.602080509528011079"
      );
    });
  });
});
