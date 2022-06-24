import 'dotenv/config';
import { types } from "hardhat/config";
import { task } from "hardhat/config";

task("claim", "Claim all rewards")
  .addParam("requesting", "ID of accaunt in array in .env")
  .setAction(async (args, hre) => {
  const accounts = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("ISuperStaking",
  process.env.CONTRACT_ACCAUNT!, accounts[args.requesting]);
  contract.on("Claim", (to, amount, event) => {
    console.log({
      to: to,
      amount: amount.toNumber(),
      data: event
    });
  });
  const tx = await contract.claim();
  tx.wait();
});
