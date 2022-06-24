import 'dotenv/config';
import { types, task } from "hardhat/config";

task("initSale", "Start first sale")
  .addParam("user", "ID of accaunt in array in .env")
  .setAction(async (args, hre) => {

  const accounts = await hre.ethers.getSigners();

  const contract = await hre.ethers.getContractAt("ACDMPlatform",
  process.env.ACDM_CONTRACT!, accounts[args.user]);

  const tx = await contract.initSale();
  const ttx = await tx.wait();
  console.log(ttx);
});
