import re

def replace_in_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
        else:
            print(f"  [SKIP] Not found: {old[:60]}...")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# ============== AIChatPanel.tsx ==============
ai_replacements = [
    # toolNameCN -> getToolName function using t
    ("const toolNameCN: Record<string, string> = {\n    get_page_info: '获取页面信息',\n    click_element: '点击元素',\n    input_text: '输入文本',\n    navigate_to: '页面导航',\n    start_recording: '开始录制',\n    stop_recording: '停止录制',\n    get_recordings: '获取用例列表',\n    execute_recording: '执行录制用例',\n    generate_script: '生成测试脚本',\n    export_json: '导出JSON配置',\n    highlight_element: '高亮页面元素',\n  }",
     "const getToolName = (name: string) => {\n    const map: Record<string, string> = {\n      get_page_info: t.toolNameGetPageInfo,\n      click_element: t.toolNameClick,\n      input_text: t.toolNameInput,\n      navigate_to: t.toolNameNavigate,\n      start_recording: t.toolNameStartRecording,\n      stop_recording: t.toolNameStopRecording,\n      get_recordings: t.toolNameGetRecordings,\n      execute_recording: t.toolNameExecuteRecording,\n      generate_script: t.toolNameGenerateScript,\n      export_json: t.toolNameExportJson,\n      highlight_element: t.toolNameHighlight,\n    }\n    return map[name] || name\n  }"),
    
    # References to toolNameCN -> getToolName
    ("toolNameCN[tc.function.name] || tc.function.name", "getToolName(tc.function.name)"),
    ("toolNameCN[msg.tool_name || ''] || msg.tool_name", "getToolName(msg.tool_name || '')"),
    ("toolNameCN[t] || t", "getToolName(t)"),
    
    # Mode switch buttons
    (">💬 LLM 对话</button>", ">{t.llmChatLabel}</button>"),
    (">🛠 Agent 对话</button>", ">{t.agentChatLabel}</button>"),
    
    # Session management
    ("title=\"切换会话\"", "title={t.switchSession}"),
    ("'新会话'", "t.newSessionFallback"),
    ("title=\"新建会话\"", "title={t.createNewSession}"),
    ("`历史会话 (${sessions.length})`", "t.historySessions.replace('{n}', String(sessions.length))"),
    ("'＋ 新建'", "t.newSessionBtn"),
    ("`条 ·`", "t.messagesCount.replace('{n}', String(session.messages.length))"),
    ("title=\"删除\"", "title={t.deleteSession}"),
    ("'暂无历史会话'", "t.noHistorySessions"),
    
    # Tool result UI
    ("'工具: '", "t.toolResultPrefix + ' '"),
    ("'正在调用工具: '", "t.callingTool + ' '"),
    
    # Status text
    ("'生成中...'", "t.generating"),
    ("'思考中...'", "t.thinking"),
    
    # Bottom input area
    (">发送</button>", ">{t.send}</button>"),
    ("className=\"px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-[10px] transition-colors\">清空", "className=\"px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-[10px] transition-colors\">{t.clearBtn}"),
    
    # Error messages in executeTool
    ("error: '无活动标签页'", "error: t.noActiveTab"),
    ("error: '无法注入页面脚本'", "error: t.cannotInjectScript"),
    ("error: `未找到录制用例: ${args.recording_id || args.recording_name}`", "error: `${t.recordingNotFound}: ${args.recording_id || args.recording_name}`"),
    ("error: '该用例没有步骤'", "error: t.noSteps"),
    ("error: '无法获取当前标签页'", "error: t.cannotGetTab"),
    ("error: '执行失败'", "error: t.executionFailed"),
    ("`步骤${i + 1}: ${resp.error || '未知错误'}`", "`${t.stepFailed.replace('{i}', String(i + 1)).replace('{error}', resp.error || 'Unknown')}`"),
    ("error: '缺少 recording_id 参数'", "error: t.missingRecordingId"),
    ("error: '缺少 url 参数'", "error: t.missingUrlParam"),
    ("error: `未知工具: ${name}`", "error: t.unknownTool.replace('{name}', name)"),
    
    # No config alert
    ("'⚠️ 尚未配置 AI API Key。\\n\\n请前往 **设置** → **AI 配置** 中填写你的 API Key（支持 DeepSeek、OpenAI、Claude 或任何兼容 OpenAI 格式的服务）。\\n\\n如果没有 API Key，可以前往 [DeepSeek 开放平台](https://platform.deepseek.com/) 免费获取。'",
     "t.noConfigAlert"),
    
    # API errors
    ("throw new Error('Base URL 未配置，请先在设置中选择提供商或手动填写 Base URL')", "throw new Error(t.baseUrlNotConfigured)"),
    ("throw new Error('API 返回空消息')", "throw new Error(t.apiEmptyResponse)"),
    
    # Assistant content fallback
    ("'（无返回内容）'", "t.noContent"),
    
    # Tool limit
    ("'⚠️ 单次回复中工具调用轮数已达上限（50轮）。你可以继续发送新消息，我会基于当前状态继续操作。'", "t.toolLimitReached"),
    
    # Cancelled / failed
    ("'[已取消]'", "t.cancelled"),
    ("`❌ 调用失败: ${error}`", "t.toolCallFailed.replace('{error}', error)"),
]

# ============== TestCaseList.tsx ==============
tc_replacements = [
    ("setCsError('无法获取当前标签页')", "setCsError(t.csErrorMsgTab)"),
    ("setCsError('当前页面的录制脚本未加载，请刷新页面后重试')", "setCsError(t.csErrorMsgRefresh)"),
    ("const name = prompt('请为登录配置命名（如：管理系统登录）', recording.name)", "const name = prompt(t.saveLoginPrompt, recording.name)"),
    ("alert(`登录配置 \"${name.trim()}\" 已保存`)", "alert(t.loginSaved.replace('{name}', name.trim()))"),
    ("alert('保存登录配置失败')", "alert(t.saveLoginFailed)"),
    ("setScriptError('生成脚本失败: ' + (err?.message || '未知错误'))", "setScriptError(t.generateScriptFailed + ': ' + (err?.message || 'Unknown error'))"),
    ("alert(`✅ JSON 已导出到两处:\\n  ① 浏览器下载目录: ${response.data?.filename}\\n  ② 本地目录: ${response.data?.filename}`)", "alert(t.exportSuccessBoth.replaceAll('{filename}', response.data?.filename || ''))"),
    ("alert(`✅ JSON 已导出: ${response.data?.filename}\\n\\n请确认 Chrome 下载目录已设为 pytest_automation 工程根目录，或在设置中配置本地导出目录。`)", "alert(t.exportSuccessOne.replace('{filename}', response.data?.filename || ''))"),
    ("alert('导出 JSON 失败: ' + (err?.message || '未知错误'))", "alert(t.exportFailed + ': ' + (err?.message || 'Unknown error'))"),
    ("alert('请先切换到目标页面标签')", "alert(t.switchToTargetTab)"),
    ("alert('无法注入页面脚本，请刷新页面后重试')", "alert(t.cannotInjectRetry)"),
    ("setExecError('无法获取当前标签页')", "setExecError(t.cannotGetTab)"),
    ("setExecError('执行失败')", "setExecError(t.executionFailedShort)"),
    ("setExecError('页面已刷新或跳转，脚本断开')", "setExecError(t.pageRefreshed)"),
    
    # action label map
    ("const actionLabel: Record<string, string> = {\n    click: '点击',\n    input: '输入',\n    select: '选择',\n    navigate: '跳转',\n    wait: '等待',\n  }", 
     "const actionLabel: Record<string, string> = {\n    click: t.actionClick,\n    input: t.actionInput,\n    select: t.actionSelect,\n    navigate: t.actionNavigate,\n    wait: t.actionWait,\n  }"),
    
    # exec summary
    ("`${total}步: ${successCount}成功, ${errorCount}失败`", "t.execSummary.replace('{total}', String(total)).replace('{successCount}', String(successCount)).replace('{errorCount}', String(errorCount))"),
    ("`${total}步全部成功`", "t.execAllSuccess.replace('{total}', String(total))"),
    
    # title attributes and text
    ("title='保存为登录配置'", "title={t.saveAsLoginTitle}"),
    ("title='删除用例'", "title={t.deleteCaseTitle}"),
    ("'{recording.steps.length} 个步骤'", "{recording.steps.length + t.stepsCount}"),
    ("'不附带登录'", "{t.noLogin}"),
    ("'登录:'", "{t.loginPrefix}"),
    ("'正在执行...'", "{t.running}"),
    ("'停止'", "{t.stop}"),
    ("title='删除步骤'", "title={t.deleteStepTitle}"),
    ("'页面'", "{t.pageLabel}"),
    ("'错误:'", "{t.errorLabel}"),
]

# ============== SettingsPanel.tsx ==============
sp_replacements = [
    ("setCsError('请先切换到目标页面标签')", "setCsError(t.switchToTargetTab)"),
    ("setCsError('无法注入页面脚本，请刷新页面后重试')", "setCsError(t.cannotInjectRetry)"),
    ("alert(`登录配置 \"${profile.name}\" 执行成功`)", "alert(t.loginSaved.replace('{name}', profile.name))"),
    ("setProfileError('执行失败: ' + (err?.message || '未知错误'))", "setProfileError(t.executionFailedShort + ': ' + (err?.message || 'Unknown error'))"),
    
    # action label map
    ("const actionLabel: Record<string, string> = {\n    click: '点击',\n    input: '输入',\n    select: '选择',\n    navigate: '跳转',\n    wait: '等待',\n  }",
     "const actionLabel: Record<string, string> = {\n    click: t.actionClick,\n    input: t.actionInput,\n    select: t.actionSelect,\n    navigate: t.actionNavigate,\n    wait: t.actionWait,\n  }"),
    
    ("`登录配置档案 (${loginProfiles.length})`", "t.loginProfilesCount.replace('{n}', String(loginProfiles.length))"),
    ("'暂无登录配置，去"用例"标签页录制登录流程后点击 🔒 保存'", "t.noLoginProfilesHint"),
    ("'登录配置'", "{t.loginConfigLabel}"),
    ("`▶ 执行中...`", "{t.executingShort}"),
    ("title='删除'", "title={t.deleteTitle}"),
    ("`个步骤`", "{t.stepsLabel}"),
    ("`▲ 收起步骤`", "{t.collapseSteps}"),
    ("`▼ 展开步骤`", "{t.expandSteps}"),
    ("'选择器: '", "{t.selector + ': '}"),
    ("'XPath: '", "{t.xpath + ': '}"),
    ("'值: '", "{t.value + ': '}"),
    ("'页面: '", "{t.pageLabel + ': '}"),
    ("'Base URL（可选）'", "{t.baseUrlOptional}"),
    ("'保存中...'", "{t.saving}"),
    ("'✓ 已保存'", "{t.savedShort}"),
    ("'配置提示'", "{t.configTip}"),
    ("'选择上方提供商会自动填充 Base URL 和默认模型，你仍可手动修改。'", "{t.configTip1}"),
    ("'所有提供商均使用 OpenAI 兼容格式（/chat/completions）。'", "{t.configTip2}"),
]

# ============== ScriptViewer.tsx ==============
sv_replacements = [
    ("'脚本'", "{t.scriptTitle}"),
    ("'无头模式'", "{t.headlessMode}"),
    ("'GUI 模式'", "{t.guiMode}"),
    ("'📋 复制'", "{t.copy}"),
    ("'⬇ 下载'", "{t.download}"),
]

print("Replacing AIChatPanel.tsx...")
replace_in_file('src/sidepanel/components/AIChatPanel.tsx', ai_replacements)

print("Replacing TestCaseList.tsx...")
replace_in_file('src/sidepanel/components/TestCaseList.tsx', tc_replacements)

print("Replacing SettingsPanel.tsx...")
replace_in_file('src/sidepanel/components/SettingsPanel.tsx', sp_replacements)

print("Replacing ScriptViewer.tsx...")
replace_in_file('src/sidepanel/components/ScriptViewer.tsx', sv_replacements)

print("Done!")
