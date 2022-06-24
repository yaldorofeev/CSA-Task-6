import 'dotenv/config';
import { types, task } from "hardhat/config";

task("stoptrade", "Stop trade")
  .addParam("user", "ID of accaunt in array in .env")
  .setAction(async (args, hre) => {

  const accounts = await hre.ethers.getSigners();

  const contract = await hre.ethers.getContractAt("ACDMPlatform",
  process.env.ACDM_CONTRACT!, accounts[args.user]);

  const tx = await contract.stopTrade();
  const ttx = await tx.wait();
  console.log(ttx);
});
