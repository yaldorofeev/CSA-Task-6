import 'dotenv/config';
import { types, task } from "hardhat/config";

task("buy", "Buy tokens on sale")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("amount", "Amount of tokens")
  .setAction(async (args, hre) => {

  const accounts = await hre.ethers.getSigners();

  const contract = await hre.ethers.getContractAt("ACDMPlatform",
  process.env.ACDM_CONTRACT!, accounts[args.user]);

  const tx = await contract.buy(args.amount);
  const ttx = await tx.wait();
  console.log(ttx);
});
