// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title RoleManager
/// @notice Admin-controlled role registry used by the SupplyChain contract.
contract RoleManager {
    address public admin;

    enum Role { None, Manufacturer, Distributor, Retailer, Inspector }

    mapping(address => Role) private roles;

    event RoleAssigned(address indexed account, Role role);
    event RoleRevoked(address indexed account);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor() {
        admin = msg.sender;
        roles[msg.sender] = Role.Inspector; // admin can also recall products
        emit RoleAssigned(msg.sender, Role.Inspector);
    }

    function assignRole(address account, Role role) external onlyAdmin {
        require(account != address(0), "Zero address");
        require(role != Role.None, "Use revokeRole");
        roles[account] = role;
        emit RoleAssigned(account, role);
    }

    function revokeRole(address account) external onlyAdmin {
        roles[account] = Role.None;
        emit RoleRevoked(account);
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Zero address");
        emit AdminTransferred(admin, newAdmin);
        admin = newAdmin;
    }

    function getRole(address account) external view returns (Role) {
        return roles[account];
    }

    function hasRole(address account, Role role) external view returns (bool) {
        return roles[account] == role;
    }
}
