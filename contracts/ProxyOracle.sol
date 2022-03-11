// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IOracleTwap.sol";

contract ProxyOracle is Ownable, IOracleTwap {
    event NewOracle(address oldOracle, address newOracle);

    IOracleTwap public oracle;

    function updateUnderlyingPrice(address token) external override {
        oracle.updateUnderlyingPrice(token);
    }

    function price(address token) external view override returns (uint256) {
        return oracle.price(token);
    }

    function setOracle(address _oracle) external onlyOwner {
        emit NewOracle(address(oracle), _oracle);
        oracle = IOracleTwap(_oracle);
    }
}
