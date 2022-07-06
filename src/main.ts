import axios from "axios";
import moment from "moment";

import {
  UNISWAP_V3_ENDPOINT,
  ETHEREUM_BLOCK_ENDPOINT,
  ACTIVE_POOL_QUERY,
  ACTIVE_POOL_TIME_TRAVEL_QUERY,
  GET_NEAREST_BLOCK_QUERY,
} from "./constants";

type PoolData = {
  startTvl: number;
  endTvl: number;
  startFees: number; 
  endFees: number;
  pairName: string;
};

const poolsData: { [key: string]: PoolData } = {};

// Returns the nearest block number after the timestamp
async function getNearestBlock(timestamp: number) {
  let resp = await axios.post(ETHEREUM_BLOCK_ENDPOINT, {
    query: GET_NEAREST_BLOCK_QUERY,
    variables: { timestamp: timestamp },
  });
  if (!resp.data.data.blocks || resp.data.data.blocks.length == 0) {
    throw new Error("unexpected error or no blocks after the given timestamp");
  }
  const nearestBlock = resp.data.data.blocks[0];
  return parseInt(nearestBlock.number);
}

function roiToApr(roi: number, period: number){
  return formatFloat(roi * 365 / period)
}

function formatFloat(f: number) {
  return Number(f).toLocaleString(undefined, {
    style: "percent",
    minimumFractionDigits: 2,
  })
}

async function main() {
  const args = process.argv.slice(2);
  const durationDays = parseInt(args[0]);

  const startDate = moment()
    .utc()
    .subtract(durationDays, "days")
    .startOf("day");

  let nearestBlock = await getNearestBlock(startDate.unix());
  if (nearestBlock < 12369620) {
    throw new Error("uniswap v3 subgraph only has data starting at block number 12369620, try a new period")
  }
  let lastId = "0x0";

  // get current pools data
  while (true) {
    const resp = await axios.post(UNISWAP_V3_ENDPOINT, {
      query: ACTIVE_POOL_QUERY,
      variables: { lastId: lastId, block: nearestBlock },
    });
    const activePools = resp.data.data.pools;
    if (activePools.length == 0) {
      break;
    }
    activePools.forEach((pool: any) => {
      poolsData[pool.id] = {
        startTvl: 0,
        endTvl: pool.totalValueLockedUSD,
        startFees: 0,
        endFees: pool.feesUSD,
        pairName: `${pool.token0.symbol}-${pool.token1.symbol}`,
      };
    });

    lastId = activePools[activePools.length - 1].id;
  }

  // get historical pools data
  lastId = "0x0";
  while (true) {
    const resp = await axios.post(UNISWAP_V3_ENDPOINT, {
      query: ACTIVE_POOL_TIME_TRAVEL_QUERY,
      variables: { lastId: lastId, block: nearestBlock },
    });
    const activePools = resp.data.data.pools;
    if (activePools.length == 0) {
      break;
    }
    activePools.forEach((pool: any) => {
      if (pool.id in poolsData) {
        poolsData[pool.id].startTvl = pool.totalValueLockedUSD;
        poolsData[pool.id].startFees = pool.feesUSD;
      }
    });
    lastId = activePools[activePools.length - 1].id;
  }

  // output most profitable pool
  let maxRoiSeen = 0,
    maxRoiPoolAddress = "";
  Object.entries(poolsData).forEach(([poolId, poolData]) => {
    let averageTVL = (poolData.startTvl + poolData.endTvl) / 2;
    let roi = (poolData.endFees - poolData.startFees) / averageTVL;
    if (roi > maxRoiSeen) {
      maxRoiSeen = roi;
      maxRoiPoolAddress = poolId;
    }
  });
  console.log(`
  The most profitable pool during the last ${durationDays} days is ${maxRoiPoolAddress} (${
    poolsData[maxRoiPoolAddress].pairName
  }),
  with estimated ROI of ${formatFloat(maxRoiSeen)} (${roiToApr(maxRoiSeen, durationDays)} APR)
  `);
}

try {
  main();
} catch (e) {
  console.error(e)
}

