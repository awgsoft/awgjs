const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

function resolve(p) {
    return path.resolve(__dirname, p);
}

const baseConfig = {
    // モード値を production に設定すると最適化された状態で、
    // development に設定するとソースマップ有効でJSファイルが出力される
    mode: 'development', // "production" | "development" | "none"

    output: {
        path: path.join(__dirname, "dist"),
    },

    module: {
        rules: [{
            // 拡張子 .ts の場合
            test: /\.ts$/,
            // TypeScript をコンパイルする
            use: 'ts-loader'
        }]
    },
    // import 文で .ts ファイルを解決するため
    resolve: {
        modules: [
            "node_modules", // node_modules 内も対象とする
        ],
        extensions: [
            '.ts',
            '.js' // node_modulesのライブラリ読み込みに必要
        ]
    }
};

const browserConfig = webpackMerge(baseConfig, {
    // メインとなるJavaScriptファイル（エントリーポイント）
    // entry: './src/index.ts',
    entry: './src/index.ts',
    output: {
        filename: "awg.js",
        libraryTarget: 'umd'
    },
});

const processorConfig = webpackMerge(baseConfig, {
    target: 'webworker',
    entry: {
        processor: resolve('./src/player/workletprocessor.ts')
    },
    output: {
        globalObject: 'AudioWorkletGlobalScope',
        filename: "awgproc.js",
    }
});

module.exports = [
    browserConfig,
    processorConfig,
]

