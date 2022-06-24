import { ethers } from "hardhat";
import * as dotenv from "dotenv";

async function main() {
  const reward_period_days = 2;
  const lock_period_days = 7;
  const reward_procents = 5;
  const daoMinimumQuorum = ethers.utils.parseEther("1");
  const daoDebatingPeriodDuration = 24;

  const accounts = await ethers.getSigners();

  const ACDMp = await ethers.getContractFactory("ACDMPlatform", accounts[1]);
  const acdm = await ACDMp.deploy(
    process.env.DAO_CONTRACT!,
    process.env.XXX_CONTRACT!,
    process.env.UNISWAP_CONTRACT!);

  await acdm.deployed();

  console.log("ACDMPlatform deployed to:", acdm.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
