// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AutoPriceFeed {
    int256 public ethPrice;        // Giá ETH/USD (8 số thập phân, ví dụ 200000000000 cho $2000)
    uint256 public lastUpdate;     // Thời gian update cuối
    address public owner;          // Chủ sở hữu
    
    // Events để theo dõi
    event PriceUpdated(int256 newPrice, uint256 timestamp);
    
    // Chỉ owner mới update được
    modifier onlyOwner() {
        require(msg.sender == owner, "Chi owner moi duoc update");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        ethPrice = 200000000000;  // Khởi tạo giá ban đầu $2000 * 1e8 để tránh error chia 0
        lastUpdate = block.timestamp;
    }
    
    // Backend gọi hàm này để update giá
    function updateETHPrice(int256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Gia khong hop le");
        
        ethPrice = _newPrice;
        lastUpdate = block.timestamp;
        
        emit PriceUpdated(_newPrice, block.timestamp);
    }
    
    // Các app khác đọc giá từ đây
    function getETHPrice() external view returns (int256) {
        require(block.timestamp - lastUpdate < 1 hours, "Du lieu cu");
        return ethPrice;
    }
    
    // Để khớp interface
    function ethPrices() external view returns (int256) {
        return ethPrice;
    }
    
    // Kiểm tra dữ liệu có cũ không
    function isDataFresh() external view returns (bool) {
        return block.timestamp - lastUpdate < 1 hours;
    }
    
    // Đổi owner (nếu cần)
    function changeOwner(address _newOwner) external onlyOwner {
        owner = _newOwner;
    }
}