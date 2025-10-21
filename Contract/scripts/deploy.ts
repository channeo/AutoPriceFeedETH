
import dotenv from "dotenv";
import { createRequire } from "module";
import {ethers} from "ethers";
dotenv.config();
const require = createRequire(import.meta.url);
const AutoPriceFeedArtifact = require("../artifacts/contracts/AutoPriceFeed.sol/AutoPriceFeed.json");
const MultiUpdaterArtifact = require("../artifacts/contracts/IAutoPriceFeed.sol/MultiUpdater.json");

const ALCHEMY_SEPOLIA = process.env.ALCHEMY_SEPOLIA || '';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';

async function main() {
    if (!ALCHEMY_SEPOLIA || !PRIVATE_KEY) {
        console.error("❌ Missing ALCHEMY_SEPOLIA or PRIVATE_KEY in .env");
        process.exit(1);
    }

    const wallet = new ethers.Wallet(PRIVATE_KEY);
    const provider = new ethers.JsonRpcProvider(ALCHEMY_SEPOLIA);
    const signer = wallet.connect(provider);
    console.log("✅ Deployer wallet:", wallet.address);

    // Deploy AutoPriceFeed
    const factory = new ethers.ContractFactory(AutoPriceFeedArtifact.abi, AutoPriceFeedArtifact.bytecode, signer);
    console.log("⏳ Deploying AutoPriceFeed contract...");
    const autoPriceFeedTx = await factory.deploy();
    await autoPriceFeedTx.waitForDeployment();
    const autoPriceFeedAddress = await autoPriceFeedTx.getAddress();
    console.log("✅ AutoPriceFeed deployed at:", autoPriceFeedAddress);
    console.log("✅ Deploy tx hash:", autoPriceFeedTx);

    // Check owner of AutoPriceFeed
    const autoPriceFeedContract = new ethers.Contract(autoPriceFeedAddress, AutoPriceFeedArtifact.abi, signer);
    try {
        const currentOwner = await autoPriceFeedContract.owner();
        console.log("✅ Current owner of AutoPriceFeed:", currentOwner);
        if (currentOwner !== wallet.address) {
            console.error("❌ Deployer is not owner! Cannot proceed.");
            process.exit(1);
        }
    } catch (error) {
        console.error("❌ Failed to call owner():", error);
        process.exit(1);
    }

    // Deploy MultiUpdater
    const factoryMulti = new ethers.ContractFactory(MultiUpdaterArtifact.abi, MultiUpdaterArtifact.bytecode, signer);
    console.log("⏳ Deploying MultiUpdater contract...");
    const multiUpdaterTx = await factoryMulti.deploy(autoPriceFeedAddress);
    await multiUpdaterTx.waitForDeployment();
    const multiUpdaterAddress = await multiUpdaterTx.getAddress();
    console.log("✅ MultiUpdater deployed at:", multiUpdaterAddress);
    console.log("✅ Deploy tx hash:", multiUpdaterTx);

    // Set MultiUpdater as owner of AutoPriceFeed
    console.log("⏳ Setting MultiUpdater as owner of AutoPriceFeed...");
    try {
        const txOwner = await autoPriceFeedContract.changeOwner(multiUpdaterAddress, { gasLimit: 100000 });
        await txOwner.wait();
        console.log("✅ MultiUpdater set as owner of AutoPriceFeed");
    } catch (error) {
        console.error("❌ Failed to set owner:", error);
        process.exit(1);
    }

    // Check if backend is authorized
    const multiUpdaterContract = new ethers.Contract(multiUpdaterAddress, MultiUpdaterArtifact.abi, signer);
    console.log("⏳ Checking if backend is authorized:", wallet.address);
    const isAuthorized = await multiUpdaterContract.authorizedBackends(wallet.address);
    if (!isAuthorized) {
        console.log("⏳ Authorizing backend wallet:", wallet.address);
        try {
            const txBackend = await multiUpdaterContract.addBackend(wallet.address, { gasLimit: 100000 });
            await txBackend.wait();
            console.log("✅ Backend authorized");
        } catch (error) {
            console.error("❌ Failed to authorize backend:", error);
            process.exit(1);
        }
    } else {
        console.log("✅ Backend already authorized in constructor");
    }

    // Debug priceFeed
    console.log("⏳ Checking priceFeed...");
    const priceFeedAddress = await multiUpdaterContract.priceFeed();
    console.log("✅ priceFeed points to:", priceFeedAddress);
}

main().catch((error) => {
    console.error("❌ Deploy failed:", error);
    process.exitCode = 1;
});