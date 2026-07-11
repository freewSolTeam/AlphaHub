// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AlphaHub} from "../src/AlphaHub.sol";

contract MockUSDG {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(allowance[from][msg.sender] >= amount, "allowance");
        require(balanceOf[from] >= amount, "balance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract AlphaHubTest is Test {
    AlphaHub checkout;
    MockUSDG usdg;
    address treasury = address(0xBEEF);
    address seller = address(0xCAFE);
    address buyer = address(0xB0B);

    function setUp() public {
        usdg = new MockUSDG();
        checkout = new AlphaHub(address(usdg), treasury, 1_500_000, 0.01 ether);
        vm.deal(buyer, 10 ether);
        usdg.mint(buyer, 10_000_000);
    }

    function test_payETH_splits_fee() public {
        bytes32 orderRef = keccak256("order-1");
        vm.prank(buyer);
        checkout.payETH{value: 1 ether}(orderRef, seller);

        assertTrue(checkout.paid(orderRef));
        assertEq(treasury.balance, 0.01 ether);
        assertEq(seller.balance, 0.99 ether);
    }

    function test_payUSDG_splits_fee() public {
        bytes32 orderRef = keccak256("order-2");
        vm.prank(buyer);
        usdg.approve(address(checkout), 5_000_000);
        vm.prank(buyer);
        checkout.payUSDG(orderRef, seller, 5_000_000);

        assertTrue(checkout.paid(orderRef));
        assertEq(usdg.balanceOf(treasury), 1_500_000);
        assertEq(usdg.balanceOf(seller), 3_500_000);
    }
}
