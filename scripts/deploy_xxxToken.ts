import { ethers } from "hardhat";

async function main() {

  const accounts = await ethers.getSigners();
  const XXXERC20Contract= await ethers.getContractFactory("XXXERC20Contract", accounts[1]);
  const myERC20Contract = await XXXERC20Contract.deploy("XXXToken", "XXX", 18);

  await myERC20Contract.deployed();

  console.log("MyERC20Contract deployed to:", myERC20Contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
