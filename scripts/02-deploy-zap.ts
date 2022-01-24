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
    name: "zap",
    deployer: user,
    factory: Zap,
    args: [],
  });

  const output = {
    zap: zap.address,
  };

  const network = await hre.ethers.provider.getNetwork();
  const outputDir = path.join(__dirname, `${network.chainId}`);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  fs.writeFileSync(path.join(outputDir, `zap_deployed.json`), JSON.stringify(output, null, 4));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
