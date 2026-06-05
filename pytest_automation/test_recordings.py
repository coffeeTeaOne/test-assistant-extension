"""
通用 JSON 录制用例执行入口
自动读取 recordings/ 目录下的所有 .json 文件并执行

用法:
    pytest test_recordings.py -v
    pytest test_recordings.py -v -k "登录流程"
    pytest test_recordings.py -v --headed
"""
import json
from pathlib import Path

import pytest

from conftest import RECORDINGS_DIR
from step_executor import StepExecutor


def pytest_generate_tests(metafunc):
    """动态生成测试用例（从 recordings 目录读取 JSON）"""
    if "recording" not in metafunc.fixturenames:
        return

    if not RECORDINGS_DIR.exists():
        metafunc.parametrize("recording", [], ids=[])
        return

    files = sorted(RECORDINGS_DIR.glob("*.json"))
    params = []
    ids = []
    for f in files:
        with open(f, "r", encoding="utf-8") as fp:
            data = json.load(fp)
        params.append(data)
        ids.append(data.get("name", f.stem))

    metafunc.parametrize("recording", params, ids=ids)


class TestJsonRecording:
    """JSON 录制用例执行"""

    def test_recording(self, driver, recording: dict):
        """执行单个录制用例"""
        name = recording.get("name", "unknown")
        steps = recording.get("steps", [])

        print(f"\n{'=' * 50}")
        print(f"▶ 执行录制用例: {name}")
        print(f"   步骤数: {len(steps)}")
        print(f"{'=' * 50}")

        executor = StepExecutor(driver)
        executor.execute_steps(steps)

        print(f"✅ 用例执行完成: {name}")
