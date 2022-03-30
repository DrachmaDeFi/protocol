import hre from "hardhat";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import { getAccounts, deployContract } from "./common";
const { ethers } = hre;

const ASSIMILATOR_CONTRACT = "MetisToUsdAssimilator";

async function main() {
  const { user } = await getAccounts();

  console.log(chalk.blue(`>>>>>>>>>>>> Network: ${(hre.network.config as any).url} <<<<<<<<<<<<`));
  console.log(chalk.blue(`>>>>>>>>>>>> Deployer: ${user.address} <<<<<<<<<<<<`));

  const Assm = await ethers.getContractFactory(ASSIMILATOR_CONTRACT);

  const assm = await deployContract({
    name: ASSIMILATOR_CONTRACT,
    deployer: user,
    factory: Assm,
    args: [],
  });

  const network = await hre.ethers.provider.getNetwork();
  const outputDir = path.join(__dirname, `${network.chainId}`);
  const outputFilePath = path.join(outputDir, `lp.json`);
  if (!fs.existsSync(outputFilePath)) {
    fs.writeFileSync(outputFilePath, JSON.stringify({ assimilators: {}, curves: {} }, null, 4));
  }

  const deployments = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
  deployments.assimilators[ASSIMILATOR_CONTRACT] = assm.address;
  fs.writeFileSync(outputFilePath, JSON.stringify(deployments, null, 4));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
