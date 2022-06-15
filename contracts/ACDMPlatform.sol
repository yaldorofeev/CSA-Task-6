//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IMyERC20Contract.sol";
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ACDMPlatform is AccessControl {
  using SafeERC20 for IMyERC20Contract;

  IMyERC20Contract ACDMToken;

  uint256 acdm_accaunt;
  uint256 acdm_spec_accaunt;

  uint256 public constant tokens = 1000000;

  bool sales_initiated = false;
  uint256 public constant initEmission = 100000 * tokens;
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
    uint startSale;
    uint startTrade;
    /* uint64 roundOver; */
    uint256 price;
    uint256 emission;
    uint256 sold;
    uint256 traded;
  }

  uint256 currentRound;

  mapping(uint256 => Round) rounds;

  struct User {
    bool signed;
    uint256 balance;
    address[refersCount] refers;
  }

  mapping(address => User) users;

  constructor(address acdmtoken_address) {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

  }

  function signIn() public {
    users[msg.sender].signed = true;
  }

  function signIn(address refer) public {
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
    currentRound = 0;
    Round storage rd = rounds[currentRound];
    rd.price = initSalePrice;
    rd.emission = initEmission;
    rd.startSale = block.timestamp;
    ACDMToken.mint(address(this), rd.emission);
  }

  function startSale() public {
    /* require(); */
    currentRound++;
    Round storage rd = rounds[currentRound];
    rd.price = nextPriceA_num * rounds[currentRound - 1].price / nextPriceA_denom
      + nextPriceB;
    rd.emission = rounds[currentRound - 1].traded / rd.price;
    rd.startSale = block.timestamp;
    ACDMToken.mint(address(this), rd.emission);
  }

  function startTrade() public {
    ACDMToken.burn(address(this), ACDMToken.balanceOf(address(this)));
  }

  function buy(uint256 _amount) public payable {
    Round storage rd = rounds[currentRound];
    require(rd.emission - rd.sold >= _amount, "Not enaught tokens");
    uint _now_ = block.timestamp;
    require(_now_ <= rd.startSale + saleDuration, "The time of sale elapsed");
    require(msg.value == _amount * tokens * rd.price,
      "Not enaught or too many ethers");
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
    ACDMToken.safeTransfer(msg.sender, _amount);
  }

  function list(address _account, uint256 _amount) public {

  }

  function unList(address _account, uint256 _amount) public {

  }

  function buyOnTrade(uint256 orderId, uint256 _amount) public payable {


  }
}
