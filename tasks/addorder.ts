import 'dotenv/config';
import { types, task } from "hardhat/config";

task("addorder", "Add order on traiding")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("amount", "Amount of tokens")
  .addParam("price", "Price of tokens")
  .setAction(async (args, hre) => {

  const accounts = await hre.ethers.getSigners();

  const contract = await hre.ethers.getContractAt("ACDMPlatform",
  process.env.ACDM_CONTRACT!, accounts[args.user]);

  const tx = await contract.addOrder(args.amount, args.price);
  const ttx = await tx.wait();
  console.log(ttx);
});
