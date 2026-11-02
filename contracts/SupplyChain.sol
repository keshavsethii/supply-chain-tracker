// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RoleManager.sol";

/// @title SupplyChain
/// @notice Tracks a product from manufacturer to retailer with an immutable audit trail.
contract SupplyChain {
    RoleManager public roleManager;

    enum ProductStatus { Created, InTransit, AtDistributor, AtRetailer, Sold, Recalled }

    struct Product {
        uint256 id;
        string name;
        string batchNumber;
        string origin;
        address manufacturer;
        uint256 manufacturedAt;
        uint256 expiryDate; // unix timestamp, 0 if not applicable
        ProductStatus status;
        bool exists;
    }

    struct Checkpoint {
        address actor;
        string location;
        string notes;
        ProductStatus status;
        uint256 timestamp;
    }

    uint256 private _productCounter;

    mapping(uint256 => Product) private products;
    mapping(uint256 => Checkpoint[]) private checkpoints;

    event ProductCreated(uint256 indexed productId, string name, string batchNumber, address indexed manufacturer);
    event CheckpointAdded(uint256 indexed productId, address indexed actor, string location, ProductStatus status, uint256 timestamp);
    event ProductRecalled(uint256 indexed productId, address indexed by, string reason);

    modifier productExists(uint256 productId) {
        require(products[productId].exists, "Product not found");
        _;
    }

    modifier onlyRole(RoleManager.Role role) {
        require(roleManager.hasRole(msg.sender, role), "Unauthorized role");
        _;
    }

    constructor(address roleManagerAddress) {
        require(roleManagerAddress != address(0), "Zero address");
        roleManager = RoleManager(roleManagerAddress);
    }

    // ---------------------------------------------------------------- writes

    function createProduct(
        string calldata name,
        string calldata batchNumber,
        string calldata origin,
        uint256 expiryDate
    ) external onlyRole(RoleManager.Role.Manufacturer) returns (uint256) {
        require(bytes(name).length > 0, "Name required");
        require(bytes(batchNumber).length > 0, "Batch required");

        _productCounter++;
        uint256 id = _productCounter;

        products[id] = Product({
            id: id,
            name: name,
            batchNumber: batchNumber,
            origin: origin,
            manufacturer: msg.sender,
            manufacturedAt: block.timestamp,
            expiryDate: expiryDate,
            status: ProductStatus.Created,
            exists: true
        });

        _addCheckpoint(id, origin, "Product manufactured", ProductStatus.Created);
        emit ProductCreated(id, name, batchNumber, msg.sender);
        return id;
    }

    function shipProduct(uint256 productId, string calldata location, string calldata notes)
        external
        onlyRole(RoleManager.Role.Distributor)
        productExists(productId)
    {
        ProductStatus s = products[productId].status;
        require(s == ProductStatus.Created || s == ProductStatus.AtDistributor, "Cannot ship from current status");
        products[productId].status = ProductStatus.InTransit;
        _addCheckpoint(productId, location, notes, ProductStatus.InTransit);
    }

    function receiveAtDistributor(uint256 productId, string calldata location, string calldata notes)
        external
        onlyRole(RoleManager.Role.Distributor)
        productExists(productId)
    {
        require(products[productId].status == ProductStatus.InTransit, "Must be InTransit");
        products[productId].status = ProductStatus.AtDistributor;
        _addCheckpoint(productId, location, notes, ProductStatus.AtDistributor);
    }

    function receiveAtRetailer(uint256 productId, string calldata location, string calldata notes)
        external
        onlyRole(RoleManager.Role.Retailer)
        productExists(productId)
    {
        ProductStatus s = products[productId].status;
        require(s == ProductStatus.InTransit || s == ProductStatus.AtDistributor, "Invalid prior status");
        products[productId].status = ProductStatus.AtRetailer;
        _addCheckpoint(productId, location, notes, ProductStatus.AtRetailer);
    }

    function markSold(uint256 productId, string calldata notes)
        external
        onlyRole(RoleManager.Role.Retailer)
        productExists(productId)
    {
        require(products[productId].status == ProductStatus.AtRetailer, "Must be at retailer");
        products[productId].status = ProductStatus.Sold;
        _addCheckpoint(productId, "POS", notes, ProductStatus.Sold);
    }

    function recallProduct(uint256 productId, string calldata reason)
        external
        onlyRole(RoleManager.Role.Inspector)
        productExists(productId)
    {
        require(products[productId].status != ProductStatus.Recalled, "Already recalled");
        products[productId].status = ProductStatus.Recalled;
        _addCheckpoint(productId, "N/A", reason, ProductStatus.Recalled);
        emit ProductRecalled(productId, msg.sender, reason);
    }

    // ----------------------------------------------------------------- reads

    function getProduct(uint256 productId) external view productExists(productId) returns (Product memory) {
        return products[productId];
    }

    function getCheckpoints(uint256 productId) external view productExists(productId) returns (Checkpoint[] memory) {
        return checkpoints[productId];
    }

    function getCheckpointCount(uint256 productId) external view returns (uint256) {
        return checkpoints[productId].length;
    }

    function getTotalProducts() external view returns (uint256) {
        return _productCounter;
    }

    // -------------------------------------------------------------- internal

    function _addCheckpoint(uint256 productId, string memory location, string memory notes, ProductStatus status) internal {
        checkpoints[productId].push(Checkpoint({
            actor: msg.sender,
            location: location,
            notes: notes,
            status: status,
            timestamp: block.timestamp
        }));
        emit CheckpointAdded(productId, msg.sender, location, status, block.timestamp);
    }
}
