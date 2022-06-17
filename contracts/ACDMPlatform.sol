//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IMyERC20Contract.sol";
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@unisawap/v2-periphery/interfaces/IUniswapV2Router01.sol"

contract ACDMPlatform is AccessControl {
  using SafeERC20 for IMyERC20Contract;
  using Counters for Counters.Counter;
  Counters.Counter private _roundIds;
  Counters.Counter private _orderIds;

  bytes32 private constant DAO = keccak256("DAO");
  address public immutable dao_address;
  address public immutable xxx_token_address;
  address public immutable uniswap_address;

  IMyERC20Contract ACDMToken;
  IMyERC20Contract XXXToken;

  uint256 acdm_accaunt;
  uint256 acdm_spec_accaunt;

  uint256 public constant tokens = 1000000;

  bool sales_initiated = false;
  uint256 public constant initEmission = 100000;
  uint256 public constant initSalePrice = 1 ether / initEmission;

  uint256 public constant nextPriceA_num = 103;
  uint256 public constant nextPriceA_denom = 100;
  uint256 public constant nextPriceB = 4000 gwei;

  uint[2] referSaleCommissions = (50, 30);
  uint referTradeCommissions = 25;


  uint saleDuration;
  uint tradeDuration;

  uint public constant refersCount = 2;

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

  mapping(uint256 => Round) rounds;

  struct User {
    bool signed;
    uint256 balance;
    address[refersCount] refers;
  }

  mapping(address => User) public users;

  struct Order {
    address seller;
    uint256 price;
    uint256 amount;
  }

  mapping(uint256 => Order) public orders;

  constructor(address _acdmtoken_address,
              address _dao_address) {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    dao_address = _dao_address;
  }

  /**
   * @dev Throws if caller did not sign on.
   */
  modifier onlySigned() {
      require(users[msg.sender].signed, "You need to sign on platform");
      _;
  }

  /**
   * @dev Throws if caller did not sign on.
   */
  modifier onlyDAO() {
      require(msg.sender == dao_address, "Only DAO can call the function");
      _;
  }

  function signOn() public {
    users[msg.sender].signed = true;
  }

  function signOn(address refer) public {
    require(!users[msg.sender].signed, "You already signed");
    require(users[refer].signed, "Invalid refer address");
    users[msg.sender].signed = true;
    for (uint i = 0; i < refersCount; i++) {
      users[msg.sender].refers[i] = refer;
      refer = users[refer].refers[i];
    }
  }

  function initSale() public {
    require(!sales_initiated, "Sales initiated already");
    sales_initiated = true;
    Round storage rd = rounds[_roundIds.current()];
    rd.roundStarted = true;
    rd.price = initSalePrice;
    rd.emission = initEmission;
    rd.startSale = block.timestamp;
    ACDMToken.mint(address(this), rd.emission * tokens);
  }

  function startSale() public {
    uint256 roundId = _roundIds.current();
    Round storage rd = rounds[roundId];
    require(!rd.roundStarted, "The sale/trade round has already started");
    rd.roundStarted = true;
    rd.price = nextPriceA_num * rounds[roundId - 1].price / nextPriceA_denom
      + nextPriceB;
    rd.emission = rounds[roundId - 1].traded / rd.price;
    rd.startSale = block.timestamp;
    ACDMToken.mint(address(this), rd.emission * tokens);
  }

  function buy(uint256 _amount) public payable onlySigned {
    Round storage rd = rounds[_roundIds.current()];
    require(rd.emission - rd.sold >= _amount, "Not enough tokens");
    require(block.timestamp <= rd.startSale + saleDuration, "The time of sale elapsed");
    require(msg.value == _amount * rd.price,
      "Payment amount does not match the total cost");
    uint256 referPays;
    rd.sold += _amount;
    for (uint i = 0; i < refersCount; i++) {
      if (users[msg.sender].refers[i] != address(0) {
        uint256 referPay = msg.value * referSaleCommissions / 1000;
        payable(users[msg.sender].refers[i]).transfer(referPay);
        referPays += referPay;
      }
    }
    acdm_accaunt += msg.value - referPays;
    ACDMToken.safeTransfer(msg.sender, _amount * tokens);
  }

  function startTrade() public {
    Round storage rd = rounds[_roundIds.current()];
    require((rd.sold == rd.emission) || (block.timestamp > rd.startSale + saleDuration),
      "Saling round is not over");
    require(!rd.tradeInProgress, "Trading round is already started");
    rd.startTrade = block.timestamp;
    rd.tradeInProgress = true;
    if (rd.sold != rd.emission) {
      ACDMToken.burn(address(this), (rd.emission - rd.sold) * tokens);
    }
  }

  function addOrder(uint256 _amount, uint256 _price) public onlySigned {
    require(rounds[_roundIds.current()].tradeInProgress,
      "Trading round is not started");
    uint256 orderId = _orderId.current();
    _orderId.increment();
    Order storage or = orders[orderId];
    or.seller = msg.sender;
    or.amount = _amount;
    or.price = _price;
    ACDMToken.safeTransferFrom(msg.sender, address(this), _amount * tokens);
  }

  function removeOrder(uint256 _orderId) public {
    Order storage or = orders[_orderId];
    require(or.seller == msg.sender, "Caller is not seller");
    ACDMToken.safeTransfer(msg.sender, or.amount * tokens);
  }

  function redeemOrder(uint256 _orderId, uint256 _amount) public
      payable onlySigned {
    Round storage rd = rounds[_roundIds.current()];
    require(rd.tradeInProgress, "Trading round is not started");
    Order storage or = orders[_orderId];
    require(or.amount >= _amount, "Not enough tokens on the order");
    require(msg.value == _amount * or.price,
      "Payment amount does not match the total cost");
    uint256 referPays;
    uint256 referPay = msg.value * referTradeCommissions / 1000;
    rd.traded += _amount;
    for (uint i = 0; i < refersCount; i++) {
      if (users[msg.sender].refers[i] != address(0) {
        payable(users[msg.sender].refers[i]).transfer(referPay);
        referPays += referPay;
      } else {
        acdm_spec_accaunt += referPay;
      }
    }
    payable(od.seller).transfer(msg.value - referPay * refersCount);
    ACDMToken.safeTransfer(msg.sender, _amount * tokens);
  }

  function stopTrade() public {
    Round storage rd = rounds[_roundIds.current()];
    require(rd.tradeInProgress, "Trading round is not started");
    require(block.timestamp > rd.startTrade + tradeDuration,
      "Trading round is not over");
    rd.tradeInProgress = false;
    _roundIds.increment();
  }

  function withdraw(address _to, uint256 _amount) public {
    require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not an admin");
    require(_to != address(0), "Zero address");
    require(_amount <= acdm_accaunt, "Not enough ETH on account");
    payable(_to).transfer(referPay);
  }

  function buyAndBurnXXXTokens() public onlyDAO {
    address[2] path;
    path[0] = uniswap.WETH();
    path[1] = xxx_token_address;
    uniswap.swapExactETHForTokens{value: acdm_spec_accaunt}(
            0,
            path,
            address(this),
            block.timestamp + 1800
        );
    uint256 balance = XXXToken.balanceOf(address(this));
    XXXToken.burn(address(this), balance);
  }

  function giveToOwner() public onlyDAO {
    acdm_accaunt += acdm_spec_accaunt;
    acdm_spec_accaunt = 0;
  }

  function changeRefersReward(uint256 _referInSec, uint256 _newReward)
      public onlyDAO {
    require(_referInSec < refersCount, "Invalid refer");
    referSaleCommissions[referInSec] = _newReward;
  }

  function getCurrentRoundId() public view returns(uint256) {
    return _roundIds.current();
  }

  function getOrdersNumber() public view returns(uint256) {
    return _orderId.current();
  }
}
