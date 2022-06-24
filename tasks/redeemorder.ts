import 'dotenv/config';
import { types, task } from "hardhat/config";

task("redeemorder", "Buy tokens on traiding")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("id", "Order Id")
  .addParam("amount", "Amount os tokens")
  .setAction(async (args, hre) => {

  const accounts = await hre.ethers.getSigners();

  const contract = await hre.ethers.getContractAt("ACDMPlatform",
  process.env.ACDM_CONTRACT!, accounts[args.user]);

  const tx = await contract.redeemOrder(args.id, args.amount);
  const ttx = await tx.wait();
  console.log(ttx);
});
