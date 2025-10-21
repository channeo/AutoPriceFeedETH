// backend/server.ts
import express, { Request, Response } from 'express';
import { ethers } from 'ethers';
import axios from 'axios';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { setTimeout } from 'timers/promises';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 3000;

const MULTI_UPDATER_ABI = [
  "function updatePrice(int256 _newPrice) external",
  "function priceFeed() external view returns (address)",
];

const PRICE_FEED_ABI = [
  "function ethPrice() external view returns (int256)",
  "function lastUpdate() external view returns (uint256)",
  "function isDataFresh() external view returns (bool)",
  "function getETHPrice() external view returns (int256)",
];

// Connect ethers
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '', provider);
const multiUpdater = new ethers.Contract(process.env.MULTI_UPDATER_ADDRESS || '', MULTI_UPDATER_ABI, wallet);

async function updatePrice() {
  try {
    const priceFeedAddr = await multiUpdater.priceFeed();
    const priceFeed = new ethers.Contract(priceFeedAddr, PRICE_FEED_ABI, provider);
    const currentPrice = await priceFeed.ethPrice();
    let response:any;
    for (let i = 0; i < 3; i++) {
      try {
        response = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT');
        break;
      } catch (err) {
        if (i === 2) throw err;
        console.log(`Retrying API call (${i + 1}/3)...`);
        await setTimeout(1000); 
      }
    }
    const ethUsd = parseFloat(response.data.price);
    const newPrice = Math.floor(ethUsd * 1e8);

    const diff = Math.abs(newPrice - Number(currentPrice));
    if (diff > Number(currentPrice) / 200) {
      const tx = await multiUpdater.updatePrice(newPrice, { gasLimit: 200000 });
      await tx.wait();
      console.log(`Updated price to ${newPrice}`);
    } else {
      console.log('Price change too small, skipping');
    }
  } catch (error) {
    console.error('Update error:', error);
  }
}
setInterval(updatePrice, 10000);
updatePrice();  

// API endpoint: GET /price
app.get('/price', async (req: Request, res: Response) => {
  try {
    const priceFeedAddr = await multiUpdater.priceFeed();
    const priceFeed = new ethers.Contract(priceFeedAddr, PRICE_FEED_ABI, provider);

    let price: bigint;
    try {
      price = await priceFeed.getETHPrice();  // Revert nếu stale
    } catch {
      price = await priceFeed.ethPrice();  // Fallback
    }

    const lastUpdate = await priceFeed.lastUpdate();
    const isFresh = await priceFeed.isDataFresh();

    res.json({
      ethPrice: Number(price) / 1e8,  // USD
      lastUpdate: new Date(Number(lastUpdate) * 1000).toISOString(),
      isFresh,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});