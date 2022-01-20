//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IDO is ERC721Enumerable, Ownable {
    uint256 private _currentTokenId;
    uint256 public idoDuration;
    uint256 private _fee = 3e18;
    uint256 private _feeIdo = 2e18;
    mapping(address => bool) private _whiteList;

    event SetIdoTime(uint256 indexed value);
    event Minted(address receiver, uint256 indexed tokenId, uint256 mintedAt);

    constructor(string memory name, string memory symbol)
        ERC721(name, symbol)
    {}

    function mintToken() external payable {
        uint256 fee = _getFee();
        if (fee == _feeIdo && !_whiteList[msg.sender]) revert("address not in whiteList");
        require(msg.value >= fee, "not enough value");
        _safeMint(msg.sender, ++_currentTokenId);
        payable(owner()).transfer(msg.value);
        emit Minted(msg.sender, _currentTokenId, block.timestamp);
    }

    function _getFee() private returns (uint256) {
        return block.timestamp < idoDuration? _feeIdo : _fee;
    }

    function setIdoTime(uint256 value) external onlyOwner {
        idoDuration = block.timestamp + value;
        emit SetIdoTime(value);
    }

    function setWhiteList(address[] memory whiteList) external onlyOwner {
        require(whiteList.length > 0, "Invalid Whitelist");
        for (uint256 i = 0; i < whiteList.length; i++) {
            _whiteList[whiteList[i]] = true;
        }
    }

    function removeOutOfWhitelist(address[] memory _addresses) external onlyOwner
    {
        require(_addresses.length > 0, "Invalid remove addresses");
        for (uint256 i = 0; i < _addresses.length; i++) {
            _whiteList[_addresses[i]] = false;
        }
    }
}
