//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";

interface IMyERC20Contract is IERC20, IAccessControl {

  /**
   * @dev Return the minter role.
   */
  function minter() external view returns (bytes32);

  /**
   * @dev Return the burner role.
   */
  function burner() external view returns (bytes32);

  /**
   * @dev Mint tokens. Onle users that have "MINTER" role can call the function.
   *
   * Emits a {Transfer} event with zero "from" address.
   */
  function mint(address _account, uint256 _amount) external returns (bool success);

  /**
   * @dev Burn tokens. Onle users that have "MINTER" role can call the function.
   *
   * Emits a {Transfer} event with zero "to" address.
   */
  function burn(address _account, uint256 _amount) external returns (bool success);
}
