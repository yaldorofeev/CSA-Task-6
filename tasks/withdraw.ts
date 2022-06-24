import 'dotenv/config';
import { types, task } from "hardhat/config";

task("withdraw", "Withdraw")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("to", "address")
  .addParam("amount", "Amount eth")
  .setAction(async (args, hre) => {

  const accounts = await hre.ethers.getSigners();

  const contract = await hre.ethers.getContractAt("ACDMPlatform",
  process.env.ACDM_CONTRACT!, accounts[args.user]);

  const tx = await contract.withdraw(args.to, args.amount);
  const ttx = await tx.wait();
  console.log(ttx);
});
