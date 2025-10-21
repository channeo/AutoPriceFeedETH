pragma solidity ^0.8.20;

interface IAutoPriceFeed {
    function updateETHPrice(int256 _newPrice) external;
    function getETHPrice() external view returns (int256);
    function ethPrice() external view returns (int256);
    function lastUpdate() external view returns (uint256);
    function isDataFresh() external view returns (bool);
}

contract MultiUpdater {
    IAutoPriceFeed public priceFeed;
    address public owner;
    mapping(address => bool) public authorizedBackends;
    uint256 public backendCount;
    
    event BackendAdded(address backend);
    event BackendRemoved(address backend);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Chi owner");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedBackends[msg.sender], "Khong co quyen");
        _;
    }
    
    constructor(address _priceFeed) {
        priceFeed = IAutoPriceFeed(_priceFeed);
        owner = msg.sender;
        // Backend đầu tiên
        authorizedBackends[msg.sender] = true;
        backendCount = 1;
    }
    
    // Backend gọi hàm này để update
    function updatePrice(int256 _newPrice) external onlyAuthorized {
        require(_newPrice > 0, "Gia sai");
        
        int256 currentPrice = priceFeed.ethPrice();
        if (currentPrice <= 0) {
            // Update đầu tiên, không check %
            priceFeed.updateETHPrice(_newPrice);
            return;
        }
        require(
            (_newPrice > currentPrice && _newPrice - currentPrice > currentPrice / 200) || // >0.5% up
            (_newPrice < currentPrice && currentPrice - _newPrice > currentPrice / 200),   // >0.5% down
            "Gia khong thay doi du"
        );
        
        priceFeed.updateETHPrice(_newPrice);
    }
    
    function addBackend(address _backend) external onlyOwner {
        require(!authorizedBackends[_backend], "Da ton tai");
        authorizedBackends[_backend] = true;
        backendCount++;
        emit BackendAdded(_backend);
    }
    
    // Owner xóa backend
    function removeBackend(address _backend) external onlyOwner {
        require(authorizedBackends[_backend], "Khong ton tai");
        authorizedBackends[_backend] = false;
        backendCount--;
        emit BackendRemoved(_backend);
    }
}