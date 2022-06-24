import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Signer, Contract } from "ethers";
import * as dotenv from "dotenv";
import { types } from "hardhat/config";
// import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";

let accounts: Signer[];

let acdm_owner: Signer;
let acdm_owner_addr: string;

let staking_owner: Signer;
let staking_owner_addr: string;

let dao_owner: Signer;
let dao_owner_addr: string;

// Users that get XXXTokens and put its in liquidity pair. So they
// can vote in dao.
let user_1: Signer;
let user_addr_1: string;
const xxx_u_1 = ethers.utils.parseEther("10");

let user_2: Signer;
let user_addr_2: string;
const xxx_u_2 = ethers.utils.parseEther("20");

let user_3: Signer;
let user_addr_3: string;
const xxx_u_3 = ethers.utils.parseEther("30");

// Other users of ACDM Platform.
let user_4: Signer;
let user_addr_4: string;

let user_5: Signer;
let user_addr_5: string;

let user_6: Signer;
let user_addr_6: string;

let user_7: Signer;
let user_addr_7: string;

// DAO chair mans
let chair_man_1: Signer;
let chair_man_addr_1: string;

let chair_man_2: Signer;
let chair_man_addr_2: string;

let xxxERC20Contract_address: string;
let uniswapLpContract_address: string;
let dao_address: string;
let myStaking_address: string;
let acdm_address: string;
let acdm_token_address: string;

const days = 24 * 3600;
let snapShot = 0x00;
let acdmDecemals = 1000000;

before(async function () {
  accounts = await ethers.getSigners();

  acdm_owner = accounts[0];
  acdm_owner_addr = await acdm_owner.getAddress();

  staking_owner = accounts[1];
  staking_owner_addr = await staking_owner.getAddress();

  dao_owner = accounts[2];
  dao_owner_addr = await dao_owner.getAddress();

  user_1 = accounts[3];
  user_addr_1 = await user_1.getAddress();

  user_2 = accounts[4];
  user_addr_2 = await user_2.getAddress();

  user_3 = accounts[5];
  user_addr_3 = await user_3.getAddress();

  user_4 = accounts[6];
  user_addr_4 = await user_4.getAddress();

  user_5 = accounts[7];
  user_addr_5 = await user_5.getAddress();

  user_6 = accounts[8];
  user_addr_6 = await user_6.getAddress();

  user_7 = accounts[9];
  user_addr_7 = await user_7.getAddress();

  chair_man_1 = accounts[10];
  chair_man_addr_1 = await chair_man_1.getAddress();

  chair_man_2 = accounts[11];
  chair_man_addr_2 = await chair_man_2.getAddress();
});

describe(
    "Deploy XXXToken contract, mint tokens and get pair liquidity on uniswap",
     function () {

  it("Deploy, mint and approve", async function () {

    const XXXERC20Contract = await ethers
      .getContractFactory("XXXERC20Contract", staking_owner);

    let xxxERC20Contract = await XXXERC20Contract.deploy("XXXToken", "XXX", 18);

    await xxxERC20Contract.deployed();

    xxxERC20Contract_address = xxxERC20Contract.address;

    await xxxERC20Contract.grantRole(await xxxERC20Contract.minter(), staking_owner_addr);

    await xxxERC20Contract.grantRole(await xxxERC20Contract.burner(), staking_owner_addr);

    await xxxERC20Contract.connect(staking_owner).mint(user_addr_1, xxx_u_1);

    await xxxERC20Contract.connect(staking_owner).mint(user_addr_2, xxx_u_2);

    await xxxERC20Contract.connect(staking_owner).mint(user_addr_3, xxx_u_3);

    await xxxERC20Contract.connect(staking_owner).mint(user_addr_7, xxx_u_3);

    await xxxERC20Contract.connect(staking_owner).burn(user_addr_7, xxx_u_3);

    await xxxERC20Contract.connect(user_1)
      .approve(process.env.UNISWAP_CONTRACT!, xxx_u_1);

    await xxxERC20Contract.connect(user_2)
      .approve(process.env.UNISWAP_CONTRACT!, xxx_u_2);

    await xxxERC20Contract.connect(user_3)
      .approve(process.env.UNISWAP_CONTRACT!, xxx_u_3);
  });


  it("Create liquidity pair", async function () {

    const latestBlock = await ethers.provider.getBlock("latest")
    let timestamp = latestBlock.timestamp;

    let factory = await ethers.getContractAt("IUniswapV2Factory",
      process.env.UNISWAP_FACTORY!);

    let uniswap = await ethers.getContractAt("IUniswapV2Router01",
      process.env.UNISWAP_CONTRACT!);

    await uniswap.connect(user_1)
      .addLiquidityETH(
        xxxERC20Contract_address,
        ethers.utils.parseEther("10"),
        0, 0, user_addr_1, timestamp + 900,
        {value: ethers.utils.parseEther("1")}
      );

    // let token0: string;
    // let token1: string;
    // let pair: string;
    // let length=0;

    // const list = await factory.filters.PairCreated(xxxERC20Contract_address);
    // console.log(list.address);
    //
    // //uniswapLpContract_address = list.address;

    await uniswap.connect(user_2)
      .addLiquidityETH(
        xxxERC20Contract_address,
        ethers.utils.parseEther("20"),
        0, 0, user_addr_2, timestamp + 900,
        {value: ethers.utils.parseEther("2")}
      );

    await uniswap.connect(user_3)
      .addLiquidityETH(
        xxxERC20Contract_address,
        ethers.utils.parseEther("30"),
        0, 0, user_addr_3, timestamp + 900,
        {value: ethers.utils.parseEther("3")}
      );

    // let lptokens = await ethers.getContractAt("IERC20",
    //   uniswapLpContract_address);
    // console.log(await lptokens.balanceOf(user_addr_1));
    // console.log(await lptokens.balanceOf(user_addr_2));
    // console.log(await lptokens.balanceOf(user_addr_3));
  });
});

describe("Test Staking contract (DAO will be deployed too)", function () {
  const reward_period_days = 1;
  const lock_period_days = 7;
  const reward_procents = 5;

  const daoMinimumQuorum = ethers.utils.parseEther("10");
  const daoDebatingPeriodDuration = 24;

  let superStaking: Contract;
  let xxxToken: Contract;
  let lpToken: Contract;

  it("Should test reverts of constructor", async function () {
    const SuperStaking = await ethers.getContractFactory("MyStaking", staking_owner);
    await expect(SuperStaking.deploy(
      ethers.constants.AddressZero,
      xxxERC20Contract_address,
      reward_period_days,
      lock_period_days,
      reward_procents,
      chair_man_addr_1,
      daoMinimumQuorum,
      daoDebatingPeriodDuration))
      .to.be.revertedWith("Uniswap contract address can not be zero");
    await expect(SuperStaking.deploy(
      process.env.UNISWAP_LP_CONTRACT!,
      ethers.constants.AddressZero,
      reward_period_days,
      lock_period_days,
      reward_procents,
      chair_man_addr_1,
      daoMinimumQuorum,
      daoDebatingPeriodDuration))
      .to.be.revertedWith("Reward tokens contract address can not be zero");
    await expect(SuperStaking.deploy(
      process.env.UNISWAP_LP_CONTRACT!,
      xxxERC20Contract_address,
      0,
      lock_period_days,
      reward_procents,
      chair_man_addr_1,
      daoMinimumQuorum,
      daoDebatingPeriodDuration))
      .to.be.revertedWith("Reward period can not be zero");
    await expect(SuperStaking.deploy(
      process.env.UNISWAP_LP_CONTRACT!,
      xxxERC20Contract_address,
      reward_period_days,
      lock_period_days,
      reward_procents,
      ethers.constants.AddressZero,
      daoMinimumQuorum,
      daoDebatingPeriodDuration))
      .to.be.revertedWith("Address of chair person can not be zero");
    await expect(SuperStaking.deploy(
      process.env.UNISWAP_LP_CONTRACT!,
      xxxERC20Contract_address,
      reward_period_days,
      lock_period_days,
      reward_procents,
      chair_man_addr_1,
      daoMinimumQuorum,
      0))
      .to.be.revertedWith("Debating period can not be zero");
  });

  it("Should deploy SuperStaking contract and connect to lp token contract",
      async function () {
    const SuperStaking = await ethers.getContractFactory("MyStaking", staking_owner);
    superStaking = await SuperStaking.deploy(
      process.env.UNISWAP_LP_CONTRACT!,
      xxxERC20Contract_address,
      reward_period_days,
      lock_period_days,
      reward_procents,
      chair_man_addr_1,
      daoMinimumQuorum,
      daoDebatingPeriodDuration);
    await superStaking.deployed();
    lpToken = await ethers.getContractAt("IERC20", process.env.UNISWAP_LP_CONTRACT!);
    xxxToken = await ethers.getContractAt("IMyERC20Contract", xxxERC20Contract_address);
    xxxToken.connect(staking_owner).mint(superStaking.address, ethers.utils.parseEther("100"));
    dao_address = await superStaking.daoContractAddress();
    myStaking_address = superStaking.address;
  });

  it("Should make 1st stake by user_1 with event", async function () {
    const balance = await lpToken.balanceOf(user_addr_1);
    await lpToken.connect(user_1).approve(superStaking.address, balance);
    await expect(superStaking.connect(user_1)
    .stake(balance.div(2))).to.emit(superStaking, "StakeDone")
    .withArgs(user_addr_1, balance.div(2));
  });

  it("Should revert stake because staking locked yet", async function () {
    await lpToken.connect(user_1).approve(
      superStaking.address,
      ethers.BigNumber.from('5000000000'));
    await expect(superStaking.connect(user_1)
    .stake(ethers.BigNumber.from('5000000000')))
    .to.be.revertedWith("You cannot stake in lock period");
  });

  it("Should revert unstake because its too early now", async function () {
    await expect(superStaking.connect(user_1)
    .unstake(ethers.BigNumber.from('5000000000')))
    .to.be.revertedWith("Amount of tokens exceeds available amount");
  });

  it("Should make second stake after 7 days with event", async function () {
    await ethers.provider.send('evm_increaseTime', [7 * days]);
    await ethers.provider.send('evm_mine', []);
    const balance = await lpToken.balanceOf(user_addr_1);
    await lpToken.connect(user_1).approve(superStaking.address, balance);
    await expect(superStaking.connect(user_1)
    .stake(balance)).to.emit(superStaking, "StakeDone")
    .withArgs(user_addr_1, balance);
  });

  it("Should claim right away and get revert", async function () {
    await expect(superStaking.connect(user_1).claim())
    .to.be.revertedWith("Nothing to claim now");
  });

  it("Should claim with event after 2 days", async function () {
    await ethers.provider.send('evm_increaseTime', [2 * days + 1]);
    await ethers.provider.send('evm_mine', []);

    const stake = await superStaking.stakes(user_addr_1);

    const balance = stake["amount"];

    const expectedReward = balance.div(10); //2 * 5 / 100

    await expect(superStaking.connect(user_1).claim())
    .to.emit(superStaking, "Claim")
    .withArgs(user_addr_1, expectedReward);
  });

  it("Should revert unstake because too many tokens is requested", async function () {
    const balance = (await superStaking.stakes(user_addr_1))["amount"];

    await expect(superStaking.connect(user_1).unstake(ethers.BigNumber.from('60000000')))
    .to.emit(superStaking, "Unstake")
    .withArgs(user_addr_1, ethers.BigNumber.from('60000000'));

    await ethers.provider.send('evm_increaseTime', [5 * days + 1]);
    await ethers.provider.send('evm_mine', []);

    await expect(superStaking.connect(user_1)
    .unstake(balance.add(1)))
    .to.be.revertedWith("Amount of tokens exceeds staked amount");
  });

  it("Should partly unstake with event and then revert state", async function () {

    snapShot = await network.provider.send("evm_snapshot");

    await expect(superStaking.connect(user_1).unstake(ethers.BigNumber.from('6000000000')))
    .to.emit(superStaking, "Unstake")
    .withArgs(user_addr_1, ethers.BigNumber.from('6000000000'));

    await expect(superStaking.connect(user_1).unstake(ethers.BigNumber.from('600000000')))
    .to.emit(superStaking, "Unstake")
    .withArgs(user_addr_1, ethers.BigNumber.from('600000000'));

    await network.provider.send("evm_revert", [snapShot]);
  });

  it("Should make stake by user_2 and user_3 with event", async function () {
    const balance_2 = await lpToken.balanceOf(user_addr_2);
    await lpToken.connect(user_2).approve(superStaking.address, balance_2);
    await expect(superStaking.connect(user_2)
    .stake(balance_2)).to.emit(superStaking, "StakeDone")
    .withArgs(user_addr_2, balance_2);
    const balance_3 = await lpToken.balanceOf(user_addr_3);
    await lpToken.connect(user_3).approve(superStaking.address, balance_3);
    await expect(superStaking.connect(user_3)
    .stake(balance_3)).to.emit(superStaking, "StakeDone")
    .withArgs(user_addr_3, balance_3);
  });
});

describe("ACDMPlatform", function () {

  let acdm: Contract;
  let acdmToken: Contract;
  let roundId = 0;

  it("Test reverts of deploying ACDMPlatform ", async function () {

    const ACDMPlatform = await ethers.getContractFactory("ACDMPlatform", staking_owner);

    await expect(ACDMPlatform.deploy(
      ethers.constants.AddressZero,
      xxxERC20Contract_address,
      process.env.UNISWAP_FACTORY!))
      .to.be.revertedWith("DAO contract address can not be zero");

    await expect(ACDMPlatform.deploy(
      dao_address,
      ethers.constants.AddressZero,
      process.env.UNISWAP_FACTORY!))
      .to.be.revertedWith("XXX tokens contract address can not be zero");

    await expect(ACDMPlatform.deploy(
      dao_address,
      xxxERC20Contract_address,
      ethers.constants.AddressZero))
      .to.be.revertedWith("Uniswap contract address can not be zero");
  });

  it("Should deploy ACDMPlatform", async function () {

    const ACDMPlatform = await ethers.getContractFactory(
      "ACDMPlatform", acdm_owner);

    acdm = await ACDMPlatform.deploy(
      dao_address,
      xxxERC20Contract_address,
      process.env.UNISWAP_CONTRACT!);

    await acdm.deployed();
    acdm_address = acdm.address;
    acdm_token_address = acdm.acdmTokenAddress();
  });

  it("Should initiate sale on platform with event and check emission",
    async function () {

    await expect(acdm.initSale()).to.emit(acdm, "SaleStarted")
    .withArgs(roundId);

    const acdmTokenAddress = await acdm.acdmTokenAddress();

    acdmToken = await ethers.getContractAt("IERC20", acdmTokenAddress);

    expect(await acdmToken.balanceOf(acdm.address))
    .to.be.equal(ethers.BigNumber.from('100000000000'));
  });

  it("Any other calls of initiating should be reverted", async function () {
    await expect(acdm.initSale())
    .to.be.revertedWith("Sales initiated already");
  });

  it("Both startSale and startTrade calls should be reverted if called right now",
      async function () {

    await expect(acdm.startSale())
    .to.be.revertedWith("The sale/trade round has already started");

    await expect(acdm.startTrade())
    .to.be.revertedWith("Saling round is not over");
  });

  describe("Test signing", function () {
    it("Signing on platform without refers and revert resignings in both ways",
      async function () {

      await expect(acdm.connect(user_1)["signOn()"]())
      .to.emit(acdm, "SignOn")
      .withArgs(user_addr_1, ethers.constants.AddressZero);

      await expect(acdm.connect(user_1)["signOn()"]())
      .to.be.revertedWith("You already signed");

      await expect(acdm.connect(user_1)["signOn(address)"](user_addr_1))
      .to.be.revertedWith("You already signed");
    });

    it("Should revert signing when signer and refer is one person", async function () {

      await expect(acdm.connect(user_2)["signOn(address)"](user_addr_2))
      .to.be.revertedWith("Invalid refer address");
    });

    it("Signing on platform with refers", async function () {

      await expect(acdm.connect(user_2)["signOn(address)"](user_addr_1))
      .to.emit(acdm, "SignOn")
      .withArgs(user_addr_2, user_addr_1);

      await expect(acdm.connect(user_3)["signOn(address)"](user_addr_2))
      .to.emit(acdm, "SignOn")
      .withArgs(user_addr_3, user_addr_2);

      await expect(acdm.connect(user_4)["signOn(address)"](user_addr_3))
      .to.emit(acdm, "SignOn")
      .withArgs(user_addr_4, user_addr_3);

      await expect(acdm.connect(user_5)["signOn(address)"](user_addr_1))
      .to.emit(acdm, "SignOn")
      .withArgs(user_addr_5, user_addr_1);
    });
  });

  describe("Test buy and stop sale round (start trade)", function () {
    it("Should revert because price and pay mismatch", async function () {

      const initPrice = await acdm.initSalePrice();

      await expect(acdm.connect(user_1).buy(1000, {value: initPrice.mul(999) }))
      .to.be.revertedWith("Payment amount does not match the total cost");
    });

    it("Buying by user_1, user_2 and user_3 and check refers fee", async function () {

    const initPrice = await acdm.initSalePrice();

    await expect(acdm.connect(user_1).buy(10000, {value: initPrice.mul(10000) }))
    .to.emit(acdm, "SoldOnSale")
    .withArgs(roundId, user_addr_1, 10000);

    const balance_u1_befor_1 = await ethers.provider.getBalance(user_addr_1);

    await expect(acdm.connect(user_2).buy(20000, {value: initPrice.mul(20000) }))
    .to.emit(acdm, "SoldOnSale")
    .withArgs(roundId, user_addr_2, 20000);

    const balance_u2_befor_1 = await ethers.provider.getBalance(user_addr_2);

    const balance_u1_after_1 = await ethers.provider.getBalance(user_addr_1);

    await expect(acdm.connect(user_3).buy(30000, {value: initPrice.mul(30000) }))
    .to.emit(acdm, "SoldOnSale")
    .withArgs(roundId, user_addr_3, 30000);

    const balance_u2_after_1 = await ethers.provider.getBalance(user_addr_2);

    const balance_u1_after_2 = await ethers.provider.getBalance(user_addr_1);


    expect(balance_u1_after_1.sub(balance_u1_befor_1))
    .to.be.equal(initPrice.mul(20000 * 5 / 100));

    expect(balance_u2_after_1.sub(balance_u2_befor_1))
    .to.be.equal(initPrice.mul(30000 * 5 / 100));

    expect(balance_u1_after_2.sub(balance_u1_after_1))
    .to.be.equal(initPrice.mul(30000 * 3 / 100));

    snapShot = await network.provider.send("evm_snapshot");

    await expect(acdm.connect(user_4).buy(10000, {value: initPrice.mul(10000) }))
    .to.emit(acdm, "SoldOnSale")
    .withArgs(roundId, user_addr_4, 10000);

    expect(await ethers.provider.getBalance(acdm.address)).to.be
    .equal(initPrice.mul(70000 - 1000 - 1500 - 900 - 500 - 300));

    await expect(acdm.connect(user_4).buy(50000, {value: initPrice.mul(50000) }))
    .to.be.revertedWith("Not enough tokens");
    });

    it("Try add order (should be reverted)", async function () {

      await expect(acdm.connect(user_1).addOrder(10000, 10000))
      .to.be.revertedWith("Trading round is not started");
    });

    it("Should test start trade when time over and func must burn tokens",
      async function () {

      await expect(acdm.connect(user_4).startTrade())
      .to.be.revertedWith("Saling round is not over");

      await ethers.provider.send('evm_increaseTime', [3 * days]);
      await ethers.provider.send('evm_mine', []);

      await expect(acdm.connect(user_4).startTrade())
      .to.emit(acdm, "TradeStarted")
      .withArgs(roundId);

      // At this point, the balance should be zero becouse no tradings yet
      expect(await acdmToken.balanceOf(acdm.address)).to.be.equal(0);

      await expect(acdm.connect(user_4).startTrade())
      .to.be.revertedWith("Trading round is already started");

    });

    it("Should revert buy() because the time is up", async function () {

      const initPrice = await acdm.initSalePrice();

      await expect(acdm.connect(user_5).buy(10000, {value: initPrice.mul(10000) }))
      .to.be.revertedWith("The time of sale elapsed");
    });

    it("Should test start trade when all emmited tokens was sold", async function () {

      await network.provider.send("evm_revert", [snapShot]);

      const initPrice = await acdm.initSalePrice();

      await expect(acdm.connect(user_4).buy(40000, {value: initPrice.mul(40000) }))
      .to.emit(acdm, "SoldOnSale")
      .withArgs(roundId, user_addr_4, 40000);

      expect((await acdm.rounds(0))["sold"]).to.be.equal((await acdm.rounds(0))["emission"]);

      await expect(acdm.connect(user_4).startTrade())
      .to.emit(acdm, "TradeStarted")
      .withArgs(roundId);

    });
  });

  describe("Test trading", function () {
    it("Users add orders (with event)", async function () {

      const initPrice = await acdm.initSalePrice();

      await expect(acdm.connect(user_6).addOrder(10000, initPrice.mul(2)))
      .to.be.revertedWith("You need to sign on platform");

      await acdmToken.connect(user_1).approve(acdm.address,
        (ethers.BigNumber.from(10000)).mul(acdmDecemals));

      await expect(acdm.connect(user_1).addOrder(10000, initPrice.mul(2)))
      .to.emit(acdm, "OrderAdded")
      .withArgs(0);

      await acdmToken.connect(user_2).approve(acdm.address,
        (ethers.BigNumber.from(20000)).mul(acdmDecemals));

      await expect(acdm.connect(user_2).addOrder(20000, initPrice.mul(3)))
      .to.emit(acdm, "OrderAdded")
      .withArgs(1);

      await acdmToken.connect(user_3).approve(acdm.address,
        (ethers.BigNumber.from(20000)).mul(acdmDecemals));

      await expect(acdm.connect(user_3).addOrder(20000, initPrice.mul(4)))
      .to.emit(acdm, "OrderAdded")
      .withArgs(2);

    });

    it("Test redeemOrder by user with two refers and check fee", async function () {

      const price = (await acdm.orders(0))["price"];

      const balance_u1_befor = await ethers.provider.getBalance(user_addr_1);

      const balance_u2_befor = await ethers.provider.getBalance(user_addr_2);

      const balance_u3_befor = await ethers.provider.getBalance(user_addr_3);

      await expect(acdm.connect(user_4)
      .redeemOrder(0, 5000, {value: price.mul(5000)}))
      .to.emit(acdm, "SoldOnTrade")
      .withArgs(0, user_addr_4, 5000);

      const balance_u1_after = await ethers.provider.getBalance(user_addr_1);

      const balance_u2_after = await ethers.provider.getBalance(user_addr_2);

      const balance_u3_after = await ethers.provider.getBalance(user_addr_3);

      expect(balance_u1_after.sub(balance_u1_befor))
      .to.be.equal(price.mul(5000 - 125 - 125));

      expect(balance_u2_after.sub(balance_u2_befor))
      .to.be.equal(price.mul(125));

      expect(balance_u3_after.sub(balance_u3_befor))
      .to.be.equal(price.mul(125));
    });

    it("Test redeemOrder by user with one refer and check fee", async function () {
      const price = (await acdm.orders(2))["price"];

      const balance_u1_befor = await ethers.provider.getBalance(user_addr_1);

      const balance_sp_acc_befor = await acdm.acdm_spec_accaunt();

      const balance_u3_befor = await ethers.provider.getBalance(user_addr_3);

      const order = (await acdm.getOrdersNumber()) - 1;

      await expect(acdm.connect(user_2)
      .redeemOrder(order, 10000, {value: price.mul(10000)}))
      .to.emit(acdm, "SoldOnTrade")
      .withArgs(order, user_addr_2, 10000);

      const balance_u1_after = await ethers.provider.getBalance(user_addr_1);

      const balance_sp_acc_after = await acdm.acdm_spec_accaunt();

      const balance_u3_after = await ethers.provider.getBalance(user_addr_3);

      expect(balance_u1_after.sub(balance_u1_befor))
      .to.be.equal(price.mul(250));

      expect(balance_sp_acc_after.sub(balance_sp_acc_befor))
      .to.be.equal(price.mul(250));

      expect(balance_u3_after.sub(balance_u3_befor))
      .to.be.equal(price.mul(10000 - 250 - 250));
    });

    it("Test redeemOrder by user with no refer and check fee", async function () {
      const price = (await acdm.orders(1))["price"];

      const balance_u2_befor = await ethers.provider.getBalance(user_addr_2);

      const balance_sp_acc_befor = await acdm.acdm_spec_accaunt();

      await expect(acdm.connect(user_6)
      .redeemOrder(1, 10000, {value: price.mul(10000)}))
      .to.emit(acdm, "SoldOnTrade")
      .withArgs(1, user_addr_6, 10000);

      const balance_u2_after = await ethers.provider.getBalance(user_addr_2);

      const balance_sp_acc_after = await acdm.acdm_spec_accaunt();

      expect(balance_u2_after.sub(balance_u2_befor))
      .to.be.equal(price.mul(10000 - 250 - 250));

      expect(balance_sp_acc_after.sub(balance_sp_acc_befor))
      .to.be.equal(price.mul(500));
    });

    it("Test redeemOrder with close order event", async function () {

      const price = (await acdm.orders(0))["price"];

      await expect(acdm.connect(user_5)
      .redeemOrder(0, 5000, {value: price.mul(5000)}))
      .to.emit(acdm, "OrderClosed")
      .withArgs(0);
    });

    it("Test removeOrder", async function () {

      await expect(acdm.connect(user_3).removeOrder(1))
      .to.be.revertedWith("Caller is not seller")

      const balance_u2_befor = await acdmToken.balanceOf(user_addr_2);

      await expect(acdm.connect(user_2)
      .removeOrder(1)).to.emit(acdm, "OrderClosed")
      .withArgs(1);

      const balance_u2_after = await acdmToken.balanceOf(user_addr_2);

      expect(balance_u2_after.sub(balance_u2_befor))
      .to.be.equal((ethers.BigNumber.from(10000)).mul(acdmDecemals));
    });

    it("Test reverts of redeemOrder", async function () {

      let price = (await acdm.orders(0))["price"];

      await expect(acdm.connect(user_7)
      .redeemOrder(0, 1000,  {value: price.mul(1000)}))
      .to.be.revertedWith("Not enough tokens on the order");

      // invalid order
      price = (await acdm.orders(3))["price"];

      await expect(acdm.connect(user_7)
      .redeemOrder(3, 1000,  {value: price.mul(1000)}))
      .to.be.revertedWith("Not enough tokens on the order")
      //

      price = (await acdm.orders(2))["price"];

      await expect(acdm.connect(user_7)
      .redeemOrder(2, 1000,  {value: price.mul(999)}))
      .to.be.revertedWith("Payment amount does not match the total cost");
    });

    it("Test stopTrade", async function () {

      await expect(acdm.connect(user_3).stopTrade())
      .to.be.revertedWith("Trading round is not over");

      await expect(acdm.startSale()).to.emit(acdm, "SaleStarted")
      .to.be.revertedWith("The sale/trade round has already started");

      await ethers.provider.send('evm_increaseTime', [3 * days]);
      await ethers.provider.send('evm_mine', []);

      let price = (await acdm.orders(2))["price"];

      await expect(acdm.connect(user_7)
      .redeemOrder(2, 1000,  {value: price.mul(1000)}))
      .to.be.revertedWith("Trading round is over");

      await expect(acdm.connect(user_2)
      .stopTrade()).to.emit(acdm, "TradeStopped")
      .withArgs(0);

      await expect(acdm.connect(user_3).stopTrade())
      .to.be.revertedWith("Trading round is not started");

      await expect(acdm.connect(user_1).addOrder(10000, 1000000))
      .to.be.revertedWith("Trading round is not started");

      await expect(acdm.connect(user_7)
      .redeemOrder(2, 1000,  {value: price.mul(1000)}))
      .to.be.revertedWith("Trading round is not started");
    });
  });

  describe("Test starting the next round (not first)", function () {

    it("Should start the next sale and check emission and new price",
      async function () {

      const balance_acdm_befor = await acdmToken.balanceOf(acdm.address);

      roundId = await acdm.getCurrentRoundId();

      await expect(acdm.startSale()).to.emit(acdm, "SaleStarted")
      .withArgs(roundId);

      const balance_acdm_after = await acdmToken.balanceOf(acdm.address);

      let tradedEst = ((await acdm.orders(0))["price"]).mul(10000);

      tradedEst = tradedEst.add(((await acdm.orders(1))["price"]).mul(10000))

      tradedEst = tradedEst.add(((await acdm.orders(2))["price"]).mul(10000))

      const traded = (await acdm.rounds(0))["traded"];

      expect(tradedEst).to.be.equal(traded);

      const oldPriceEst = (ethers.utils.parseEther("1")).div(100000);

      expect(oldPriceEst).to.be.equal((await acdm.rounds(0))["price"]);

      const newPriceEst = ((oldPriceEst.mul(103)).div(100)).add(ethers.utils.parseEther("0.000004"));

      expect(newPriceEst).to.be.equal((await acdm.rounds(1))["price"]);

      expect(balance_acdm_after.sub(balance_acdm_befor))
      .to.be.equal((traded.div(newPriceEst)).mul(acdmDecemals));
    });
  });

  describe("Test withdraw and getters", function () {
    it("Test withdraw", async function () {

      const wdr = await acdm.getWithdrawRole();

      await acdm.connect(acdm_owner).grantRole(wdr, user_addr_1);

      const balance = await acdm.acdm_accaunt();

      expect(balance).not.to.be.equal(await ethers.provider.getBalance(acdm.address));

      await expect(acdm.connect(user_2)
      .withdraw(user_addr_2, balance))
      .to.be.revertedWith("Caller cannot withdraw");

      await expect(acdm.connect(acdm_owner)
      .withdraw(acdm_owner_addr, balance.add(10000)))
      .to.be.revertedWith("Not enough ETH on account");

      await expect(acdm.connect(acdm_owner)
      .withdraw(ethers.constants.AddressZero, balance))
      .to.be.revertedWith("Zero address");

      await network.provider.send("evm_revert", [snapShot]);
      snapShot = await network.provider.send("evm_snapshot");

      await acdm.connect(acdm_owner).withdraw(acdm_owner_addr, balance);

      await network.provider.send("evm_revert", [snapShot]);
      snapShot = await network.provider.send("evm_snapshot");

      await acdm.connect(user_1).withdraw(acdm_owner_addr, balance);

      await network.provider.send("evm_revert", [snapShot]);
      snapShot = await network.provider.send("evm_snapshot");

    });

    it("Test getters", async function () {
      let result;

      expect(await acdm.users(user_addr_3)).to.be.equal(true);

      expect( await acdm.getUserRefers(user_addr_2, 0)).to.be.equal(user_addr_1);

      expect( await acdm.getUserRefers(user_addr_2, 1)).to.be.equal(ethers.constants.AddressZero);

      result = await acdm.referSaleFees(0);
    });
  });
});

describe("DAO", function () {
  const votingId_0 = 0;
  const votingId_1 = 1;
  const votingId_2 = 2;
  const votingId_3 = 3;
  const votingId_4 = 4;
  const votingId_5 = 5;
  const votingId_twice_2 = 6;
  const votingId_6 = 7;
  const votingId_7 = 8;
  const votingId_8 = 9;
  const noVotingId = 10;

  let myDAO: Contract;
  let myStaking: Contract;
  let acdm: Contract;


  it("Test addProposal for staking contract", async function () {

    await ethers.provider.send('evm_increaseTime', [7 * days]);
    await ethers.provider.send('evm_mine', []);

    myDAO = await ethers.getContractAt("MyDAO", dao_address);

    myStaking = await ethers.getContractAt("MyStaking", myStaking_address);

    const iface = myStaking.interface;
    const calldata = iface.encodeFunctionData("reset_lock_period",[6]);
    const recipient = myStaking_address;
    const description = "function: reset_lock_period; parametrs: [6] (days)";

    await expect(myDAO.connect(user_1).addProposal(
      calldata,
      recipient,
      description))
    .to.be.revertedWith("Caller is not a chairman");

    await expect(myDAO.connect(chair_man_1).addProposal(
      calldata,
      recipient,
      description))
    .to.emit(myDAO, "NewVotingAdded").withArgs(votingId_0, description);
  });

  it("Test addProposal for ACDMPlatform contract on change refers fee",
    async function () {

    acdm = await ethers.getContractAt("ACDMPlatform", acdm_address);
    const iface = acdm.interface;
    const recipient = acdm_address;

    let calldata = iface.encodeFunctionData("changeRefersSaleFee",[[60, 40]]);
    let description = "function: changeRefersSaleFee; parametrs: [[60, 40]] (days)";

    await expect(myDAO.connect(chair_man_1).addProposal(
      calldata,
      recipient,
      description))
    .to.emit(myDAO, "NewVotingAdded").withArgs(votingId_1, description);

    calldata = iface.encodeFunctionData("changeRefersTradeFee",[30]);
    description = "function: changeRefersTradeFee; parametrs: [30] (days)";

    await expect(myDAO.connect(chair_man_1).addProposal(calldata,
                                                        recipient,
                                                        description))
    .to.emit(myDAO, "NewVotingAdded").withArgs(votingId_2, description);
  });

  it("Add proposal for add/remove chairman and reset minimum quorum",
      async function () {

    const recipient = myDAO.address;
    const description = "description";
    const iface = myDAO.interface;

    let calldata = iface.encodeFunctionData("removeChairMan", [chair_man_addr_1]);

    await expect(myDAO.connect(chair_man_1).addProposal(calldata,
                                                        recipient,
                                                        description))
    .to.emit(myDAO, "NewVotingAdded").withArgs(votingId_3, description);

    // 6 hours shifts
    await ethers.provider.send('evm_increaseTime', [3600 * 6]);
    await ethers.provider.send('evm_mine', []);

    calldata = iface.encodeFunctionData("addChairMan", [chair_man_addr_2]);

    await expect(myDAO.connect(chair_man_1).addProposal(calldata,
                                                        recipient,
                                                        description))
    .to.emit(myDAO, "NewVotingAdded").withArgs(votingId_4, description);

    // 6 hours shifts
    await ethers.provider.send('evm_increaseTime', [3600 * 6]);
    await ethers.provider.send('evm_mine', []);

    calldata = iface.encodeFunctionData("resetMinimumQuorum",[ethers.utils.parseEther("11")]);

    await expect(myDAO.connect(chair_man_1).addProposal(calldata,
                                                        recipient,
                                                        description))
    .to.emit(myDAO, "NewVotingAdded").withArgs(votingId_5, description);

    calldata = iface.encodeFunctionData("addChairMan", [chair_man_addr_2]);

    await expect(myDAO.connect(chair_man_1).addProposal(calldata,
                                                        recipient,
                                                        description))
    .to.emit(myDAO, "NewVotingAdded").withArgs(votingId_twice_2, description);
  });

  it("Test reverts of vote function", async function () {
    snapShot = await network.provider.send("evm_snapshot");

    await expect(myDAO.connect(user_4).vote(votingId_0, true))
      .to.be.revertedWith("No tokens to vote");

    await expect(myDAO.connect(user_1).vote(noVotingId, true))
      .to.be.revertedWith("This voting is not actual");

    await ethers.provider.send('evm_increaseTime', [3600 * 12]);
    await ethers.provider.send('evm_mine', []);

    await expect(myDAO.connect(user_1).vote(votingId_0, true))
      .to.be.revertedWith("The time of voting is elapsed");

    await network.provider.send("evm_revert", [snapShot]);
    snapShot = await network.provider.send("evm_snapshot");

    const user_votes_1 = (await myStaking.stakes(user_addr_1))["amount"];

    await expect(myDAO.connect(user_1).vote(votingId_0, true))
      .to.emit(myDAO, "Vote").withArgs(votingId_0, user_addr_1, true,
                                       user_votes_1);

    await expect(myDAO.connect(user_1).vote(votingId_0, false))
      .to.be.revertedWith("The voter already voted");
  });

  describe("Test vote function when votes delegated (user_2 delegete to user_3)",
      function () {

    it("User_2 voted himself and then user_3 voted (amount of his votes then\n"
        + "          should be equal to his balance)",
        async function () {

      await myDAO.connect(user_2).delegate(votingId_0, user_addr_3);

      const user_votes_2 = (await myStaking.stakes(user_addr_2))["amount"];

      await expect(myDAO.connect(user_2).vote(votingId_0, true))
      .to.emit(myDAO, "Vote").withArgs(
        votingId_0, user_addr_2, true,
        user_votes_2);

      const user_votes_3 = (await myStaking.stakes(user_addr_3))["amount"];

      await expect(myDAO.connect(user_3).vote(votingId_0, true))
        .to.emit(myDAO, "Vote").withArgs(votingId_0, user_addr_3, true,
                                         user_votes_3);
    });

    it("Revert state then user_2 deleget and then undelegete his votes to user_3\n"
        + "          (amount of user_3 votes should be equal to his balance)",
        async function () {

      await network.provider.send("evm_revert", [snapShot]);
      snapShot = await network.provider.send("evm_snapshot");

      await myDAO.connect(user_2).delegate(votingId_0, user_addr_3);
      await myDAO.connect(user_2).unDelegate(votingId_0);

      const user_votes_3 = (await myStaking.stakes(user_addr_3))["amount"];

      await expect(myDAO.connect(user_3).vote(votingId_0, true))
        .to.emit(myDAO, "Vote").withArgs(votingId_0, user_addr_3, true,
                                         user_votes_3);
    });

    it("Revert state then user_3 vote but user_2 delegate to user_3 and then\n"
        + "(         unstaked his tokens, so amount of user_3 votes\n"
        + "          should be equal to his balance (no matter how many unDeposit))",
        async function () {

      await network.provider.send("evm_revert", [snapShot]);
      snapShot = await network.provider.send("evm_snapshot");

      await myDAO.connect(user_2).delegate(votingId_0, user_addr_3);

      await expect(myStaking.connect(user_2).unstake(1000000))
        .to.emit(myStaking, "Unstake").withArgs(user_addr_2, 1000000);

      const user_votes_3 = (await myStaking.stakes(user_addr_3))["amount"];

      await expect(myDAO.connect(user_3).vote(votingId_0, true))
        .to.emit(myDAO, "Vote").withArgs(votingId_0, user_addr_3, true,
                                         user_votes_3);
    });

    it("Revert state then only user_3 vote (amount of his votes then\n"
        + "          should be equal to his balance plus balance of user_2)",
        async function () {

      await network.provider.send("evm_revert", [snapShot]);
      snapShot = await network.provider.send("evm_snapshot");

      const user_votes_2 = (await myStaking.stakes(user_addr_2))["amount"];
      const user_votes_3 = (await myStaking.stakes(user_addr_3))["amount"];

      await myDAO.connect(user_2).delegate(votingId_0, user_addr_3);

      await expect(myDAO.connect(user_3).vote(votingId_0, true))
      .to.emit(myDAO, "Vote").withArgs(
        votingId_0, user_addr_3, true,
        user_votes_3.add(user_votes_2));
    });

    it("User_2 try to vote after user_3 voted", async function () {
      await expect(myDAO.connect(user_2).vote(votingId_0, true))
      .to.be.revertedWith(
        "The voter delegate his votes and delegator already voted");
    });
  });

  describe("Test reverts of unstake function ", function () {

    it("Try unstake by user_2 who delegeted his votes (the voting is actual)",
        async function () {

      const user_votes_2 = (await myStaking.stakes(user_addr_2))["amount"];

      await expect(myStaking.connect(user_2).unstake(user_votes_2))
      .to.be.revertedWith(
        "Unstake operation reverted due to delegating in actual voting");
    });

    it("Try unstake by user_3 who voted and that voting is actual yet",
        async function () {

      const user_votes_3 = (await myStaking.stakes(user_addr_3))["amount"];

      await expect(myStaking.connect(user_3).unstake(user_votes_3))
      .to.be.revertedWith(
        "Unstake operation reverted due to participating in actual voting");
    });
  });

  describe("Test reverts of delegate and unDelegate (in actual state user_2\n"
      + "           delegate to user_3 and user_3 voted)", function () {

    it("Delegate", async function () {

      await expect(myDAO.connect(user_4).delegate(votingId_0, user_addr_3))
        .to.be.revertedWith("No tokens to vote");

      await expect(myDAO.connect(user_1).delegate(votingId_0, user_addr_4))
        .to.be.revertedWith("This account cannot vote");

      await expect(myDAO.connect(user_1).delegate(votingId_0, user_addr_1))
        .to.be.revertedWith("Voter cannot delegate himself");

      await expect(myDAO.connect(user_1).delegate(noVotingId, user_addr_3))
        .to.be.revertedWith("This voting is not actual");

      await expect(myDAO.connect(user_1).delegate(votingId_0, user_addr_3))
        .to.be.revertedWith("The voter already voted");

      await expect(myDAO.connect(user_1).delegate(votingId_0, user_addr_2))
        .to.be.revertedWith(
          "This voter delegate his votes to some voter and that voter already voted");

      await myDAO.connect(user_1).delegate(votingId_1, user_addr_3);

      await expect(myDAO.connect(user_1).delegate(votingId_1, user_addr_3))
        .to.be.revertedWith(
          "The votes are already delegated. Undelegate them to redelegate");
    });

    it("Undelegate", async function () {

      await expect(myDAO.connect(user_4).unDelegate(votingId_0))
        .to.be.revertedWith("No tokens to vote");

      await expect(myDAO.connect(user_1).unDelegate(noVotingId))
        .to.be.revertedWith("This voting is not actual");

      await expect(myDAO.connect(user_3).unDelegate(votingId_0))
        .to.be.revertedWith("Nothing to undelegate");

      await expect(myDAO.connect(user_2).unDelegate(votingId_0))
        .to.be.revertedWith("The voter already voted");
    });
  });

  describe("Test finishProposal", function () {

    it("Revert when time not elapsed", async function () {
      await expect(myDAO.connect(user_4).finishProposal(votingId_0))
        .to.be.revertedWith("The time of voting is not elapsed");
    });

    it("Pass when no quorum and revert because not actual", async function () {
      await ethers.provider.send('evm_increaseTime', [3600 * 18]);
      await ethers.provider.send('evm_mine', []);

      const avl = await myDAO.connect(user_4).getActualVotingsIdsLength();
      await myDAO.connect(user_4).finishProposal(votingId_1);
      await myDAO.connect(user_4).getActualVotingsIdsLength();
      expect(await myDAO.connect(user_4).getActualVotingsIdsLength()).to.be.equal(avl - 1);

      await expect(myDAO.connect(user_4).finishProposal(votingId_1))
        .to.be.revertedWith("This voting is not actual");
    });

    it("Revert when called function failed (removeChairMan, because only one chairman)",
        async function () {

      await network.provider.send("evm_revert", [snapShot]);
      snapShot = await network.provider.send("evm_snapshot");

      await myDAO.connect(user_2).vote(votingId_3, true);

      await myDAO.connect(user_3).vote(votingId_3, true);

      await ethers.provider.send('evm_increaseTime', [3600 * 18]);
      await ethers.provider.send('evm_mine', []);

      await expect(myDAO.connect(user_4).finishProposal(votingId_3))
      .to.be.revertedWith("ERROR call func");
    });

    it("Finish votingId_3(removeChairMan) with negative result", async function () {

      await network.provider.send("evm_revert", [snapShot]);
      snapShot = await network.provider.send("evm_snapshot");

      // const user_votes_3 = (await myStaking.stakes(user_addr_3))["amount"];
      // console.log(user_votes_3);
      // const user_votes_2 = (await myStaking.stakes(user_addr_2))["amount"];
      // console.log(user_votes_2);
      // console.log(await myDAO.minimumQuorum());

      await myDAO.connect(user_2).vote(votingId_3, true);

      await myDAO.connect(user_3).vote(votingId_3, false);

      await ethers.provider.send('evm_increaseTime', [3600 * 18]);
      await ethers.provider.send('evm_mine', []);

      await expect(myDAO.connect(user_4).finishProposal(votingId_3))
        .to.emit(myDAO, "VotingOver").withArgs(votingId_3, false);
    });

    it("Finish votingId_1 with negative result equality of agree and disagree",
        async function () {

      await network.provider.send("evm_revert", [snapShot]);
      snapShot = await network.provider.send("evm_snapshot");

      await myDAO.connect(user_1).vote(votingId_1, true);

      await myDAO.connect(user_2).vote(votingId_1, true);

      await myDAO.connect(user_3).vote(votingId_1, false)

      await ethers.provider.send('evm_increaseTime', [3600 * 18]);
      await ethers.provider.send('evm_mine', []);

      await expect(myDAO.connect(user_4).finishProposal(votingId_1))
        .to.emit(myDAO, "VotingOver").withArgs(votingId_1, false);
    });

    it("Finish votingId_4(addChairMan) and votingId_twice and then \n"
        + "votingId_3(removeChairMan) with positive result", async function () {

      await network.provider.send("evm_revert", [snapShot]);
      snapShot = await network.provider.send("evm_snapshot");

      await myDAO.connect(user_1).vote(votingId_3, true);

      await myDAO.connect(user_3).vote(votingId_3, true);

      await myDAO.connect(user_1).vote(votingId_4, true);

      await myDAO.connect(user_3).vote(votingId_4, true);

      await myDAO.connect(user_1).vote(votingId_twice_2, true);

      await myDAO.connect(user_3).vote(votingId_twice_2, true);

      await ethers.provider.send('evm_increaseTime', [3600 * 24]);
      await ethers.provider.send('evm_mine', []);

      await expect(myDAO.connect(user_4).finishProposal(votingId_4))
        .to.emit(myDAO, "VotingOver").withArgs(votingId_4, true);

      await expect(myDAO.connect(user_4).finishProposal(votingId_twice_2))
        .to.be.revertedWith("ERROR call func");

      await expect(myDAO.connect(user_4).finishProposal(votingId_3))
        .to.emit(myDAO, "VotingOver").withArgs(votingId_3, true);
    });

    it("Finish votingId_5(resetMinimumQuorum) with positive result",
      async function () {

      await network.provider.send("evm_revert", [snapShot]);
      snapShot = await network.provider.send("evm_snapshot");

      await myDAO.connect(user_1).vote(votingId_5, true);

      await myDAO.connect(user_3).vote(votingId_5, true);

      await ethers.provider.send('evm_increaseTime', [3600 * 24]);
      await ethers.provider.send('evm_mine', []);

      await expect(myDAO.connect(user_4).finishProposal(votingId_5))
      .to.emit(myDAO, "VotingOver").withArgs(votingId_5, true);

      expect(await myDAO.minimumQuorum()).to.be.equal(ethers.utils.parseEther("11"));
    });

    it("Finish 'myStaking' voting", async function () {

      await network.provider.send("evm_revert", [snapShot]);
      snapShot = await network.provider.send("evm_snapshot");

      await myDAO.connect(user_1).vote(votingId_0, true);

      await myDAO.connect(user_3).vote(votingId_0, true);

      await ethers.provider.send('evm_increaseTime', [3600 * 24]);
      await ethers.provider.send('evm_mine', []);

      await expect(myDAO.connect(user_4).finishProposal(votingId_0))
      .to.emit(myDAO, "VotingOver").withArgs(votingId_0, true);

      expect(await myStaking.lockPeriod()).to.be.equal(6 * days);
    });

    it("Finish 'ACDM' votings (change fee)", async function () {

      await network.provider.send("evm_revert", [snapShot]);
      snapShot = await network.provider.send("evm_snapshot");

      await myDAO.connect(user_1).vote(votingId_1, true);

      await myDAO.connect(user_3).vote(votingId_1, true);

      await myDAO.connect(user_1).vote(votingId_2, true);

      await myDAO.connect(user_3).vote(votingId_2, true);

      await ethers.provider.send('evm_increaseTime', [3600 * 24]);
      await ethers.provider.send('evm_mine', []);

      await expect(myDAO.connect(user_4).finishProposal(votingId_1))
      .to.emit(myDAO, "VotingOver").withArgs(votingId_1, true);

      await expect(myDAO.connect(user_4).finishProposal(votingId_2))
      .to.emit(myDAO, "VotingOver").withArgs(votingId_2, true);

      expect(await acdm.referSaleFees(0)).to.be.equal(60);

      expect(await acdm.referSaleFees(1)).to.be.equal(40);

      expect(await acdm.referTradeFee()).to.be.equal(30);
    });

    it("Add proposal and voting for ACDMPlatform contract on incoorect change refers fee",
      async function () {

      const iface = acdm.interface;
      const recipient = acdm_address;

      let calldata = iface.encodeFunctionData("changeRefersSaleFee",[[60, 40, 15]]);
      let description = "function: changeRefersSaleFee; parametrs: [[60, 40, 15]] (days)";

      await expect(myDAO.connect(chair_man_1).addProposal(
        calldata,
        recipient,
        description))
      .to.emit(myDAO, "NewVotingAdded").withArgs(votingId_6, description);

      await myDAO.connect(user_1).vote(votingId_6, true);

      await myDAO.connect(user_3).vote(votingId_6, true);

      await ethers.provider.send('evm_increaseTime', [3600 * 24]);
      await ethers.provider.send('evm_mine', []);

      await expect(myDAO.connect(user_4).finishProposal(votingId_6))
      .to.be.revertedWith("ERROR call func");
    });

    it("Add proposals and voting for ACDMPlatform contract on spec_account manage",
      async function () {

      const iface = acdm.interface;
      const recipient = acdm_address;

      let calldata = iface.encodeFunctionData("buyAndBurnXXXTokens");
      let description = "function: buyAndBurnXXXTokens";

      await expect(myDAO.connect(chair_man_1).addProposal(
        calldata,
        recipient,
        description))
      .to.emit(myDAO, "NewVotingAdded").withArgs(votingId_7, description);

      calldata = iface.encodeFunctionData("giveToOwner");
      description = "function: giveToOwner";

      await expect(myDAO.connect(chair_man_1).addProposal(
        calldata,
        recipient,
        description))
      .to.emit(myDAO, "NewVotingAdded").withArgs(votingId_8, description);

      await myDAO.connect(user_1).vote(votingId_7, true);

      await myDAO.connect(user_3).vote(votingId_7, true);

      await myDAO.connect(user_1).vote(votingId_8, true);

      await myDAO.connect(user_3).vote(votingId_8, true);

      await ethers.provider.send('evm_increaseTime', [3600 * 24]);
      await ethers.provider.send('evm_mine', []);

      snapShot = await network.provider.send("evm_snapshot");

      await expect(myDAO.connect(user_4).finishProposal(votingId_7))
      .to.emit(myDAO, "VotingOver").withArgs(votingId_7, true);

      expect(await acdm.acdm_spec_accaunt()).to.be.equal(0);

      await network.provider.send("evm_revert", [snapShot]);

      let balanceSp = await acdm.acdm_spec_accaunt();
      let balanceOwn = await acdm.acdm_accaunt();

      await expect(myDAO.connect(user_4).finishProposal(votingId_8))
      .to.emit(myDAO, "VotingOver").withArgs(votingId_8, true);

      expect(await acdm.acdm_accaunt()).to.be.equal(balanceOwn.add(balanceSp));
    });
  });

  describe("Test onlyDAO reverts and some getters", function () {
    it("Try call functions which for only DAO calls from any other address",
        async function () {

      await expect(myDAO.connect(user_1).addChairMan(user_addr_1))
      .to.be.revertedWith("This function can be called only from voting");

      await expect(myDAO.connect(user_1).removeChairMan(user_addr_1))
      .to.be.revertedWith("This function can be called only from voting");

      await expect(myDAO.connect(user_1).resetMinimumQuorum(user_addr_1))
      .to.be.revertedWith("This function can be called only from voting");

      await expect(myDAO.connect(user_1).approveUnstake(user_addr_1, 1000, 1000))
      .to.be.revertedWith("Caller is not an unstaker");

      await expect(myStaking.connect(user_1).reset_lock_period(5))
      .to.be.revertedWith("Only DAO can call the function");

      await expect(acdm.connect(user_1).changeRefersSaleFee([10, 5]))
      .to.be.revertedWith("Only DAO can call the function");

      await expect(acdm.connect(user_1).changeRefersTradeFee(10))
      .to.be.revertedWith("Only DAO can call the function");

      await expect(acdm.connect(user_1).buyAndBurnXXXTokens())
      .to.be.revertedWith("Only DAO can call the function");

      await expect(acdm.connect(user_1).giveToOwner())
      .to.be.revertedWith("Only DAO can call the function");


    });

    it("Call getters", async function () {

      expect(await myDAO.connect(user_1).getActualVotingsIdsLength())
      .to.be.equal(7);

      expect(await myDAO.connect(user_1).getIsVoted(1, user_addr_1))
      .to.be.equal(true);

      await myDAO.connect(user_1).delegate(votingId_5, user_addr_3);

      expect(await myDAO.connect(user_1).getDelegated(votingId_5, user_addr_1))
      .to.be.equal(user_addr_3);

      const av = await myDAO.connect(user_1).getActualVotingsIds();

      const user_votes_1 = (await myStaking.stakes(user_addr_1))["amount"];

      expect(await myDAO.connect(user_1)
      .getDelegatedTotalBalance(votingId_5, user_addr_3))
      .to.be.equal(user_votes_1);
    });
  });
});

describe("Test ACDMToken contract", function () {
  let token: Contract;

  it("Test reverts", async function () {

    token = await ethers.getContractAt("ACDMERC20Contract", acdm_token_address);

    await expect(token.connect(user_1).mint(user_addr_1, 1000))
    .to.be.revertedWith("Caller is not a minter");

    await expect(token.connect(user_7).burn(user_addr_1, 1000))
    .to.be.revertedWith("Caller is not a burner or an owner");
  });

  it("Test getters", async function () {

    expect(await token.decimals()).to.be.equal(6);
    await token.minter();
    await token.burner();
  });
});

describe("Test XXXToken contract", function () {
  let token:Contract;

  it("Test reverts", async function () {

    token = await ethers.getContractAt(
      "XXXERC20Contract", xxxERC20Contract_address);

    await expect(token.connect(user_1).mint(user_addr_1, 1000))
    .to.be.revertedWith("Caller is not a minter");

    await expect(token.connect(user_7).burn(user_addr_1, 1000))
    .to.be.revertedWith("Caller is not a burner");
  });

  it("Test getters", async function () {

    expect(await token.decimals()).to.be.equal(18);
    await token.minter();
    await token.burner();
  });

});
