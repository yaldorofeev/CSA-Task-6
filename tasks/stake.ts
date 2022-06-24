import 'dotenv/config';
import { types } from "hardhat/config";
import { task } from "hardhat/config";

task("stake", "Stake tokens")
  .addParam("requesting", "ID of accaunt in array in .env")
  .addParam("amount", "The amount of tokens to stake")
  .setAction(async (args, hre) => {
  const accounts = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("myStaking",
  process.env.STAKING_CONTRACT!, accounts[args.requesting]);
  await contract.one("StakeDone", (from, amount, event) => {
    console.log({
      from: from,
      amount: amount.toNumber(),
      data: event
    });
  });
  const tx = await contract.stake(args.amount);
  tx.wait();
});
