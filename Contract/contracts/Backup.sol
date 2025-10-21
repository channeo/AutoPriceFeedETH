// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";  

interface IAutoPriceFeed {
    function updateETHPrice(int256 _newPrice) external;
    function ethPrice() external view returns (int256);
}

contract BackupFeed {
    IAutoPriceFeed public mainFeed;
    address public owner;
    AggregatorV3Interface internal priceFeedChainlink;
    
    // Chainlink ETH/USD address (Sepolia testnet)
    address constant CHAINLINK_ETHUSD = 0x694AA1769357215DE4FAC081bf1f309aDC325306;
    
    event BackupUpdate(int256 price);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Chi owner");
        _;
    }
    
    constructor(address _mainFeed) {
        mainFeed = IAutoPriceFeed(_mainFeed);
        priceFeedChainlink = AggregatorV3Interface(CHAINLINK_ETHUSD);
        owner = msg.sender;
    }
    
    // Lấy giá từ Chainlink và update main contract
    function updateFromChainlink() external onlyOwner {
        (
            /* uint80 roundID */,
            int256 chainlinkPrice,
            /*uint startedAt*/,
            uint256 timeStamp,
            /*uint80 answeredInRound*/
        ) = priceFeedChainlink.latestRoundData();
        require(timeStamp > 0, "Du lieu Chainlink cu");
        require(chainlinkPrice > 0, "Gia Chainlink sai");
        
        mainFeed.updateETHPrice(chainlinkPrice);  // Chainlink dùng 8 decimals, khớp với contract
        emit BackupUpdate(chainlinkPrice);
    }
    
    // Emergency update khi main backend down
    function emergencyUpdate(int256 _price) external onlyOwner {
        require(_price > 0, "Gia sai");
        mainFeed.updateETHPrice(_price);
    }
}