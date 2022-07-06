
const UNISWAP_V3_ENDPOINT =
  "https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-subgraph";
const ETHEREUM_BLOCK_ENDPOINT =
  "https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks";

const ACTIVE_POOL_QUERY = `
query activePools($lastId: String!, $block: Int!){
  pools(first: 1000, orderBy: id, orderDirection: asc, where: {
    id_gt: $lastId, feesUSD_gt: 0, createdAtBlockNumber_lte: $block
  }){
    id
    createdAtBlockNumber
    totalValueLockedUSD
    feesUSD
    token0 {
      symbol
    }
    token1 {
      symbol
    }
  }
}
`;
const ACTIVE_POOL_TIME_TRAVEL_QUERY = `
query activePools($lastId: String!, $block: Int!){
  pools(first: 1000, orderBy: id, orderDirection: asc, block: {number: $block}, where: {
    id_gt: $lastId,
  }){
    id
    totalValueLockedUSD
    feesUSD
    token0 {
      symbol
    }
    token1 {
      symbol
    }
  }
}
`;

const GET_NEAREST_BLOCK_QUERY = `
query nearestBlock($timestamp: Int!){
  blocks(first: 1, orderBy: timestamp, orderDirection: asc, where: {timestamp_gt: $timestamp}) {
    number
  }
}
`;

export {
    UNISWAP_V3_ENDPOINT,
    ETHEREUM_BLOCK_ENDPOINT,
    ACTIVE_POOL_QUERY,
    ACTIVE_POOL_TIME_TRAVEL_QUERY,
    GET_NEAREST_BLOCK_QUERY
}