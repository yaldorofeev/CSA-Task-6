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

    await xxxERC20Contract.connect(staking_owner).mint(user_addr_1, xxx_u_1);

    await xxxERC20Contract.connect(staking_owner).mint(user_addr_2, xxx_u_2);

    await xxxERC20Contract.connect(staking_owner).mint(user_addr_3, xxx_u_3);

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

describe("Test Staking and DAO contract", function () {
  const reward_period_minutes = 10;
  const lock_period_minutes = 60;
  const reward_procents = 5;

  const daoMinimumQuorum = 4000000;
  const daoDebatingPeriodDuration = 24;

  let superStaking: Contract;
  let xxxToken: Contract;
  let lpToken: Contract;

  it("Should test reverts of constructor", async function () {
    const SuperStaking = await ethers.getContractFactory("MyStaking", staking_owner);
    await expect(SuperStaking.deploy(
      ethers.constants.AddressZero,
      xxxERC20Contract_address,
      reward_period_minutes,
      lock_period_minutes,
      reward_procents,
      chair_man_addr_1,
      daoMinimumQuorum,
      daoDebatingPeriodDuration))
      .to.be.revertedWith("Contract address can not be zero");
    await expect(SuperStaking.deploy(
      process.env.UNISWAP_LP_CONTRACT!,
      ethers.constants.AddressZero,
      reward_period_minutes,
      lock_period_minutes,
      reward_procents,
      chair_man_addr_1,
      daoMinimumQuorum,
      daoDebatingPeriodDuration))
      .to.be.revertedWith("Contract address can not be zero");
    await expect(SuperStaking.deploy(
      process.env.UNISWAP_LP_CONTRACT!,
      xxxERC20Contract_address,
      0,
      lock_period_minutes,
      reward_procents,
      chair_man_addr_1,
      daoMinimumQuorum,
      daoDebatingPeriodDuration))
      .to.be.revertedWith("Reward period can not be zero");
    await expect(SuperStaking.deploy(
      process.env.UNISWAP_LP_CONTRACT!,
      xxxERC20Contract_address,
      reward_period_minutes,
      lock_period_minutes,
      reward_procents,
      ethers.constants.AddressZero,
      daoMinimumQuorum,
      daoDebatingPeriodDuration))
      .to.be.revertedWith("Address of chair person can not be zero");
    await expect(SuperStaking.deploy(
      process.env.UNISWAP_LP_CONTRACT!,
      xxxERC20Contract_address,
      reward_period_minutes,
      lock_period_minutes,
      reward_procents,
      chair_man_addr_1,
      daoMinimumQuorum,
      0))
      .to.be.revertedWith("Debating period can not be zero");
  });

  it("Should deploy SuperStaking contract and connect to lp token contract", async function () {
    const SuperStaking = await ethers.getContractFactory("MyStaking", staking_owner);
    superStaking = await SuperStaking.deploy(
      process.env.UNISWAP_LP_CONTRACT!,
      xxxERC20Contract_address,
      reward_period_minutes,
      lock_period_minutes,
      reward_procents,
      chair_man_addr_1,
      daoMinimumQuorum,
      daoDebatingPeriodDuration);
    await superStaking.deployed();
    lpToken = await ethers.getContractAt("IERC20", process.env.UNISWAP_LP_CONTRACT!);
    xxxToken = await ethers.getContractAt("IMyERC20Contract", xxxERC20Contract_address);
    xxxToken.connect(staking_owner).mint(superStaking.address, ethers.utils.parseEther("100"));
  });

  it("Should make 1st stake by user_1 with event", async function () {
    const balance = await lpToken.balanceOf(user_addr_1);
    console.log(balance);

    await lpToken.connect(user_1).approve(superStaking.address, balance);
    await expect(superStaking.connect(user_1)
    .stake(balance.div(2))).to.emit(superStaking, "StakeDone")
    .withArgs(user_addr_1, balance.div(2));
  });

  it("Should make second stake after 20 minutes with event", async function () {
    await ethers.provider.send('evm_increaseTime', [60 * 20]);
    await ethers.provider.send('evm_mine', []);
    const balance0 = await xxxToken.balanceOf(user_addr_1);
    console.log(balance0);
    const balance = await lpToken.balanceOf(user_addr_1);
    await lpToken.connect(user_1).approve(superStaking.address, balance);
    await expect(superStaking.connect(user_1)
    .stake(balance)).to.emit(superStaking, "StakeDone")
    .withArgs(user_addr_1, balance);

    const balance1 = await xxxToken.balanceOf(user_addr_1);
    console.log(balance1);
  });

  // it("Should test getStakerState()", async function () {
  //   let amount;
  //   let stake;
  //   let ar = await superStaking.connect(accounts[2]).getStakerState();
  //   amount = ar[0];
  //   stake = ar[1];
  //   expect(amount).to.equal(ethers.BigNumber.from('15000000000'));
  //   expect(stake[0]['amount']).to.equal(ethers.BigNumber.from('7000000000'));
  //   expect(stake[1]['amount']).to.equal(ethers.BigNumber.from('8000000000'));
  // });
  //
  // it("Should revert claim after 20 more minutes", async function () {
  //   const t_l = 60 * 20 + 1;
  //   await ethers.provider.send('evm_increaseTime', [t_l]);
  //   await ethers.provider.send('evm_mine', []);
  //   await expect(superStaking.connect(accounts[2]).claim())
  //   .to.be.revertedWith("Sorry, but it is not enougth tokens on the contract");
  // });
  //
  // it("Should revert claimOneStake after 20 more minutes", async function () {
  //   await expect(superStaking.connect(accounts[2]).claimOneStake(0))
  //   .to.be.revertedWith("Sorry, but it is not enougth tokens on the contract");
  // });
  //
  // it("Should mint tokens from SuperToken to SuperStaking", async function () {
  //   superToken = await ethers.getContractAt("SuperToken",
  //                             process.env.SUPER_TOKEN_CONTRACT as string,
  //                             accounts[0]);
  //   await expect(superToken.mint(superStaking.address, ethers.BigNumber.from('10000000000000')))
  //       .to.emit(superToken, "Transfer")
  //       .withArgs(ethers.constants.AddressZero, superStaking.address, ethers.BigNumber.from('10000000000000'));
  //       const balance = await superToken.connect(accounts[1])
  //       .balanceOf(superStaking.address);
  //       expect(balance).to.equal(ethers.BigNumber.from('10000000000000'));
  // });
  //
  // it("Should claim with event after 20 minutes", async function () {
  //   await expect(superStaking.connect(accounts[2]).claim())
  //   .to.emit(superStaking, "Claim")
  //   .withArgs(await accounts[2].getAddress(), ethers.BigNumber.from('1850000000'));
  // });
  //
  // it("Should claimOneStake with event after 20 more minutes", async function () {
  //   const t_l = 60 * 20 + 1;
  //   await ethers.provider.send('evm_increaseTime', [t_l]);
  //   await ethers.provider.send('evm_mine', []);
  //   await expect(superStaking.connect(accounts[2]).claimOneStake(0))
  //   .to.emit(superStaking, "Claim")
  //   .withArgs(await accounts[2].getAddress(), ethers.BigNumber.from('700000000'));
  // });
  //
  // it("Should revert unstake with invalid id of stake", async function () {
  //   await expect(superStaking.connect(accounts[2])
  //   .unstake(3, ethers.BigNumber.from('7000000000')))
  //   .to.be.revertedWith("Invalid ID of stake");
  // });
  //
  // it("Should revert unstake because its too early now", async function () {
  //   await expect(superStaking.connect(accounts[2])
  //   .unstake(1, ethers.BigNumber.from('5000000000')))
  //   .to.be.revertedWith("Its not time to unstake");
  // });
  //
  // it("Should revert unstake because too many tokens is requested", async function () {
  //   const t_l = 60 * 20 + 1;
  //   await ethers.provider.send('evm_increaseTime', [t_l]);
  //   await ethers.provider.send('evm_mine', []);
  //   await expect(superStaking.connect(accounts[2])
  //   .unstake(0, ethers.BigNumber.from('9000000000')))
  //   .to.be.revertedWith("Amount of tokens exceeds staked amount");
  // });
  //
  // it("Should partly unstake with event 1st stake", async function () {
  //   await expect(superStaking.connect(accounts[2]).unstake(0, ethers.BigNumber.from('6000000000')))
  //   .to.emit(superStaking, "Unstake")
  //   .withArgs(await accounts[2].getAddress(), ethers.BigNumber.from('6000000000'));
  // });
});

describe("ACDMPlatform", function () {
  it("Should return the new greeting once it's changed", async function () {
    console.log("test ACDMPlatform");

  });

  it("Should return ", async function () {
    console.log("test ACDMPlatform1");

  });
});

describe("Staking", function () {
  it("Should return the new greeting once it's changed", async function () {
    console.log("test Staking");
  });

  it("Should ret changed", async function () {
    console.log("test Staking1");
  });
});
