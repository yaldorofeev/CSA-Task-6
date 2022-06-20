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

    let provider = ethers.provider;
    let timestamp = 0;
    let blockNumber;
    provider.getBlockNumber().then(function(blockNumber) {
    timestamp = blockNumber;
    });

    let uniswap = await ethers.getContractAt("IUniswapV2Router01",
                                process.env.UNISWAP_CONTRACT!);

    await uniswap.connect(user_1)
      .addLiquidityETH(xxxERC20Contract_address,
                       ethers.utils.parseEther("10"),
                       0, 0, user_addr_1, timestamp + 900,
                       {value: ethers.utils.parseEther("1")});

    await uniswap.connect(user_2)
      .addLiquidityETH(xxxERC20Contract_address,
                       ethers.utils.parseEther("20"),
                       0, 0, user_addr_1, timestamp + 900,
                       {value: ethers.utils.parseEther("2")});

    await uniswap.connect(user_2)
      .addLiquidityETH(xxxERC20Contract_address,
                       ethers.utils.parseEther("30"),
                       0, 0, user_addr_1, timestamp + 900,
                       {value: ethers.utils.parseEther("3")});

    // console.log(await );
  });
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
