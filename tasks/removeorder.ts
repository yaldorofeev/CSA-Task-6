import 'dotenv/config';
import { types, task } from "hardhat/config";

task("removeorder", "Remove order from traiding")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("id", "Order Id")
  .setAction(async (args, hre) => {

  const accounts = await hre.ethers.getSigners();

  const contract = await hre.ethers.getContractAt("ACDMPlatform",
  process.env.ACDM_CONTRACT!, accounts[args.user]);

  const tx = await contract.removeOrder(args.id);
  const ttx = await tx.wait();
  console.log(ttx);
});
