import hre from "hardhat";
import chalk from "chalk";
import { getAccounts, deployContract } from "./common";

const { ethers } = hre;

const CONTRACT_NAME = "ProxyOracle";

async function main() {
  const { user } = await getAccounts();

  console.log(chalk.blue(`>>>>>>>>>>>> Network: ${(hre.network.config as any).url} <<<<<<<<<<<<`));
  console.log(chalk.blue(`>>>>>>>>>>>> Deployer: ${user.address} <<<<<<<<<<<<`));

  const Contract = await ethers.getContractFactory(CONTRACT_NAME);

  const contract = await deployContract({
    name: CONTRACT_NAME,
    deployer: user,
    factory: Contract,
    args: [],
  });

  console.info(`${CONTRACT_NAME} deployed: ${contract.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
