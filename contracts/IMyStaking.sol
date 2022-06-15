//SPDX-License-Identifier: Unlicense
pragma solidity >=0.5.0;

interface IMyStaking {

  /**
   * @dev Emitted when stake done.
   *
   * `_from` is the account that made this stake.
   * '__value' is amount of lp tokens staked.
   */
  event StakeDone(address indexed _from, uint _value);

  /**
   * @dev Emitted when claim done.
   *
   * `_to` is the account that made this claim reward.
   * '__value' is amount of reward tokens transfered.
   */
  event Claim(address indexed _to, uint _value);

  /**
   * @dev Emitted when unstake done.
   *
   * `_to` is the account that made this unstake.
   * '__value' is amount of lp tokens to return.
   */
  event Unstake(address indexed _to, uint _value);

  /**
   * @dev Return the period of reward in seconds.
   */
  function rewardPeriod() external view returns (uint);

  /**
   * @dev Return the period of lock of lp tokens in seconds.
   */
  function lockPeriod() external view returns (uint);

  /**
   * @dev Return the reward procents.
   */
  function rewardProcents() external view returns (uint256);

  /**
   * @dev Mapping from staker to record about user's staking.
   */
  function stakes(address staker) external view returns (uint256, uint256, uint, uint);

  /**
   * @dev Moves `_amount` lp tokens from the caller's account to this contract.
   *
   * Emits a {StakeDone} event.
   */
  function stake(uint256 _amount) external;

  /**
   * @dev Calculate rewards of each user's stake and transfer resulted amount
   * of tokens to user. In each stake's timestamp for reward estimation is updated.
   *
   * Emits a {StakeDone} event.
   */
  function claim() external;

  /**
   * @dev Unstake lp tokens. Function become available after lock period expire.
   *
   * Emits a {Unstake} event.
   */
  function unstake(uint256 _amount) external;

}
