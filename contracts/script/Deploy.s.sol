// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AlphaHub} from "../src/AlphaHub.sol";

/// @notice Deploy AlphaHub checkout contract to Robinhood Chain.
contract DeployAlphaHub is Script {
    address internal constant DEFAULT_USDG = 0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168;

    function run() external returns (AlphaHub checkout) {
        address treasury = vm.envAddress("PLATFORM_TREASURY_WALLET");
        address usdg = vm.envOr("USDG_TOKEN_ADDRESS", DEFAULT_USDG);

        uint256 usdgFee = vm.envOr("PLATFORM_FEE_USDG_UNITS", uint256(1_500_000));
        uint256 ethFeeWei = vm.envOr("PLATFORM_FEE_ETH_WEI", uint256(0));

        vm.startBroadcast(vm.envUint("DEPLOYER_PRIVATE_KEY"));

        checkout = new AlphaHub(usdg, treasury, usdgFee, ethFeeWei);

        vm.stopBroadcast();

        console2.log("AlphaHub deployed at:", address(checkout));
        console2.log("USDG token:", usdg);
        console2.log("Treasury:", treasury);
        console2.log("USDG fee (units):", usdgFee);
        console2.log("ETH fee (wei):", ethFeeWei);
    }
}
