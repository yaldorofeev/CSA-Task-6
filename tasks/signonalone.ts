import 'dotenv/config';
import { types, task } from "hardhat/config";

task("signonalone", "Sign on platform")
  .addParam("user", "ID of accaunt in array in .env")
  .setAction(async (args, hre) => {

  const accounts = await hre.ethers.getSigners();

  const contract = await hre.ethers.getContractAt("ACDMPlatform",
  process.env.ACDM_CONTRACT!, accounts[args.user]);

  const tx = await contract.signOn();
  const ttx = await tx.wait();
  console.log(ttx);
});
