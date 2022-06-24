//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import './IMyStaking.sol';
import './IMyDAO.sol';

contract MyDAO is AccessControl, IMyDAO {
  using SafeERC20 for IERC20;

  // Accessing role to propose votings
  bytes32 public constant CHAIR_ROLE = keccak256("CHAIR_ROLE");

  // Accessing role to call approveUnstake func
  bytes32 public constant UNSTAKER_ROLE = keccak256("UNSTAKER_ROLE");

  // Minimum quorum
  uint256 public override minimumQuorum;

  // Period of votings in hours that assigned in constructor once
  uint256 public immutable override debatingPeriodDuration;

  // Address of voting tokens contract
  address public override voteTokenAddr;

  // Votind Id counter "can increment only"
  uint256 public override votingCount;

  // Charman counter
  uint256 public override chairManCount;

  IERC20 voteToken;
  IMyStaking staking;

  /**
   * @dev Structure oh one voting
   * @param actual is this voting actual
   * @param startTime
   * @param description description of proposal
   * @param callData data for contract call
   * @param recipient: address of calling contract
   * @param totalVotes: total amoumt of votes
   * @param agreeVotes: amount of agree votes
   * @param voters: mapping from voter's address to flag is he already voted
   * @param delegations: mapping from voter's address to address to whom delegated
   * @param delegatedTotalBalance: mapping from voter's address to all amount
   *        that was delegeted to him
   */
  struct Voting {
    bool actual;
    uint startTime;
    string description;
    bytes callData;
    address recipient;
    uint256 totalVotes;
    uint256 agreeVotes;
    mapping(address => bool) voters;
    mapping(address => address) delegations;
    mapping(address => uint256) delegatedTotalBalance;
  }

  // Unordered array of actual votings
  uint256[] private actualVotingsIds;

  // Mapping from id to votings
  mapping(uint256 => Voting) public override votings;


  /**
   * @dev constructor
   * @param _chairPerson first chairMan of the contract
   * @param _staking staking contract
   * @param _minimumQuorum initial quorum
   * @param _debatingPeriodDuration debating period. Can't be changed in futher
   *        time
   */
  constructor(address _chairPerson, IMyStaking _staking,
      uint256 _minimumQuorum, uint _debatingPeriodDuration) {

    require(_chairPerson != address(0), "Address of chair person can not be zero");
    require(_debatingPeriodDuration != 0, "Debating period can not be zero");

    _setupRole(DEFAULT_ADMIN_ROLE, address(this));
    _grantRole(CHAIR_ROLE, _chairPerson);
    _grantRole(UNSTAKER_ROLE, address(_staking));
    chairManCount = 1;

    staking = _staking;
    minimumQuorum = _minimumQuorum;
    debatingPeriodDuration = _debatingPeriodDuration;
  }

  // See IMyDAO-approveUnstake
  function approveUnstake(address _sender, uint256 _amount, uint256 _balance)
      public virtual override{
    require(hasRole(UNSTAKER_ROLE, msg.sender), "Caller is not an unstaker");
    for (uint i = 0; i < actualVotingsIds.length; i++) {
      uint256 id = actualVotingsIds[i];
      Voting storage vt = votings[id];
      require(!vt.voters[_sender],
        "Unstake operation reverted due to participating in actual voting");
      address delegator = vt.delegations[_sender];
      require(!vt.voters[delegator],
        "Unstake operation reverted due to delegating in actual voting");
      if (vt.delegations[_sender] != address(0)) {
        vt.delegations[_sender] = address(0);
        vt.delegatedTotalBalance[delegator] -= _balance;
      }
    }
  }

  // See IMyDAO-addProposal
  function addProposal(bytes memory _callData, address _recipient,
      string memory _description) public virtual override {
    require(hasRole(CHAIR_ROLE, msg.sender), "Caller is not a chairman");
    uint256 votingId = votingCount;
    votingCount += 1;
    Voting storage vt = votings[votingId];
    vt.actual = true;
    vt.startTime = block.timestamp;
    vt.description = _description;
    vt.callData = _callData;
    vt.recipient = _recipient;
    vt.totalVotes = 0;
    vt.agreeVotes = 0;
    actualVotingsIds.push(votingId);
    emit NewVotingAdded(votingId, _description);
  }

  // See IMyDAO-delegate
  function delegate(uint256 _votingId, address _to) public virtual override {
    (uint256 balance,,,)= staking.stakes(msg.sender);
    require(balance != 0, "No tokens to vote");
    (uint256 balanceTo,,,)= staking.stakes(_to);
    require(balanceTo != 0, "This account cannot vote");
    require(msg.sender != _to, "Voter cannot delegate himself");
    Voting storage vt = votings[_votingId];
    require(vt.actual, "This voting is not actual");
    require(!vt.voters[_to], "The voter already voted");
    address sideDelegated = vt.delegations[_to];
    require(!vt.voters[sideDelegated],
      "This voter delegate his votes to some voter and that voter already voted");
    require(vt.delegations[msg.sender] == address(0),
      "The votes are already delegated. Undelegate them to redelegate");
    vt.delegatedTotalBalance[_to] += balance;
    vt.delegations[msg.sender] = _to;
  }

  // See IMyDAO-unDelegate
  function unDelegate(uint256 _votingId) public virtual override {
    (uint256 balance,,,)= staking.stakes(msg.sender);
    require(balance != 0, "No tokens to vote");
    Voting storage vt = votings[_votingId];
    require(vt.actual, "This voting is not actual");
    address delegated = vt.delegations[msg.sender];
    require(delegated != address(0), "Nothing to undelegate");
    require(!vt.voters[delegated], "The voter already voted");
    vt.delegations[msg.sender] = address(0);
    vt.delegatedTotalBalance[delegated] -= balance;
  }

  // See IMyDAO-vote
  function vote(uint256 _votingId, bool _agree) public virtual override {
    (uint256 balance,,,)= staking.stakes(msg.sender);
    require(balance != 0, "No tokens to vote");
    Voting storage vt = votings[_votingId];
    require(vt.actual, "This voting is not actual");
    require(block.timestamp < vt.startTime + debatingPeriodDuration * 1 hours,
      "The time of voting is elapsed");
    require(!vt.voters[msg.sender], "The voter already voted");
    address delegator = vt.delegations[msg.sender];
    require(!vt.voters[delegator],
      "The voter delegate his votes and delegator already voted");
    vt.voters[msg.sender] = true;
    if (delegator != address(0)) {
      vt.delegatedTotalBalance[delegator] -= balance;
    }
    vt.delegations[msg.sender] = address(0);
    uint256 amount = balance;
    amount += vt.delegatedTotalBalance[msg.sender];
    if (_agree) {
      vt.totalVotes += amount;
      vt.agreeVotes += amount;
    } else {
      vt.totalVotes += amount;
    }
    emit Vote(_votingId, msg.sender, _agree, amount);
  }

  // See IMyDAO-finishProposal
  function finishProposal(uint256 _votingId) public virtual override{
    Voting storage vt = votings[_votingId];
    require(vt.actual, "This voting is not actual");
    require(block.timestamp > vt.startTime + debatingPeriodDuration * 1 hours,
      "The time of voting is not elapsed");
    vt.actual = false;
    if (vt.totalVotes >= minimumQuorum) {
      if (vt.totalVotes - vt.agreeVotes >= vt.agreeVotes) {
        emit VotingOver(_votingId, false);
      } else {
        (bool sucsess, ) = vt.recipient.call(vt.callData);
        require(sucsess, "ERROR call func");
        emit VotingOver(_votingId, true);
      }
    }
    for (uint i = 0; i < actualVotingsIds.length; i++) {
      if (actualVotingsIds[i] == _votingId) {
        actualVotingsIds[i] = actualVotingsIds[actualVotingsIds.length - 1];
        actualVotingsIds.pop();
        break;
      }
    }
  }

  /**
   * @dev Function for adding new chairman of votings. The function can be called
   * only from the contract by finishing appropriate voting.
   * In case of reentrancy by group of voters (and some chairman) the maximum
   * demadge is that the dublicated votings will remain aqtual forever.
   * @param newChairman address.
   * return true if success.
   */
  function addChairMan(address newChairman) public returns(bool) {
    require(msg.sender == address(this), "This function can be called only from voting");
    require(!hasRole(CHAIR_ROLE, newChairman));
    chairManCount += 1;
    _grantRole(CHAIR_ROLE, newChairman);
    return true;
  }

  /**
   * @dev Function for removing chairman of votings. There must be more than one
   * chairman in contract to call the function. The function can be called
   * only from the contract by finishing appropriate voting.
   * @param chairMan address for remove.
   * return true if success.
   */
  function removeChairMan(address chairMan) public returns(bool) {
    require(msg.sender == address(this), "This function can be called only from voting");
    require(chairManCount > 1, "Can not leave contract without chairman");
    chairManCount -= 1;
    _revokeRole(CHAIR_ROLE, chairMan);
    return true;
  }

  /**
   * @dev Function for reset minimum quorum. The function can be called
   * only from the contract by finishing appropriate voting.
   * @param newQuorum.
   * return true if success.
   */
  function resetMinimumQuorum(uint256 newQuorum) public returns(bool) {
    require(msg.sender == address(this), "This function can be called only from voting");
    minimumQuorum = newQuorum;
    return true;
  }

  // See IMyDAO-getActualVotingsIdsLength
  function getActualVotingsIdsLength() public view virtual override returns(uint256) {
    return actualVotingsIds.length;
  }

  // See IMyDAO-getIsVoted
  function getIsVoted(uint256 _votingId, address _voter) public view
      virtual override returns(bool) {
    return votings[_votingId].voters[_voter];
  }

  // See IMyDAO-getDelegated
  function getDelegated(uint256 _votingId, address _delegetor) public
      view virtual override returns(address) {
    return votings[_votingId].delegations[_delegetor];
  }

  // See IMyDAO-getDelegatedTotalBalance
  function getDelegatedTotalBalance(uint256 _votingId, address _delegeted)
      public view virtual override returns(uint256) {
    return votings[_votingId].delegatedTotalBalance[_delegeted];
  }

  // See IMyDAO-getActualVotingsIds
  function getActualVotingsIds() public view virtual override
      returns(uint256[] memory) {
    return actualVotingsIds;
  }
}
