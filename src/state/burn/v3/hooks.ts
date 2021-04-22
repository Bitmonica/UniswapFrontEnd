import { BigNumber } from '@ethersproject/bignumber'
import { TokenAmount } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import { usePool } from 'data/Pools'
import { useActiveWeb3React } from 'hooks'
import { useToken } from 'hooks/Tokens'
import { useV3PositionFees } from 'hooks/useV3PositionFees'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { PositionDetails } from 'types/position'

import { AppDispatch, AppState } from '../../index'
import { selectPercent } from './actions'

export function useBurnV3State(): AppState['burnV3'] {
  return useSelector<AppState, AppState['burnV3']>((state) => state.burnV3)
}

export function useDerivedV3BurnInfo(
  position?: PositionDetails & { tokenId: BigNumber }
): {
  liquidity?: BigNumber
  liquidityValue0?: TokenAmount
  liquidityValue1?: TokenAmount
  feeValue0?: TokenAmount
  feeValue1?: TokenAmount
  error?: string
} {
  const { account } = useActiveWeb3React()
  const { percent } = useBurnV3State()

  const token0 = useToken(position?.token0)
  const token1 = useToken(position?.token1)

  const [, pool] = usePool(token0 ?? undefined, token1 ?? undefined, position?.fee)

  const partialPosition = useMemo(
    () =>
      pool && position?.liquidity && position?.tickLower && position?.tickLower
        ? new Position({
            pool,
            liquidity: position.liquidity.mul(percent).div(100).toString(),
            tickLower: position.tickLower,
            tickUpper: position.tickUpper,
          })
        : undefined,
    [pool, percent, position]
  )

  const liquidityValue0 = partialPosition?.amount0
  const liquidityValue1 = partialPosition?.amount1

  const [feeValue0, feeValue1] = useV3PositionFees(pool ?? undefined, position)

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }
  if (percent === 0) {
    error = error ?? 'Enter an percent'
  }
  return {
    liquidity: partialPosition?.liquidity ? BigNumber.from(partialPosition?.liquidity.toString()) : undefined,
    liquidityValue0,
    liquidityValue1,
    feeValue0,
    feeValue1,
    error,
  }
}

export function useBurnV3ActionHandlers(): {
  onPercentSelect: (percent: number) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onPercentSelect = useCallback(
    (percent: number) => {
      dispatch(selectPercent({ percent }))
    },
    [dispatch]
  )

  return {
    onPercentSelect,
  }
}
