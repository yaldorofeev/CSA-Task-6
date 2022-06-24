import 'dotenv/config';
import { ethers } from "hardhat";

export default [
  process.env.DAO_CONTRACT!,
  process.env.XXX_CONTRACT!,
  process.env.UNISWAP_CONTRACT!
];
