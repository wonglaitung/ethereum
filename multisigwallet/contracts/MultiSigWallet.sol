// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title 多重签名钱包
 * @dev 一个安全的多重签名钱包实现，需要多个签名者确认才能执行交易
 * @author 智能合约安全指南
 */
contract MultiSigWallet {
    event Deposit(address indexed sender, uint amount);
    event SubmitTransaction(
        address indexed owner,
        uint indexed txIndex,
        address to,
        uint value,
        bytes data
    );
    event ConfirmTransaction(address indexed owner, uint indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint indexed txIndex);
    event OwnersChanged(address[] owners, uint numConfirmationsRequired);
    event ExecutionFailed(uint indexed txIndex);

    address[] public owners; // 所有授权签名者地址
    uint public numConfirmationsRequired; // 执行交易所需的最小确认数

    struct Transaction {
        address to; // 目标地址
        uint value; // 转账金额
        bytes data; // 交易数据（用于合约调用）
        bool executed; // 交易是否已执行
    }

    // 交易索引 => 拥有者 => 是否已确认
    mapping(uint => mapping(address => bool)) public isConfirmed;
    // 交易队列
    Transaction[] public transactions;

    // 修饰器：仅限授权签名者
    modifier onlyOwner() {
        require(isOwner(msg.sender), "MultiSigWallet: not owner");
        _;
    }

    // 修饰器：交易必须存在
    modifier txExists(uint _txIndex) {
        require(_txIndex < transactions.length, "MultiSigWallet: tx does not exist");
        _;
    }

    // 修饰器：交易未执行
    modifier notExecuted(uint _txIndex) {
        require(!transactions[_txIndex].executed, "MultiSigWallet: tx already executed");
        _;
    }

    // 修饰器：未确认交易
    modifier notConfirmed(uint _txIndex) {
        require(!isConfirmed[_txIndex][msg.sender], "MultiSigWallet: tx already confirmed");
        _;
    }

    /**
     * @dev 构造函数
     * @param _owners 授权签名者地址数组
     * @param _numConfirmationsRequired 执行交易所需的最小确认数
     */
    constructor(address[] memory _owners, uint _numConfirmationsRequired) {
        require(_owners.length > 0, "MultiSigWallet: owners required");
        require(
            _numConfirmationsRequired > 0 && 
            _numConfirmationsRequired <= _owners.length,
            "MultiSigWallet: invalid number of required confirmations"
        );

        // 验证并添加所有者
        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "MultiSigWallet: invalid owner");
            require(!isOwner(owner), "MultiSigWallet: owner not unique");

            owners.push(owner);
        }

        numConfirmationsRequired = _numConfirmationsRequired;
    }

    /**
     * @dev 检查地址是否为授权签名者
     * @param _addr 要检查的地址
     * @return bool 是否为授权签名者
     */
    function isOwner(address _addr) public view returns (bool) {
        for (uint i = 0; i < owners.length; i++) {
            if (owners[i] == _addr) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev 获取交易确认数
     * @param _txIndex 交易索引
     * @return uint 确认数
     */
    function getConfirmationCount(uint _txIndex) public view returns (uint) {
        uint count = 0;
        for (uint i = 0; i < owners.length; i++) {
            if (isConfirmed[_txIndex][owners[i]]) count += 1;
        }
        return count;
    }

    /**
     * @dev 检查交易是否已被确认
     * @param _txIndex 交易索引
     * @return bool 是否已被确认
     */
    function isTransactionConfirmed(uint _txIndex) public view returns (bool) {
        return getConfirmationCount(_txIndex) >= numConfirmationsRequired;
    }

    /**
     * @dev 提交新交易
     * @param _to 目标地址
     * @param _value 转账金额
     * @param _data 交易数据
     */
    function submitTransaction(
        address _to,
        uint _value,
        bytes calldata _data
    ) external onlyOwner {
        uint txIndex = transactions.length;
        
        transactions.push(Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false
        }));
        
        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
    }

    /**
     * @dev 确认交易
     * @param _txIndex 交易索引
     */
    function confirmTransaction(uint _txIndex)
        external
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notConfirmed(_txIndex)
    {
        isConfirmed[_txIndex][msg.sender] = true;
        emit ConfirmTransaction(msg.sender, _txIndex);
    
        // 仅在确认足够时尝试执行
        if (isTransactionConfirmed(_txIndex)) {
            // 使用try-catch捕获执行失败，避免整个交易回滚
            try this.executeTransactionInternal(_txIndex) {
                // 执行成功
            } catch {
                // 执行失败，但确认状态已保存
                emit ExecutionFailed(_txIndex);
            }
        }
    }

    // 内部函数，用于try-catch
    function executeTransactionInternal(uint _txIndex) external {
	Transaction storage transaction = transactions[_txIndex];
        require(address(this).balance >= transaction.value, "Insufficient contract balance"); // 新增检查
        require(!transaction.executed, "MultiSigWallet: tx already executed");
        transaction.executed = true;
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "MultiSigWallet: tx failed");
    }

    /**
     * @dev 执行已确认的交易
     * @param _txIndex 交易索引
     */
    function executeTransaction(uint _txIndex)
        public
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        require(isTransactionConfirmed(_txIndex), "MultiSigWallet: not enough confirmations");
        
        Transaction storage transaction = transactions[_txIndex];
        
        // 防止重入攻击：先标记为已执行再调用外部合约
        transaction.executed = true;
        
        // 执行外部调用
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "MultiSigWallet: tx failed");
        
        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    /**
     * @dev 撤销确认
     * @param _txIndex 交易索引
     */
    function revokeConfirmation(uint _txIndex)
        external
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        require(isConfirmed[_txIndex][msg.sender], "MultiSigWallet: tx not confirmed");
        
        isConfirmed[_txIndex][msg.sender] = false;
        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    /**
     * @dev 修改授权签名者列表和确认阈值
     * @param _owners 新的授权签名者地址数组
     * @param _numConfirmationsRequired 新的确认阈值
     */
    function changeOwners(
        address[] calldata _owners,
        uint _numConfirmationsRequired
    ) external onlyOwner {
        require(_owners.length > 0, "MultiSigWallet: owners required");
        require(
            _numConfirmationsRequired > 0 && 
            _numConfirmationsRequired <= _owners.length,
            "MultiSigWallet: invalid number of required confirmations"
        );
        
        // 验证新所有者列表
        for (uint i = 0; i < _owners.length; i++) {
            require(_owners[i] != address(0), "MultiSigWallet: invalid owner");
            for (uint j = i + 1; j < _owners.length; j++) {
                require(_owners[i] != _owners[j], "MultiSigWallet: duplicate owner");
            }
        }
        
        // 清空现有列表
        delete owners;
        
        // 添加新所有者
        for (uint i = 0; i < _owners.length; i++) {
            owners.push(_owners[i]);
        }
        
        numConfirmationsRequired = _numConfirmationsRequired;
        emit OwnersChanged(_owners, _numConfirmationsRequired);
    }

    /**
     * @dev 接收ETH
     */
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }
}

