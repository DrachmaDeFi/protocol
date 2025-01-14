// SPDX-License-Identifier: MIT

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

pragma solidity ^0.7.3;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "../lib/ABDKMath64x64.sol";
import "../interfaces/IAssimilator.sol";

contract UsdtToUsdAssimilator is IAssimilator {
    using ABDKMath64x64 for int128;
    using ABDKMath64x64 for uint256;

    using SafeMath for uint256;

    IERC20 private constant usdc = IERC20(0xEA32A96608495e54156Ae48931A7c20f0dcc1a21);

    IERC20 private constant xsgd = IERC20(0xbB06DCA3AE6887fAbF931640f67cab3e3a16F4dC);

    // solhint-disable-next-line
    constructor() {}

    function getRate() public view override returns (uint256) {
        return uint256(100000000);
    }

    // takes raw xsgd amount, transfers it in, calculates corresponding numeraire amount and returns it
    function intakeRawAndGetBalance(uint256 _amount) external override returns (int128 amount_, int128 balance_) {
        bool _transferSuccess = xsgd.transferFrom(msg.sender, address(this), _amount);

        require(_transferSuccess, "Curve/XSGD-transfer-from-failed");

        uint256 _balance = xsgd.balanceOf(address(this));

        uint256 _rate = getRate();

        balance_ = ((_balance * _rate) / 1e8).divu(1e6);

        amount_ = ((_amount * _rate) / 1e8).divu(1e6);
    }

    // takes raw xsgd amount, transfers it in, calculates corresponding numeraire amount and returns it
    function intakeRaw(uint256 _amount) external override returns (int128 amount_) {
        bool _transferSuccess = xsgd.transferFrom(msg.sender, address(this), _amount);

        require(_transferSuccess, "Curve/XSGD-transfer-from-failed");

        uint256 _rate = getRate();

        amount_ = ((_amount * _rate) / 1e8).divu(1e6);
    }

    // takes a numeraire amount, calculates the raw amount of xsgd, transfers it in and returns the corresponding raw amount
    function intakeNumeraire(int128 _amount) external override returns (uint256 amount_) {
        uint256 _rate = getRate();

        amount_ = (_amount.mulu(1e6) * 1e8) / _rate;

        bool _transferSuccess = xsgd.transferFrom(msg.sender, address(this), amount_);

        require(_transferSuccess, "Curve/XSGD-transfer-from-failed");
    }

    // takes a numeraire amount, calculates the raw amount of xsgd, transfers it in and returns the corresponding raw amount
    function intakeNumeraireLPRatio(
        uint256 _baseWeight,
        uint256 _quoteWeight,
        address _addr,
        int128 _amount
    ) external override returns (uint256 amount_) {
        uint256 _xsgdBal = xsgd.balanceOf(_addr);

        if (_xsgdBal <= 0) return 0;

        // 1e6
        _xsgdBal = _xsgdBal.mul(1e18).div(_baseWeight);

        // 1e6
        uint256 _usdcBal = usdc.balanceOf(_addr).mul(1e18).div(_quoteWeight);

        // Rate is in 1e6
        uint256 _rate = _usdcBal.mul(1e6).div(_xsgdBal);

        amount_ = (_amount.mulu(1e6) * 1e6) / _rate;

        bool _transferSuccess = xsgd.transferFrom(msg.sender, address(this), amount_);

        require(_transferSuccess, "Curve/XSGD-transfer-failed");
    }

    // takes a raw amount of xsgd and transfers it out, returns numeraire value of the raw amount
    function outputRawAndGetBalance(address _dst, uint256 _amount)
        external
        override
        returns (int128 amount_, int128 balance_)
    {
        uint256 _rate = getRate();

        uint256 _xsgdAmount = ((_amount) * _rate) / 1e8;

        bool _transferSuccess = xsgd.transfer(_dst, _xsgdAmount);

        require(_transferSuccess, "Curve/XSGD-transfer-failed");

        uint256 _balance = xsgd.balanceOf(address(this));

        amount_ = _xsgdAmount.divu(1e6);

        balance_ = ((_balance * _rate) / 1e8).divu(1e6);
    }

    // takes a raw amount of xsgd and transfers it out, returns numeraire value of the raw amount
    function outputRaw(address _dst, uint256 _amount) external override returns (int128 amount_) {
        uint256 _rate = getRate();

        uint256 _xsgdAmount = (_amount * _rate) / 1e8;

        bool _transferSuccess = xsgd.transfer(_dst, _xsgdAmount);

        require(_transferSuccess, "Curve/XSGD-transfer-failed");

        amount_ = _xsgdAmount.divu(1e6);
    }

    // takes a numeraire value of xsgd, figures out the raw amount, transfers raw amount out, and returns raw amount
    function outputNumeraire(address _dst, int128 _amount) external override returns (uint256 amount_) {
        uint256 _rate = getRate();

        amount_ = (_amount.mulu(1e6) * 1e8) / _rate;

        bool _transferSuccess = xsgd.transfer(_dst, amount_);

        require(_transferSuccess, "Curve/XSGD-transfer-failed");
    }

    // takes a numeraire amount and returns the raw amount
    function viewRawAmount(int128 _amount) external view override returns (uint256 amount_) {
        uint256 _rate = getRate();

        amount_ = (_amount.mulu(1e6) * 1e8) / _rate;
    }

    function viewRawAmountLPRatio(
        uint256 _baseWeight,
        uint256 _quoteWeight,
        address _addr,
        int128 _amount
    ) external view override returns (uint256 amount_) {
        uint256 _xsgdBal = xsgd.balanceOf(_addr);

        if (_xsgdBal <= 0) return 0;

        // 1e6
        _xsgdBal = _xsgdBal.mul(1e18).div(_baseWeight);

        // 1e6
        uint256 _usdcBal = usdc.balanceOf(_addr).mul(1e18).div(_quoteWeight);

        // Rate is in 1e6
        uint256 _rate = _usdcBal.mul(1e6).div(_xsgdBal);

        amount_ = (_amount.mulu(1e6) * 1e6) / _rate;
    }

    // takes a raw amount and returns the numeraire amount
    function viewNumeraireAmount(uint256 _amount) external view override returns (int128 amount_) {
        uint256 _rate = getRate();

        amount_ = ((_amount * _rate) / 1e8).divu(1e6);
    }

    // views the numeraire value of the current balance of the reserve, in this case xsgd
    function viewNumeraireBalance(address _addr) external view override returns (int128 balance_) {
        uint256 _rate = getRate();

        uint256 _balance = xsgd.balanceOf(_addr);

        if (_balance <= 0) return ABDKMath64x64.fromUInt(0);

        balance_ = ((_balance * _rate) / 1e8).divu(1e6);
    }

    // views the numeraire value of the current balance of the reserve, in this case xsgd
    function viewNumeraireAmountAndBalance(address _addr, uint256 _amount)
        external
        view
        override
        returns (int128 amount_, int128 balance_)
    {
        uint256 _rate = getRate();

        amount_ = ((_amount * _rate) / 1e8).divu(1e6);

        uint256 _balance = xsgd.balanceOf(_addr);

        balance_ = ((_balance * _rate) / 1e8).divu(1e6);
    }

    // views the numeraire value of the current balance of the reserve, in this case xsgd
    // instead of calculating with chainlink's "rate" it'll be determined by the existing
    // token ratio
    // Mainly to protect LP from losing
    function viewNumeraireBalanceLPRatio(
        uint256 _baseWeight,
        uint256 _quoteWeight,
        address _addr
    ) external view override returns (int128 balance_) {
        uint256 _xsgdBal = xsgd.balanceOf(_addr);

        if (_xsgdBal <= 0) return ABDKMath64x64.fromUInt(0);

        uint256 _usdcBal = usdc.balanceOf(_addr).mul(1e18).div(_quoteWeight);

        // Rate is in 1e6
        uint256 _rate = _usdcBal.mul(1e18).div(_xsgdBal.mul(1e18).div(_baseWeight));

        balance_ = ((_xsgdBal * _rate) / 1e6).divu(1e18);
    }
}
