import hre from "hardhat";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import { parseUnits } from "@ethersproject/units";

import { getAccounts, deployContract } from "./common";
import { Curve, CurveFactory } from "../typechain";

const { ethers } = hre;

const ALPHA = parseUnits("0.8");
const BETA = parseUnits("0.5");
const MAX = parseUnits("0.15");
const EPSILON = parseUnits("0.0005");
const LAMBDA = parseUnits("0.3");

const QUOTE_CONTRACT = "UsdcToUsdAssimilator";
const BASE_CONTRACT = "UsdoToUsdAssimilator";

const QUOTE_TOKEN = "0xEA32A96608495e54156Ae48931A7c20f0dcc1a21";
const BASE_TOKEN = "0x5801D0e1C7D977D78E4890880B8E579eb4943276";

const LP_NAME = "Drachma USDC USDO LP";
const LP_SYMBOL = "Drachma LP";

async function main() {
  const network = await hre.ethers.provider.getNetwork();
  const outputDir = path.join(__dirname, `${network.chainId}`);
  const lpFilePath = path.join(outputDir, `lp.json`);
  const factoryFilePath = path.join(outputDir, `factory_deployed.json`);
  const CURVE_FACTORY = JSON.parse(fs.readFileSync(factoryFilePath, "utf-8")).curveFactory;
  const { user } = await getAccounts();

  console.log(chalk.blue(`>>>>>>>>>>>> Network: ${(hre.network.config as any).url} <<<<<<<<<<<<`));
  console.log(chalk.blue(`>>>>>>>>>>>> Deployer: ${user.address} <<<<<<<<<<<<`));
  console.log(chalk.blue(`>>>>>>>>>>>> Curve Factory: ${CURVE_FACTORY} <<<<<<<<<<<<`));

  const curveFactory = (await ethers.getContractAt("CurveFactory", CURVE_FACTORY)) as CurveFactory;

  const createAndSetParams = async (name, symbol, base, quote, baseAssim, quoteAssim) => {
    console.log("creating ", name);
    const tx = await curveFactory.newCurve(
      name,
      symbol,
      base,
      quote,
      parseUnits("0.5"),
      parseUnits("0.5"),
      baseAssim,
      quoteAssim,
    );
    console.log("tx hash", tx.hash);
    const txRecp = await tx.wait();

    const newCurveAddress = txRecp.events.filter(x => x.event === "NewCurve")[0].args.curve;
    console.log("new curve", newCurveAddress);

    const curve = (await ethers.getContractAt("Curve", newCurveAddress)) as Curve;

    console.log("setting params");
    const tx2 = await curve.setParams(ALPHA, BETA, MAX, EPSILON, LAMBDA);
    console.log("tx hash", tx2.hash);
    await tx2.wait();
    console.log("params setted");

    const tx3 = await curve.turnOffWhitelisting();
    console.log("tx hash", tx3.hash);
    await tx3.wait();
    console.log("turnOffWhitelisting done");

    console.log("==== done ====");
    return curve;
  };

  const deployments = JSON.parse(fs.readFileSync(lpFilePath, "utf-8"));

  const curve = await createAndSetParams(
    LP_NAME,
    LP_SYMBOL,
    BASE_TOKEN,
    QUOTE_TOKEN,
    deployments.assimilators[BASE_CONTRACT],
    deployments.assimilators[QUOTE_CONTRACT],
  );

  deployments.curves[LP_NAME] = curve.address;
  fs.writeFileSync(lpFilePath, JSON.stringify(deployments, null, 4));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
