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

  const CurvesLib = await ethers.getContractFactory("Curves");
  const OrchestratorLib = await ethers.getContractFactory("Orchestrator");
  const ProportionalLiquidityLib = await ethers.getContractFactory("ProportionalLiquidity");
  const SwapsLib = await ethers.getContractFactory("Swaps");
  const ViewLiquidityLib = await ethers.getContractFactory("ViewLiquidity");

  const curvesLib = await deployContract({
    name: "CurvesLib",
    deployer: user,
    factory: CurvesLib,
    args: [],
  });

  const orchestratorLib = await deployContract({
    name: "OrchestratorLib",
    deployer: user,
    factory: OrchestratorLib,
    args: [],
  });

  const proportionalLiquidityLib = await deployContract({
    name: "ProportionalLiquidityLib",
    deployer: user,
    factory: ProportionalLiquidityLib,
    args: [],
  });

  const swapsLib = await deployContract({
    name: "SwapsLib",
    deployer: user,
    factory: SwapsLib,
    args: [],
  });

  const viewLiquidityLib = await deployContract({
    name: "ViewLiquidityLib",
    deployer: user,
    factory: ViewLiquidityLib,
    args: [],
  });

  const CurveFactory = await ethers.getContractFactory("CurveFactory", {
    libraries: {
      Curves: curvesLib.address,
      Orchestrator: orchestratorLib.address,
      ProportionalLiquidity: proportionalLiquidityLib.address,
      Swaps: swapsLib.address,
      ViewLiquidity: viewLiquidityLib.address,
    },
  });

  const RouterFactory = await ethers.getContractFactory("Router");

  const curveFactory = await deployContract({
    name: "CurveFactory",
    deployer: user,
    factory: CurveFactory,
    args: [],
  });

  const router = await deployContract({
    name: "Router",
    deployer: user,
    factory: RouterFactory,
    args: [curveFactory.address],
  });

  const output = {
    libraries: {
      Curves: curvesLib.address,
      Orchestrator: orchestratorLib.address,
      ProportionalLiquidity: proportionalLiquidityLib.address,
      Swaps: swapsLib.address,
      ViewLiquidity: viewLiquidityLib.address,
    },
    curveFactory: curveFactory.address,
    router: router.address,
  };

  const network = await hre.ethers.provider.getNetwork();
  const outputDir = path.join(__dirname, `${network.chainId}`);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  fs.writeFileSync(path.join(outputDir, `factory_deployed.json`), JSON.stringify(output, null, 2));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
