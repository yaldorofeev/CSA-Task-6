//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IMyERC20Contract.sol";
import "./ACDMERC20Contract.sol";
import "./IACDMPlatform.sol";
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import "hardhat/console.sol";

contract ACDMPlatform is AccessControl, IACDMPlatform {
  using SafeERC20 for IMyERC20Contract;
  using SafeERC20 for ACDMERC20Contract;
  using Counters for Counters.Counter;
  Counters.Counter private _roundIds;
  Counters.Counter private _orderIds;

  bytes32 private constant WITHDRAW = keccak256("WITHDRAW");
  address public immutable dao_address;
  address public immutable override acdmTokenAddress;

  ACDMERC20Contract ACDMToken;
  IMyERC20Contract XXXToken;
  IUniswapV2Router01 uniswap;

  uint256 public acdm_accaunt;
  uint256 public acdm_spec_accaunt;

  uint256 private constant tokens = 1000000;

  bool sales_initiated = false;
  uint256 public constant initEmission = 100000;
  uint256 public constant initSalePrice = 1 ether / initEmission;

  uint256 public constant nextPriceA_num = 103;
  uint256 public constant nextPriceA_denom = 100;
  uint256 public constant nextPriceB = 4000 gwei;

  uint public constant override refersCount = 2;
  mapping(uint256 => uint256) public override referSaleFees;
  uint public override referTradeFee = 25;

  uint public override saleDuration = 3 days;
  uint public override tradeDuration = 3 days;

  /**
   * @dev Record about round.
   * @param startSaleTime timestamp when round started.
   * @param startTradeTime timestamp when trade part of round started.
   * @param roundStarted flag is round started.
   * @param tradeInProgress flag is trade part of round started.
   * @param price price of minted tokens.
   * @param emission amount of minted tokens.
   * @param sold amount of sold tokens in sale round.
   * @param traded amount of sold tokens in trade round.
   */
  struct Round {
    uint startSaleTime;
    uint startTradeTime;
    bool roundStarted;
    bool tradeInProgress;
    uint256 price;
    uint256 emission;
    uint256 sold;
    uint256 traded;
  }

  mapping(uint256 => Round) public override rounds;

  /**
   * @dev Record about user.
   * @param signed flag is user signed.
   * @param refers from number in refers chain to refer address.
   */
  struct User {
    bool signed;
    mapping(uint256 => address) refers;
  }

  mapping(address => User) public override users;

  /**
   * @dev Record about order.
   * @param seller address of seller.
   * @param price of one token.
   * @param amount of selling tokens.
   */
  struct Order {
    address seller;
    uint256 price;
    uint256 amount;
  }

  mapping(uint256 => Order) public override orders;

  /**
   * @dev Throws if caller did not sign on.
   */
  modifier onlySigned() {
      require(users[msg.sender].signed, "You need to sign on platform");
      _;
  }

  /**
   * @dev Throws if caller is not DAO platform.
   */
  modifier onlyDAO() {
      require(msg.sender == dao_address, "Only DAO can call the function");
      _;
  }

  /**
   * @dev constructor
   * @param _dao_address address of dao contract.
   * @param _xxx_token_address address of XXXToken contract.
   * @param _uniswap_address of uniswap contract.
   */
  constructor(address _dao_address,
              address _xxx_token_address,
              address _uniswap_address) {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    require(_dao_address != address(0),
      "DAO contract address can not be zero");
    require(_xxx_token_address != address(0),
      "XXX tokens contract address can not be zero");
    require(_uniswap_address != address(0),
      "Uniswap contract address can not be zero");
    ACDMToken = new ACDMERC20Contract("ACDMToken", "ACDM", 6);
    acdmTokenAddress = address(ACDMToken);
    XXXToken = IMyERC20Contract(_xxx_token_address);
    uniswap = IUniswapV2Router01(_uniswap_address);
    dao_address = _dao_address;
    referSaleFees[0] = 50;
    referSaleFees[1] = 30;
  }

  // See IACDMPlatform-signOn
  function signOn() public virtual override {
    require(!users[msg.sender].signed, "You already signed");
    users[msg.sender].signed = true;
    emit SignOn(msg.sender, address(0));
  }

  // See IACDMPlatform-signOn
  function signOn(address _refer) public virtual override {
    require(!users[msg.sender].signed, "You already signed");
    require(users[_refer].signed, "Invalid refer address");
    users[msg.sender].signed = true;
    address first_refer = _refer;
    for (uint i = 0; i < refersCount; i++) {
      users[msg.sender].refers[i] = _refer;
      _refer = users[_refer].refers[i];
    }
    emit SignOn(msg.sender, first_refer);
  }

  // See IACDMPlatform-initSale
  function initSale() public virtual override {
    require(!sales_initiated, "Sales initiated already");
    sales_initiated = true;
    Round storage rd = rounds[_roundIds.current()];
    rd.roundStarted = true;
    rd.price = initSalePrice;
    rd.emission = initEmission;
    rd.startSaleTime = block.timestamp;
    rd.sold = 0;
    ACDMToken.mint(address(this), rd.emission * tokens);
    emit SaleStarted(_roundIds.current());
  }

  // See IACDMPlatform-startSale
  function startSale() public virtual override {
    uint256 roundId = _roundIds.current();
    Round storage rd = rounds[roundId];
    require(!rd.roundStarted, "The sale/trade round has already started");
    rd.roundStarted = true;
    rd.price = nextPriceA_num * rounds[roundId - 1].price / nextPriceA_denom
      + nextPriceB;
    rd.emission = rounds[roundId - 1].traded / rd.price;
    rd.startSaleTime = block.timestamp;
    rd.sold = 0;
    ACDMToken.mint(address(this), rd.emission * tokens);
    emit SaleStarted(_roundIds.current());
  }

  // See IACDMPlatform-buy
  function buy(uint256 _amount) public virtual override payable {
    Round storage rd = rounds[_roundIds.current()];
    require(rd.emission - rd.sold >= _amount, "Not enough tokens");
    require(block.timestamp <= rd.startSaleTime + saleDuration, "The time of sale elapsed");
    require(msg.value == _amount * rd.price,
      "Payment amount does not match the total cost");
    uint256 referPays;
    rd.sold += _amount;
    for (uint i = 0; i < refersCount; i++) {
      if (users[msg.sender].refers[i] != address(0)) {
        uint256 referPay = msg.value * referSaleFees[i] / 1000;
        payable(users[msg.sender].refers[i]).transfer(referPay);
        referPays += referPay;
      }
    }
    acdm_accaunt += msg.value - referPays;
    ACDMToken.safeTransfer(msg.sender, _amount * tokens);
    emit SoldOnSale(_roundIds.current(), msg.sender, _amount);
  }

  // See IACDMPlatform-startTrade
  function startTrade() public virtual override {
    Round storage rd = rounds[_roundIds.current()];
    require((rd.sold == rd.emission) || (block.timestamp > rd.startSaleTime + saleDuration),
      "Saling round is not over");
    require(!rd.tradeInProgress, "Trading round is already started");
    rd.startTradeTime = block.timestamp;
    rd.tradeInProgress = true;
    rd.traded = 0;
    if (rd.sold != rd.emission) {
      ACDMToken.burn(address(this), (rd.emission - rd.sold) * tokens);
    }
    emit TradeStarted(_roundIds.current());
  }

  // See IACDMPlatform-addOrder
  function addOrder(uint256 _amount, uint256 _price) public virtual
      override onlySigned {
    require(rounds[_roundIds.current()].tradeInProgress,
      "Trading round is not started");
    uint256 orderId = _orderIds.current();
    _orderIds.increment();
    Order storage or = orders[orderId];
    or.seller = msg.sender;
    or.amount = _amount;
    or.price = _price;
    ACDMToken.safeTransferFrom(msg.sender, address(this), _amount * tokens);
    emit OrderAdded(orderId);
  }

  // See IACDMPlatform-removeOrder
  function removeOrder(uint256 _orderId) public virtual override {
    Order storage or = orders[_orderId];
    require(or.seller == msg.sender, "Caller is not seller");
    uint256 amount = or.amount;
    or.amount = 0;
    ACDMToken.safeTransfer(msg.sender, amount * tokens);
    emit OrderClosed(_orderId);
  }

  // See IACDMPlatform-redeemOrder
  function redeemOrder(uint256 _orderId, uint256 _amount) public virtual override
      payable {
    Round storage rd = rounds[_roundIds.current()];
    require(rd.tradeInProgress, "Trading round is not started");
    require(block.timestamp <= rd.startTradeTime + tradeDuration,
      "Trading round is over");
    Order storage or = orders[_orderId];
    require(or.amount >= _amount, "Not enough tokens on the order");
    require(msg.value == _amount * or.price,
      "Payment amount does not match the total cost");
    uint256 referPays;
    uint256 referPay = msg.value * referTradeFee / 1000;
    rd.traded += msg.value;
    or.amount -= _amount;
    for (uint i = 0; i < refersCount; i++) {
      if (users[msg.sender].refers[i] != address(0)) {
        payable(users[msg.sender].refers[i]).transfer(referPay);
        referPays += referPay;
      } else {
        acdm_spec_accaunt += referPay;
      }
    }
    payable(or.seller).transfer(msg.value - referPay * refersCount);
    ACDMToken.safeTransfer(msg.sender, _amount * tokens);
    emit SoldOnTrade(_orderId, msg.sender, _amount);
    if (or.amount == 0) {
      emit OrderClosed(_orderId);
    }
  }

  // See IACDMPlatform-stopTrade
  function stopTrade() public virtual override {
    Round storage rd = rounds[_roundIds.current()];
    require(rd.tradeInProgress, "Trading round is not started");
    require(block.timestamp > rd.startTradeTime + tradeDuration,
      "Trading round is not over");
    rd.tradeInProgress = false;
    emit TradeStopped(_roundIds.current());
    _roundIds.increment();
  }

  // See IACDMPlatform-withdraw
  function withdraw(address _to, uint256 _amount) public virtual override {
    require(hasRole(WITHDRAW, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
      "Caller cannot withdraw");
    require(_to != address(0), "Zero address");
    require(_amount <= acdm_accaunt, "Not enough ETH on account");
    payable(_to).transfer(_amount);
  }

  // See IACDMPlatform-buyAndBurnXXXTokens
  function buyAndBurnXXXTokens() public virtual override onlyDAO returns(bool) {
    address[] memory path = new address[](2);
    path[0] = uniswap.WETH();
    path[1] = address(XXXToken);
    uint256 pay = acdm_spec_accaunt;
    acdm_spec_accaunt = 0;
    uniswap.swapExactETHForTokens{value: pay}(
      0,
      path,
      address(this),
      block.timestamp + 1800
    );
    uint256 balance = XXXToken.balanceOf(address(this));
    XXXToken.burn(address(this), balance);
    return(true);
  }

  // See IACDMPlatform-giveToOwner
  function giveToOwner() public virtual override onlyDAO returns(bool) {
    acdm_accaunt += acdm_spec_accaunt;
    acdm_spec_accaunt = 0;
    return(true);
  }

  // See IACDMPlatform-changeRefersSaleFee
  function changeRefersSaleFee(uint256[] memory _newFees)
      public virtual override onlyDAO returns(bool) {
    require(_newFees.length <= refersCount, "Invalid refer");
    for (uint i = 0; i < _newFees.length; i++) {
      referSaleFees[i] = _newFees[i];
    }
    return(true);
  }

  // See IACDMPlatform-changeRefersTradeFee
  function changeRefersTradeFee(uint256 _newFee)
      public virtual override onlyDAO returns(bool) {
    referTradeFee = _newFee;
    return(true);
  }

  // See IACDMPlatform-getCurrentRoundId
  function getCurrentRoundId() public view virtual override returns(uint256) {
    return _roundIds.current();
  }

  // See IACDMPlatform-getOrdersNumber
  function getOrdersNumber() public view virtual override returns(uint256) {
    return _orderIds.current();
  }

  // See IACDMPlatform-getWithdrawRole
  function getWithdrawRole() public view virtual override returns(bytes32) {
    return WITHDRAW;
  }

  // See IACDMPlatform-getUserRefers
  function getUserRefers(address _user, uint256 _referNumber) public
      view virtual override returns(address) {
    return users[_user].refers[_referNumber];
  }
}
