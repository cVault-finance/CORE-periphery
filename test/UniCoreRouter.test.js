const UniCoreRouter = artifacts.require("COREv1Router");
const UniV2Factory = artifacts.require("UniswapV2Factory");
const WETH = artifacts.require("WETH9");
const CORE = artifacts.require("CORE");
const FeeApproverMock = artifacts.require("FeeApproverMock");
const UniV2Pair = artifacts.require("UniswapV2Pair");
const FeeApprover = artifacts.require('FeeApprover');

const truffleAssert = require("truffle-assertions");
const assert = require("chai").assert;

contract("UniCoreRouter", accounts => {

    let testAccount = accounts[0];
    let setterAccount = accounts[1];
    beforeEach(async () => {
        this.uniV2Factory = await UniV2Factory.new(setterAccount);
        this.weth = await WETH.new();
        this.weth.deposit({ from: setterAccount, value: 10e18.toString() });
        this.coreToken = await CORE.new(this.uniV2Factory.address, this.uniV2Factory.address, { from: setterAccount });
        this.feeapprover = await FeeApprover.new({ from: setterAccount });
        this.corePair = await UniV2Pair.at((await this.uniV2Factory.createPair(this.weth.address, this.coreToken.address)).receipt.logs[0].args.pair);
        await this.feeapprover.initialize(this.coreToken.address, this.weth.address, this.corePair.address, { from: setterAccount });

        await this.feeapprover.setPaused(false, { from: setterAccount });
        await this.coreToken.setShouldTransferChecker(this.feeapprover.address, { from: setterAccount });


        await this.weth.transfer(this.corePair.address, 10e18.toString(), { from: setterAccount });
        await this.coreToken.transfer(this.corePair.address, 10e18.toString(), { from: setterAccount });
        await this.corePair.mint(setterAccount);

        this.coreRouter = await UniCoreRouter.new(this.coreToken.address, this.weth.address, this.uniV2Factory.address, this.corePair.address, this.feeapprover.address);
    });

    it("should load the context", () => { });

    it("should be able to add liquidity with only eth", async () => {
        truffleAssert.passes(
            await this.coreRouter.addLiquidityETHOnly(testAccount, { from: testAccount, value: 10e18.toString() })
        );

        console.log("----Start smaller deposit");
        truffleAssert.passes(
            await this.coreRouter.addLiquidityETHOnly(testAccount, { from: testAccount, value: (40000000000000000).toString() })
        );


        truffleAssert.passes(
            await this.coreRouter.addLiquidityETHOnly(testAccount, { from: testAccount, value: (99).toString() })
        );

        assert.isTrue((await this.corePair.balanceOf(testAccount)).gt(0));
    });

});
