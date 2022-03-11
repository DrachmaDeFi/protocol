// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.7.3;

interface IOracleTwap {
    function price(address token) external view returns (uint256);

    function updateUnderlyingPrice(address token) external;
}
