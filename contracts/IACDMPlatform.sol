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

  function signOn() external;

  function signOn(address refer) external;

  function initSale() external;

  function startSale() external;

  function buy(uint256 _amount) external payable;

  function startTrade() external;

  function addOrder(uint256 _amount, uint256 _price) external;

  function removeOrder(uint256 _orderId) external;

  function redeemOrder(uint256 _orderId, uint256 _amount) external payable;

  function stopTrade() external;

  function withdraw(address _to, uint256 _amount) external;

  function buyAndBurnXXXTokens() external returns(bool);

  function giveToOwner() external returns(bool);

  function changeRefersSaleFee(uint256[] memory _newFees) external returns(bool);

  function changeRefersTradeFee(uint256 _newFee) external returns(bool);

  //Getters

  function getCurrentRoundId() external view returns(uint256);

  function getOrdersNumber() external view returns(uint256);

  function getWithdrawRole() external view returns(bytes32);

  function refersCount() external view returns(uint);

  function referSaleFees(uint256) external view returns(uint256);

  function referTradeFee() external view returns(uint);

  function saleDuration() external view returns(uint);

  function tradeDuration() external view returns(uint);

  function rounds(uint256 roundId) external view returns(
    uint startSaleTime,
    uint startTradeTime,
    bool roundStarted,
    bool tradeInProgress,
    uint256 price,
    uint256 emission,
    uint256 sold,
    uint256 traded);

  function users(address user) external view returns(bool signed);

  function getUserRefers(address user, uint256 referNumber) external
    view returns(address);

  function orders(uint256 orderId) external view returns(
    address seller,
    uint256 price,
    uint256 amount);

  function acdmTokenAddress() external view returns(address);

}
