import 'dotenv/config';
import { ethers } from "hardhat";

export default [
  process.env.UNISWAP_LP_CONTRACT!,
  process.env.XXX_CONTRACT!,
  2,
  7,
  5,
  "0xA5b4863143AA7bB2fdA0e7cE2b5aCC533EF8Eb98",
  ethers.utils.parseEther("1"),
  24
];
