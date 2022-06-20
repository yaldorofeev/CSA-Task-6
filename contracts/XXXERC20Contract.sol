//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IMyERC20Contract.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract XXXERC20Contract is ERC20, AccessControl, IMyERC20Contract {

    bytes32 private constant MINTER = keccak256("MINTER");

    bytes32 private constant BURNER = keccak256("BURNER");

    uint8 private immutable decimals_;

    constructor(
                string memory tokenName,
                string memory tokenSymbol,
                uint8 _decimals
    ) ERC20(tokenName, tokenSymbol) {
      _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
      decimals_ = _decimals;
    }

    function mint(address _account, uint256 _amount) public virtual override
        returns (bool success)
    {
      require(hasRole(MINTER, msg.sender), "Caller is not a minter");
      _mint(_account, _amount);
      return true;
    }

    function burn(address _account, uint256 _amount) public virtual override
      returns (bool success)
    {
      require((msg.sender == _account)|| hasRole(BURNER, msg.sender), "Caller is not a burner");
      _burn(_account, _amount);
      return true;
    }

    function decimals() public view virtual override returns (uint8) {
      return decimals_;
    }

    function minter() public view virtual override returns (bytes32) {
      return MINTER;
    }

    function burner() public view virtual override returns (bytes32) {
      return BURNER;
    }
}
