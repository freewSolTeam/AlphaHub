// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal ERC-20 interface for USDG transfers.
interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title AlphaHub
/// @notice Splits buyer payments on Robinhood Chain between operator and platform treasury.
/// @dev Buyers call `payETH` or `payUSDG` with an order reference from the AlphaHub API.
///      Each orderRef can only be settled once. Gross amount must cover the platform fee.
///
/// On-chain config (all `public`, readable by anyone / Blockscout):
///   - `usdgToken`  — USDG ERC-20 address (immutable)
///   - `treasury`   — receives platform fee (USDG + ETH)
///   - `usdgFee`    — platform fee in USDG base units (6 decimals)
///   - `ethFeeWei`  — platform fee in wei for ETH checkouts
///   - `owner`      — can call `setFees` / `setTreasury`
contract AlphaHub {
    uint8 public constant PAYMENT_ETH = 0;
    uint8 public constant PAYMENT_USDG = 1;

    address public immutable usdgToken;
    address public owner;
    address public treasury;

    /// @notice Platform fee in USDG base units (6 decimals). Default deploy: 1.5 USDG = 1_500_000.
    uint256 public usdgFee;
    /// @notice Platform fee in wei for native ETH checkouts.
    uint256 public ethFeeWei;

    mapping(bytes32 => bool) public paid;

    event PaymentSettled(
        bytes32 indexed orderRef,
        address indexed buyer,
        address indexed seller,
        uint8 paymentType,
        uint256 grossAmount,
        uint256 platformFee,
        uint256 sellerAmount
    );

    event TreasuryUpdated(address treasury);
    event FeesUpdated(uint256 usdgFee, uint256 ethFeeWei);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error AlreadyPaid();
    error AmountTooLow();
    error TransferFailed();
    error Unauthorized();
    error ZeroAddress();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address usdgToken_, address treasury_, uint256 usdgFee_, uint256 ethFeeWei_) {
        if (usdgToken_ == address(0) || treasury_ == address(0)) revert ZeroAddress();
        usdgToken = usdgToken_;
        treasury = treasury_;
        usdgFee = usdgFee_;
        ethFeeWei = ethFeeWei_;
        owner = msg.sender;
    }

    /// @notice Pay a listing order with native ETH. `msg.value` is the gross checkout amount.
    function payETH(bytes32 orderRef, address seller) external payable {
        if (paid[orderRef]) revert AlreadyPaid();
        if (seller == address(0)) revert ZeroAddress();
        if (msg.value <= ethFeeWei) revert AmountTooLow();

        uint256 sellerAmount = msg.value - ethFeeWei;
        paid[orderRef] = true;

        _sendETH(treasury, ethFeeWei);
        _sendETH(seller, sellerAmount);

        emit PaymentSettled(orderRef, msg.sender, seller, PAYMENT_ETH, msg.value, ethFeeWei, sellerAmount);
    }

    /// @notice Pay a listing order with USDG. Buyer must approve this contract for `grossAmount` first.
    function payUSDG(bytes32 orderRef, address seller, uint256 grossAmount) external {
        if (paid[orderRef]) revert AlreadyPaid();
        if (seller == address(0)) revert ZeroAddress();
        if (grossAmount <= usdgFee) revert AmountTooLow();

        uint256 sellerAmount = grossAmount - usdgFee;
        paid[orderRef] = true;

        IERC20 token = IERC20(usdgToken);
        if (!token.transferFrom(msg.sender, treasury, usdgFee)) revert TransferFailed();
        if (!token.transferFrom(msg.sender, seller, sellerAmount)) revert TransferFailed();

        emit PaymentSettled(orderRef, msg.sender, seller, PAYMENT_USDG, grossAmount, usdgFee, sellerAmount);
    }

    function setTreasury(address treasury_) external onlyOwner {
        if (treasury_ == address(0)) revert ZeroAddress();
        treasury = treasury_;
        emit TreasuryUpdated(treasury_);
    }

    function setFees(uint256 usdgFee_, uint256 ethFeeWei_) external onlyOwner {
        usdgFee = usdgFee_;
        ethFeeWei = ethFeeWei_;
        emit FeesUpdated(usdgFee_, ethFeeWei_);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address previous = owner;
        owner = newOwner;
        emit OwnershipTransferred(previous, newOwner);
    }

    function _sendETH(address to, uint256 amount) private {
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
