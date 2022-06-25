//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


interface IACDMPlatform {

  /* *
   * @dev Emitted when anyone 'signer' signs on the platform
   * specifying his 'refer'.
   */
  event SignOn (
    address signer,
    address refer
    );

  /* *
   * @dev Emitted when sale part of round 'roundId' started.
   */
  event SaleStarted (
    uint256 roundId
  );

  /* *
   * @dev Emitted when trade part of round 'roundId' started.
   */
  event TradeStarted (
    uint256 roundId
  );

  /* *
   * @dev Emitted when trade part of round 'roundId' and round at all stopped.
   */
  event TradeStopped (
    uint256 roundId
  );

  /* *
   * @dev Emitted when 'buyer' buys 'amount' tokens in sale part
   * of round 'roundId' .
   */
  event SoldOnSale (
    uint256 roundId,
    address indexed buyer,
    uint256 amount
  );

  /* *
   * @dev Emitted when 'buyer' buys 'amount' tokens of order 'orderId'
   * in trade part of round.
   */
  event SoldOnTrade (
    uint256 orderId,
    address indexed buyer,
    uint256 amount
  );

  /* *
   * @dev Emitted when anyone add order 'orderId' in trade part of round.
   */
  event OrderAdded (
    uint256 orderId
  );

  /* *
   * @dev Emitted when anyone removes their order 'orderId' or amount
   * of token in this order becomes zero.
   */
  event OrderClosed (
    uint256 orderId
  );

  /**
   * @dev Signing on platform without refer.
   * Emits a {SignOn} event.
   */
  function signOn() external;

  /**
   * @dev Signing on platform with refer.
   * @param _refer.
   * Emits a {SignOn} event.
   */
  function signOn(address refer) external;

  /**
   * @dev Starting the very first sale.
      * Emits a {SignOn} event.
   */
  function initSale() external;

  /**
   * @dev Starting all subsequent sales.
   * Emits a {SaleStarted} event.
   */
  function startSale() external;

  /**
   * @dev Buying tokens from platform.
   * @param amount of tokens (decimals is 6).
   * Emits a {SoldOnSale} event.
   */
  function buy(uint256 amount) external payable;

  /**
   * @dev Stoping "saling" part of round and starting "trading" part.
   * Emits a {TradeStarted} event.
   */
  function startTrade() external;

  /**
   * @dev Adding order on trading. Only signed users can call the function.
   * @param amount of tokens (decimals is 6).
   * @param price of one token.
   * Emits a {OrderAdded} event.
   */
  function addOrder(uint256 amount, uint256 price) external;

  /**
   * @dev Removing order from trading. Only owner of order can remove.
   * @param orderId.
   * Emits a {OrderClosed} event.
   */
  function removeOrder(uint256 orderId) external;

  /**
   * @dev Buying tokens on trading.
   * @param orderId.
   * @param amount of tokens (decimals is 6).
   * Emits a {SoldOnTrade} event and {OrderClosed} event if all tokens were sold.
   */
  function redeemOrder(uint256 orderId, uint256 amount) external payable;

  /**
   * @dev Stopping round.
   * Emits a {TradeStopped} event.
   */
  function stopTrade() external;

  /**
   * @dev Withdrawing profit from the contract.
   * @param to - address to that witdrow made.
   * @param amount of eth.
   */
  function withdraw(address to, uint256 amount) external;

  /**
   * @dev Buying and burning XXXTokens from liquidity pool to strengthen
   *      the course of the token. This function can be called from
   *      DAO COntract only.
   */
  function buyAndBurnXXXTokens() external returns(bool);

  /**
   * @dev Giving fee to owner (transfer from spec_account to account
   *      from that owner can make withdrow). This function can be called from
   *      DAO contract only.
   */
  function giveToOwner() external returns(bool);

  /**
   * @dev Changing fee for refers in sale round. This function can be called
   *      from DAO contract only.
   * @param newFees is array of fee amounts that corresponds to refers
   *        in refers chain.
   */
  function changeRefersSaleFee(uint256[] memory newFees) external returns(bool);

  /**
   * @dev Changing fee for refers in trade round. This function can be called
   *      from DAO contract only.
   * @param newFees is fee amount. All refers in a chain get a fee of this amount.
   */
  function changeRefersTradeFee(uint256 newFee) external returns(bool);

  //Getters

  /**
   * @dev Get id of current round.
   */
  function getCurrentRoundId() external view returns(uint256);

  /**
   * @dev Get orders number.
   */
  function getOrdersNumber() external view returns(uint256);

  /**
   * @dev Get withdrow role.
   */
  function getWithdrawRole() external view returns(bytes32);

  /**
   * @dev Get refers count of a contract.
   */
  function refersCount() external view returns(uint);

  /**
   * @dev Get refers sale fee.
   * @param number of refer in chain.
   */
  function referSaleFees(uint256 number) external view returns(uint256);

  /**
   * @dev Get refers trade fee.
   */
  function referTradeFee() external view returns(uint);

  /**
   * @dev Get sale duration in seconds.
   */
  function saleDuration() external view returns(uint);

  /**
   * @dev Get trade duration in seconds.
   */
  function tradeDuration() external view returns(uint);

  /**
   * @dev Get round's information by id.
   */
  function rounds(uint256 roundId) external view returns(
    uint startSaleTime,
    uint startTradeTime,
    bool roundStarted,
    bool tradeInProgress,
    uint256 price,
    uint256 emission,
    uint256 sold,
    uint256 traded);

  /**
   * @dev Check is user signed.
   * @param user address of user.
   */
  function users(address user) external view returns(bool signed);

  /**
   * @dev Get user's refers.
   * @param user address of user.
   * @param referNumber in chain of refers.
   */
  function getUserRefers(address user, uint256 referNumber) external
    view returns(address);

  /**
   * @dev Get order.
   * @param orderId.
   */
  function orders(uint256 orderId) external view returns(
    address seller,
    uint256 price,
    uint256 amount);

  /**
   * @dev Get address of acdm tokens contract.
   */
  function acdmTokenAddress() external view returns(address);

}
