//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


interface IMyDAO  {
  /* *
   * @dev Emitted when voting with 'votingId' finished with some 'result'.
   */
  event NewVotingAdded(
    uint256 votingId,
    string description
  );

  /* *
   * @dev Emitted when anybody voted in voting 'votingId' for 'result' with
   * 'amount' of votes.
   */
  event Vote(
    uint256 votingId,
    address voter,
    bool result,
    uint256 amount
  );

  /* *
   * @dev Emitted when voting with 'votingId' finished with some 'result'.
   */
  event VotingOver(
    uint256 votingId,
    bool result
  );


  /**
   * @dev Function for approving unstaking of staking contract.
   * @param _sender: address of unstaking user.
   * @param _amount: unstaked amount.
   * @param _balance staked balance of user.
   */
  function approveUnstake(address _sender, uint256 _amount, uint256 _balance) external;

  /**
   * @dev Only chairmans can propose votings.
   * @param _callData: data for call an external contract.
   * @param _recipient: address of an external contract.
   * @param _description of call.
   * emit NewVotingAdded.
   */
  function addProposal(bytes memory _callData, address _recipient,
      string memory _description) external;

  /**
   * @dev Delegate votes to some person. That person should have voting tokens.
   * @param _votingId of voting for votes delegated.
   * @param _to: address to whom delegated.
   */
  function delegate(uint256 _votingId, address _to) external;

  /**
   * @dev Undelegate votes.
   * @param _votingId of voting for votes undelegated.
   */
  function unDelegate(uint256 _votingId) external;

  /**
   * @dev Vote for proposal.
   * @param _votingId of voting.
   * @param _agree: agreement or disagreement for a proposal.
   */
  function vote(uint256 _votingId, bool _agree) external;

  /**
   * @dev Finish voting for proposal. Anybody can call this function.
   * @param _votingId of voting.
   * emit Vote
   */
  function finishProposal(uint256 _votingId) external;

  //Getters

  // Minimum quorum
  /**
   * @dev Getter for actual votings array length.
   */
  function minimumQuorum() external view returns(uint256);

  // Period of votings in hours that assigned in constructor once
  /**
   * @dev Getter for actual votings array length.
   */
  function debatingPeriodDuration() external view returns(uint256);

  // Address of voting tokens contract
  /**
   * @dev Getter for actual votings array length.
   */
  function voteTokenAddr() external view returns(address);

  // Votind Id number
  /**
   * @dev Getter for actual votings array length.
   */
  function votingCount() external view returns(uint256);

  // Charman number
  /**
   * @dev Getter for actual votings array length
   */
  function chairManCount() external view returns(uint256);

  // Unordered array of actual votings
  /**
   * @dev Getter for actual votings array length
   */
  function getActualVotingsIds() external view returns(uint256[] memory);

  // Get votings common parametrs by id
  /**
   * @dev Getter for actual votings array length
   */
  function votings(uint256 votingId) external view
    returns(bool actual,
            uint startTime,
            string memory description,
            bytes memory callData,
            address recipient,
            uint256 totalVotes,
            uint256 agreeVotes);

  /**
   * @dev Getter for actual votings array length
   */
  function getIsVoted(uint256 _votingId, address _voter) external view
    returns(bool);

  /**
   * @dev Getter for actual votings array length
   */
  function getDelegated(uint256 _votingId, address _delegetor) external
    view returns(address);

  /**
   * @dev Getter for actual votings array length
   */
  function getDelegatedTotalBalance(uint256 _votingId, address _delegeted)
      external view returns(uint256);

  /**
   * @dev Getter for actual votings array length
   */
  function getActualVotingsIdsLength() external view returns(uint256);
}
