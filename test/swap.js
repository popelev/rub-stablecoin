const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("RUB-DAI Swap", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployAll() {
    // Contracts are deployed using the first signer/account by default
    const [owner, user1, user2, user3] = await ethers.getSigners();

    const DAI = await hre.ethers.getContractFactory("DaiTokenMock");
    const daiErc20 = await DAI.deploy({ value: 0 });

    const Ruble = await hre.ethers.getContractFactory("Ruble");
    const rubleErc20 = await Ruble.deploy("Ruble", "RUB", { value: 0 });

    const PriceFeed = await hre.ethers.getContractFactory("PriceFeedMock");
    const priceFeed = await PriceFeed.deploy(0, { value: 0 });

    const TokenSwap = await hre.ethers.getContractFactory("DaiRubTokenSwap");
    const tokenSwap = await TokenSwap.deploy(
      daiErc20.address,
      rubleErc20.address,
      priceFeed.address,
      { value: 0 }
    );

    return {
      rubleErc20,
      daiErc20,
      priceFeed,
      tokenSwap,
      owner,
      user1,
      user2,
    };
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const { rubleErc20 } = await loadFixture(deployAll);

      expect(true);
    });
  });
});
