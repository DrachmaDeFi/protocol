import hre from "hardhat";
import chalk from "chalk";
import path from "path";
import fs from "fs";

import { getAccounts, deployContract } from "./common";

const { ethers } = hre;

async function main() {
  const { user } = await getAccounts();

  console.log(chalk.blue(`>>>>>>>>>>>> Network: ${(hre.network.config as any).url} <<<<<<<<<<<<`));
  console.log(chalk.blue(`>>>>>>>>>>>> Deployer: ${user.address} <<<<<<<<<<<<`));

  const Zap = await ethers.getContractFactory("Zap");

  const zap = await deployContract({
    name: "Zap",
    deployer: user,
    factory: Zap,
    args: [],
  });

  const network = await hre.ethers.provider.getNetwork();
  const outputDir = path.join(__dirname, `${network.chainId}`);
  const outputFilePath = path.join(outputDir, `factory_deployed.json`);
  const deployments = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
  deployments.Zap = zap.address;
  fs.writeFileSync(outputFilePath, JSON.stringify(deployments, null, 2));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
