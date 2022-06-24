import 'dotenv/config';
import { ethers } from "hardhat";

export default [
  "0xA5b4863143AA7bB2fdA0e7cE2b5aCC533EF8Eb98",
  process.env.STAKING_CONTRACT!,
  ethers.utils.parseEther("1"),
  24
];
