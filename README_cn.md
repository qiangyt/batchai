# batchai - 用 AI 批量处理项目代码

[English](./README.md)

我经常依赖 ChatGPT 和 GitHub Copilot，只是时不时心烦：

- 需要在chat窗口和打开的代码文件之间反复ctrl+c/ctrl+v。为什么 AI 不能直接修改文件呢？

- 有很多文件要处理时不得不一个个点开代码文件来让AI来"查看"。为什么 AI 不能一次性地批量处理呢？

于是就有了`batchai`这么个工具。出发点很简单: 无需再复制粘贴，因为它会遍历指定的目录和文件，而且只在 Git 仓库目录中运行，所以程序员自己需要核对所有 `batchai`做出的更改（因为 AI 也常常犯错）。

目前，`batchai`只支持代码审查和修复常见问题（可以看作是本地的 AI 驱动 的SonarQube）。我正在努力添加更多功能，包括解释和注释生成、测试代码生成以及重构 —— 所有这些都将被批量处理。

过去两周里，我一直在自己的一些项目尝试使用`batchai`，有了一些有趣的发现：

- AI常常能发现那些传统工具（譬如SonarQube）会遗漏的问题。
- AI不会一次性报告所有问题，因此我需要多次运行它。
- 由于 LLM 训练数据的过时和幻觉问题，程序员自己核对更改的准确性必不可少- 这就是为什么我让`batchai`只在干净的 Git 仓库目录中工作。

我找了[spring-petclinic（克隆自https://github.com/spring-projects/spring-petclinic）](https://github.com/qiangyt/spring-petclinic)这个Java项目来演示。

下面是一些正确的例子：

- [添加检查确保生日的值不在未来时间](https://github.com/qiangyt/spring-petclinic/commit/6f42f16a249b3fffa8b95ac625c824210bbb2712#diff-7ba90c8df45063ea6569e3ea29850f6dbd777bc14f76b1115f556ade61441207)

<p align="center">
  <img src="doc/batchai-demo-1.png" width="800">
</p>

- [重命名方法以遵循 JavaBeans 命名约定](https://github.com/qiangyt/spring-petclinic/commit/6f42f16a249b3fffa8b95ac625c824210bbb2712#diff-4788251011337c19f735f2061cf599b8dbc0394a92ba86447b0db9b386f869cd)

<p align="center">
  <img src="doc/batchai-demo-2.png" width="800">
</p>

以及一个错误的例子：

- [将 MySQL 版本从 9.0 降级回 8.0（看来gpt4o-mini所知道的 MySQL 最新版本是 8.0）](https://github.com/qiangyt/spring-petclinic/commit/6f42f16a249b3fffa8b95ac625c824210bbb2712#diff-7bc3b8001f97e9913dec25d48040a4a71b2ff4fcf915b49325602b4facad5979)

<p align="center">
  <img src="doc/batchai-demo-3.png" width="800">
</p>

更多细节：

- [代码审查报告](https://github.com/qiangyt/spring-petclinic/commit/5f2770f2fc0ce4e5d59e2ae348ce0b14c8767e75)

- [依据审查报告生成的修复](https://github.com/qiangyt/spring-petclinic/commit/6f42f16a249b3fffa8b95ac625c824210bbb2712)

## 功能

- [x] 代码审查 : 在控制台输出审查报告并保存下来，然后直接修复代码。
- [x] 自定义提示词。
- [x] 文件忽略 : 指定忽略的文件，支持`.gitignore`和额外的`.batchai_ignore`文件。
- [x] 指定额外的目标路径: 允许指定 Git 仓库中的部分目录和文件。
- [x] 使用 Go 实现: 生成一个可在 Mac OSX、Linux 和 Windows 上运行的单一可执行文件。
- [x] diff显示 : 在控制台中显示彩色差异。
- [x] LLM 支持 : 支持与 OpenAI 兼容的 LLM，包括 Ollama。
- [x] I18N : 支持国际化注释/解释生成。

## 计划的功能

- 解释、注释生成、测试生成、重构。
- 拒绝更改跟踪 : 跟踪被拒绝的更改以避免重复修改。
- 语言特定提示词 : 针对不同编程语言的不同提示词。
- LLM 使用指标 : 实现 LLM 使用跟踪的指标。

## 开始使用

1. 从[这里](https://github.com/qiangyt/batchai/releases/)下载最新的可执行二进制文件并将其添加到您的 $PATH 中。对于 Linux 和 Mac OSX，请记得运行`chmod +x ...`使下载的二进制文件可执行。

2. 克隆演示项目。以下步骤假设克隆的项目目录为 `/data/spring-petclinic`

   ```shell
   cd /data
   git clone https://github.com/spring-projects/spring-petclinic
   cd spring-petclinic
   ```

   在此目录中，创建一个.env文件。在.env文件中设置OPENAI_API_KEY。以下是一个示例：
  
   ```shell
   # OpenAI
   OPENAI_API_KEY=change-it
   #OPENAI_PROXY_URL= 对于国内用户，需要在这里设置代理的URL和用户名密码等等
   #OPENAI_PROXY_USER=
   #OPENAI_PROXY_PASS=
   #BATCHAI_REVIEW_MODEL=openai/gpt-4o-mini

   # Ali TONGYI qwen
   #QWEN_API_KEY=change-it
   #BATCHAI_REVIEW_MODEL=tongyi/qwen2.5-coder-7b-instruct

   # local Ollama
   #OLLAMA_BASE_URL=http://localhost:11434/v1/
   #BATCHAI_REVIEW_MODEL=ollama/qwen2.5-coder:7b-instruct-fp16
   ```

   对于 Ollama，您可以参考我的示例[docker-compose.yml](./docker-compose.yml)

3. CLI 示例:

   - 将审核问题报告输出到控制台（也会保存到 `build/batchai`）:

   ```shell
   cd /data/spring-petclinic
   batchai review . src/main/java/org/springframework/samples/petclinic/vet/Vets.java
   ```

   - 通过`--fix`选项直接修复目标文件:

   ```shell
   cd /data/spring-petclinic
   batchai review --fix . src/main/java/org/springframework/samples/petclinic/vet/Vets.java
   ```

   - 仅对 src/main/java 运行 `batchai`:

   ```shell
   cd /data/spring-petclinic
   batchai review . src/main/java/
   ```

   - 在整个项目中运行`batchai`:

   ```shell
   cd /data/spring-petclinic
   batchai review .
   ```

## CLI 使用

- 查看全局帮助菜单和可用命令，请运行:

  ```shell
  batchai -h
  ```

  ```shell
  NAME:
  batchai - 用 AI 批量处理项目代码

  USAGE:
    batchai [global options] command [command options] <repository directory>  [target files/directories in the repository]

  VERSION:
    0.1.0 (5eeb081)

  COMMANDS:
    review           将问题报告到控制台，也保存到 'build/batchai'
    list             列出要处理的文件
    explain (TODO)   解释代码，输出结果到控制台或作为注释
    comment (TODO)   对代码进行注释
    refactor (TODO)  重构代码
    help, h          显示命令列表或某个命令的帮助

  GLOBAL OPTIONS:
    --enable-symbol-reference  启用符号收集以检查整个项目中的代码引用（默认：false）
    --lang value, -l value     生成文本的语言（默认：en_US.UTF-8）[$LANG]
    --help, -h                 print the version
    --version, -v              打印版本
  ```

- 要查看`review`命令的详细帮助，请运行：

  ```shell
  batchai review -h
  ```

  ```shell
  NAME:
    batchai review - 将问题报告到控制台，也保存到 'build/batchai'

  USAGE:
    batchai review [command options]

  OPTIONS:
    --fix, -f   替换目标文件（默认：false）
    --force     忽略缓存（默认：false）
    --help, -h  show help
  ```

## 支持的 LLMs

已测试和支持的模型：

- OpenAI 系列:
  
  - `openai/gpt-4o`
  
  - `openai/gpt-4o-mini`

  其他OpenAI模型也应该可以正常工作。

- 阿里通义千问系列:
  
  - `qwen2.5-coder-7b-instruct` (也可通过 Ollama 使用)

  其他通义千问模型也应该可以正常工作。
  
要添加更多 LLM，只需按照[res/static/batchai.yaml](res/static/batchai.yaml)中的配置进行操作，只要该 LLM 提供与 OpenAI 兼容的 API 即可。

## 配置

- 可选配置文件:

  可以创建1个`${HOME}/batchai/batchai.yaml`。完整示例请参考[res/static/batchai.yaml](res/static/batchai.yaml)

- 环境文件:

  你也可以通过目标 Git 仓库目录中的 `.env` 文件来配置 `batchai`。有关所有可用环境变量的参考，请查看 [res/static/batchai.yaml](res/static/batchai.yaml) 和它们的默认值[res/static/batchai.env](res/static/batchai.env)

- 忽略特定文件
  `batchai`依据`.gitignore`文件里的规则忽略指定的目录和文件。通常这已经足够，但如果还有额外的不能被git忽略但不必由`batchai`处理的，可以使用`.batchai_ignore`指定，规则写法和`.gitignore`相同。

- 自定义提示词
  请查看 [res/static/batchai.yaml]里的`BATCHAI_REVIEW_RULE_*`和`MY_REVIEW_RULE_*`

## 许可证

MIT
