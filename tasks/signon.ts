import 'dotenv/config';
import { types, task } from "hardhat/config";

task("signon", "Sign on platform")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("refer", "Address of refer")
  .setAction(async (args, hre) => {

  const accounts = await hre.ethers.getSigners();

  const contract = await hre.ethers.getContractAt("ACDMPlatform",
  process.env.ACDM_CONTRACT!, accounts[args.user]);

  const tx = await contract.signOn(args.refer);
  const ttx = await tx.wait();
  console.log(ttx);
});
