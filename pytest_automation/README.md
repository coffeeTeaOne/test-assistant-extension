# pytest_automation - 七星瓢虫插件配套

最简版本的 pytest + Playwright 自动化测试工程，配合[七星瓢虫](https://github.com) Chrome 插件使用。

## 目录结构

```
pytest_automation/
├── conftest.py          # pytest fixtures（browser 启动）
├── step_executor.py     # JSON 步骤执行引擎
├── test_recordings.py   # 测试入口
├── recordings/          # 放入插件导出的 JSON 文件
│   └── xxx.json
└── README.md
```

## 安装依赖

```bash
pip install pytest playwright
playwright install chromium
```

## 使用方法

### 1. 导出用例

在七星瓢虫插件中录制操作，点击用例卡片的 **"JSON自动化配置下载"** 按钮，将 JSON 文件保存到 `recordings/` 目录。

### 2. 运行测试

```bash
# 运行所有录制用例
pytest test_recordings.py -v

# 有界面模式（默认已开启）
pytest test_recordings.py -v

# 执行指定用例（按名称匹配）
pytest test_recordings.py -v -k "登录"

# 无界面模式（修改 conftest.py 中 headless=True）
```

## 支持的 action 类型

| action | 说明 |
|--------|------|
| `click` | 点击元素 |
| `input` | 输入文本 |
| `select` | 选择下拉框选项 |
| `navigate` | 页面导航 |
| `wait` | 等待（value 为毫秒数） |
