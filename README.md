# How to run
- Install dependencies
```
npm install
```
- build and run
```
npm run build
npm start {days}
```

# Glossary
- `D0` first day of the period
- `D1` last day of the period (In this case the current date)

# Equation of Profit
- ROI of a pool = fees collected through the period / average tvl during the period

- Fees collected through the period = `pool.feesUSD` at D1 - `pool.feesUSD` at D0

- Average tvl during the period = (`pool.tvlUSD` at D1 + `pool.tvlUSD` at D0) / 2

# Assumptions
I took the following assumptions during my calculation of profit to optimize the performance (I will explain how to get a more accurate profit in real world situation)

1. Profits are accumulative daily realized profit as if a person were to sold the fees collected at the end of each day.

2. I took the mean of D0 and D1's TVL to get an estimate average tvl of the pool during the given period

3. Pools that has not been created at D0 are filtered out (We cannot batch-get these new pools' data using time travel query to get tvl at d0 since they don't exist yet. We will have to exame each pool's `createdAtBlockNumber` and do one time travel query for every new pool and this increases qps as days get bigger )

4. APR is the theoretical rate if the daily profit were to be maintained throughout the year and the person's relative share of the LP stays the same


# How to calculate profit in real world situation
1. **Daily realized profit**

The daily yield you get is propotional to the percentage of shares you put in the pool, and 
because other people will add or withdraw liquidity from the pool all the time, we need to calculate your share of the pool everyday. 

*Daily share* = *Initial liquidity provided* / *liquidity of the pool on that day*

*Daily realized profit* = *Daily share* * *feesUSD* from `poolDayData`

2. **Hodl profit**

This is the profit you get if you were holding the fees til the end (hodling).

*Hodl profit* = *fees collected*  * *share of pool on last day*

*Fees collected* = *Toal volumn traded of tokenA* * *tokenA price on last day* * *feeTier* + *Toal volumn traded of tokenB* * *tokenB price on last day* * *feeTier*

*Share of pool on last day* = *Initial liquidity provided* / *liquidity of the pool on last day*

we can caculate the total volumns of two tokens during the given period (current total volumn - volumn from time travel query) * `feeTier` of that pool) * currect price of two tokens

3. **Impermanent Loss**

Explained [here](https://www.binance.com/en/support/faq/7b6256ceba3840dcaecdd922675ec0c3)
Unless you provide LP that contains two stablecoins, impermanent loss could happen at the end of investment peroid , which will affect the value of your initial LP (the cost)
So no matter what ROI method we use, to get the most accurate yield, adjusting it by the impermanent loss will be reasonable