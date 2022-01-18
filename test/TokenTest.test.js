const { ethers } = require("hardhat");
const { expect } = require("chai");
const { skipTime } = require("./utils");

const ONE_MONTH = 2592000; // seconds
const FEE       = "3000000000000000000";
const IDO_FEE   = "2000000000000000000";

describe("ido", () => {
  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    admin = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
    user3 = accounts[3];
    user4 = accounts[4];
    user5 = accounts[5];

    const IDO = await ethers.getContractFactory("IDO");
    ido = await IDO.deploy("IDO_TOKEN", "TTK");
  });

  describe("Mint", () => {
    it("Caller is not owner", async () => {
      expect(await ido.owner()).equal(admin.address, "address is not owner");
      await expect(ido.connect(user1).setWhiteList([user1.address, user2.address, user3.address])).to.revertedWith("caller is not the owner");
      await expect(ido.connect(user2).setWhiteList([user1.address, user2.address, user3.address])).to.revertedWith("caller is not the owner");
      await ido.setWhiteList([user1.address, user2.address, user3.address]);
      await expect(ido.connect(user1).setIdoTime(ONE_MONTH)).to.revertedWith("caller is not the owner");
      await expect(ido.connect(user2).setIdoTime(ONE_MONTH)).to.revertedWith("caller is not the owner");
      await ido.setIdoTime(ONE_MONTH);
      await expect(ido.connect(user1).removeOutOfWhitelist([user2.address, user3.address])).to.revertedWith("caller is not the owner");
      await expect(ido.connect(user2).removeOutOfWhitelist([user2.address, user3.address])).to.revertedWith("caller is not the owner");
      await ido.removeOutOfWhitelist([user2.address, user3.address]);
    })

    it("Mint token when not enough value", async () => {
      await expect(ido.connect(user1).mintToken()).to.revertedWith("not enough value");
      await expect(ido.connect(user2).mintToken()).to.revertedWith("not enough value");
      await expect(ido.connect(user1).mintToken({ value: IDO_FEE })).to.revertedWith("not enough value");
      await expect(ido.connect(user2).mintToken({ value: IDO_FEE })).to.revertedWith("not enough value");
      await ido.setWhiteList([user1.address, user2.address]);
      await ido.setIdoTime(ONE_MONTH);
      await expect(ido.connect(user1).mintToken()).to.revertedWith("not enough value");
      await expect(ido.connect(user2).mintToken()).to.revertedWith("not enough value");
      await expect(ido.connect(user1).mintToken({ value: "100000" })).to.revertedWith("not enough value");
      await expect(ido.connect(user2).mintToken({ value: "100000" })).to.revertedWith("not enough value");
    });

    it("Mint token success", async () => {
      expect((await ido.balanceOf(user1.address)).toString()).equal("0");
      expect((await ido.balanceOf(user2.address)).toString()).equal("0");
      await ido.connect(user1).mintToken({ value: FEE });
      await ido.connect(user2).mintToken({ value: FEE });
      expect((await ido.balanceOf(user1.address)).toString()).equal("1");
      expect((await ido.balanceOf(user2.address)).toString()).equal("1");
    })

    describe("Mint token in IDO time", () => {
      beforeEach(async () => {
        await ido.setIdoTime(ONE_MONTH);
      })

      it("Only mint by whiteList", async () => {
        expect((await ido.balanceOf(user1.address)).toString()).equal("0");
        expect((await ido.balanceOf(user2.address)).toString()).equal("0");
        await expect(ido.connect(user1).mintToken({value: IDO_FEE})).to.revertedWith("address not in whiteList");
        await expect(ido.connect(user2).mintToken({value: IDO_FEE})).to.revertedWith("address not in whiteList");
        await expect(ido.connect(user3).mintToken({value: IDO_FEE})).to.revertedWith("address not in whiteList");
        await ido.setWhiteList([user1.address, user2.address]);
        await ido.connect(user1).mintToken({value: IDO_FEE});
        await ido.connect(user2).mintToken({value: IDO_FEE});
        expect((await ido.balanceOf(user1.address)).toString()).equal("1");
        expect((await ido.balanceOf(user2.address)).toString()).equal("1");
      })

      it("Allow mint when IDO expire", async () => {
        expect((await ido.balanceOf(user1.address)).toString()).equal("0");
        expect((await ido.balanceOf(user2.address)).toString()).equal("0");
        expect((await ido.balanceOf(user3.address)).toString()).equal("0");
        await expect(ido.connect(user1).mintToken({value: IDO_FEE})).to.revertedWith("address not in whiteList");
        await expect(ido.connect(user2).mintToken({value: IDO_FEE})).to.revertedWith("address not in whiteList");
        await expect(ido.connect(user3).mintToken({value: IDO_FEE})).to.revertedWith("address not in whiteList");
        skipTime(ONE_MONTH);
        await expect(ido.connect(user1).mintToken({value: IDO_FEE})).to.revertedWith("not enough value");
        await ido.connect(user1).mintToken({value: FEE});
        await expect(ido.connect(user2).mintToken({value: IDO_FEE})).to.revertedWith("not enough value");
        await ido.connect(user2).mintToken({value: FEE});
        await expect(ido.connect(user3).mintToken({value: IDO_FEE})).to.revertedWith("not enough value");
        await ido.connect(user3).mintToken({value: FEE});
        expect((await ido.balanceOf(user1.address)).toString()).equal("1");
        expect((await ido.balanceOf(user2.address)).toString()).equal("1");
        expect((await ido.balanceOf(user3.address)).toString()).equal("1");
      })

      it("Remove out of whitelist", async () => {
        expect((await ido.balanceOf(user1.address)).toString()).equal("0");
        expect((await ido.balanceOf(user2.address)).toString()).equal("0");
        expect((await ido.balanceOf(user3.address)).toString()).equal("0");
        expect((await ido.balanceOf(user4.address)).toString()).equal("0");
        await expect(ido.connect(user1).mintToken({value: IDO_FEE})).to.revertedWith("address not in whiteList");
        await expect(ido.connect(user2).mintToken({value: IDO_FEE})).to.revertedWith("address not in whiteList");
        await expect(ido.connect(user3).mintToken({value: IDO_FEE})).to.revertedWith("address not in whiteList");
        await expect(ido.connect(user4).mintToken({value: IDO_FEE})).to.revertedWith("address not in whiteList");
        await ido.setWhiteList([user1.address, user2.address, user3.address, user4.address]);
        await ido.connect(user1).mintToken({value: IDO_FEE});
        await ido.connect(user2).mintToken({value: IDO_FEE});
        await ido.connect(user3).mintToken({value: IDO_FEE});
        await ido.connect(user4).mintToken({value: IDO_FEE});
        expect((await ido.balanceOf(user1.address)).toString()).equal("1");
        expect((await ido.balanceOf(user2.address)).toString()).equal("1");
        expect((await ido.balanceOf(user3.address)).toString()).equal("1");
        expect((await ido.balanceOf(user4.address)).toString()).equal("1");

        await ido.removeOutOfWhitelist([user3.address, user4.address]);
        await ido.connect(user1).mintToken({value: IDO_FEE});
        await ido.connect(user2).mintToken({value: IDO_FEE});
        await expect (ido.connect(user3).mintToken({value: IDO_FEE})).to.revertedWith("address not in whiteList");
        await expect (ido.connect(user4).mintToken({value: IDO_FEE})).to.revertedWith("address not in whiteList");
        expect((await ido.balanceOf(user1.address)).toString()).equal("2");
        expect((await ido.balanceOf(user2.address)).toString()).equal("2");
        expect((await ido.balanceOf(user3.address)).toString()).equal("1");
        expect((await ido.balanceOf(user4.address)).toString()).equal("1");
      })
    })
  });
});
