import { ethers } from "hardhat";
import * as dotenv from "dotenv";

async function main() {
  const reward_period_days = 2;
  const lock_period_days = 7;
  const reward_procents = 5;
  const daoMinimumQuorum = ethers.utils.parseEther("1");
  const daoDebatingPeriodDuration = 24;

  const accounts = await ethers.getSigners();

  const SuperStaking = await ethers.getContractFactory("MyStaking", accounts[1]);
  const superStaking = await SuperStaking.deploy(
    process.env.UNISWAP_LP_CONTRACT!,
    process.env.XXX_CONTRACT!,
    reward_period_days,
    lock_period_days,
    reward_procents,
    await accounts[0].getAddress(),
    daoMinimumQuorum,
    daoDebatingPeriodDuration);

  await superStaking.deployed();

  console.log("staking deployed to:", superStaking.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
