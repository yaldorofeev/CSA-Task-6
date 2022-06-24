import 'dotenv/config';
import { types } from "hardhat/config";
import { task } from "hardhat/config";

task("unstake", "Unstake one stake by ID")
  .addParam("requesting", "ID of accaunt in array in .env")
  .addParam("stakeid", "The ID of stake")
  .addParam("amount", "The amount of tokens to unstake")
  .setAction(async (args, hre) => {
  const accounts = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("myStaking",
  process.env.STAKING_CONTRACT!, accounts[args.requesting]);
  contract.on("Unstake", (to, amount, event) => {
    console.log({
      to: to,
      amount: amount.toNumber(),
      data: event
    });
  });
  const tx = await contract.unstake(args.stakeid, args.amount);
  tx.wait();
});
