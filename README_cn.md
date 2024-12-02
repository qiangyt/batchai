# batchai - 对Copilot和Cursor们的补充：用 AI 批量处理项目代码

[English](./README.md)

`batchai`的目标很直接了当：执行一个命令行，遍历整个代码库，让AI为整个代码库批量地执行指定的任务，譬如扫描检查常见错误并修复，譬如生成单元测试代码，等等。实际上，在扫描检查常见错误这上面，`batchai`就类似于AI驱动的SonarQube。所以，`batchai`是对Copilot和Cursor们的补充：不需要在聊天窗口和打开的代码文件之间反复地复制粘贴，也不需要一个个打开文件将它们添加到AI的上下文中。

拿[spring-petclinic（克隆自https://github.com/spring-projects/spring-petclinic）](https://github.com/qiangyt/spring-petclinic)这个Java项目来演示，我在clone下来的目录上执行了下面这个batchai命令:

  ```shell
  batchai check --fix
  ```

就可以得到下面这些结果：

- [添加检查确保生日的值不在未来时间](https://github.com/qiangyt/spring-petclinic/commit/6f42f16a249b3fffa8b95ac625c824210bbb2712#diff-7ba90c8df45063ea6569e3ea29850f6dbd777bc14f76b1115f556ade61441207)

<p align="center">
  <img src="doc/batchai-demo-1.png" width="800">
</p>

- [重命名方法以遵循 JavaBeans 命名约定](https://github.com/qiangyt/spring-petclinic/commit/6f42f16a249b3fffa8b95ac625c824210bbb2712#diff-4788251011337c19f735f2061cf599b8dbc0394a92ba86447b0db9b386f869cd)

<p align="center">
  <img src="doc/batchai-demo-2.png" width="800">
</p>

完整的结果在这里：

- [代码检查报告](https://github.com/qiangyt/spring-petclinic/commit/5f2770f2fc0ce4e5d59e2ae348ce0b14c8767e75)

- [依据检查报告生成的修复](https://github.com/qiangyt/spring-petclinic/commit/6f42f16a249b3fffa8b95ac625c824210bbb2712)

上面这次执行结果是把`batchai`设置成使用了Open AI的`gpt-4o-mini`模型来完成的。

另外，我也刚上线了1个演示网站(https://example.batchai.kailash.cloud:8443)，在这个网站上大家可以提交自己的github代码库、交给batchai去为它们批量检查代码和批量生成单元测试代码。考虑到调用Open AI的成本比较高，这个演示网站使用的模型是开源的`qwen2.5-coder:7b-instruct-fp16`，跑在了我自己的Ollama上，并且只能排队依次执行。

下面是过去几周里我在自己的一些项目测试使用`batchai`后的一些有趣的发现：

- AI常常能发现那些传统工具（譬如SonarQube）会遗漏的问题，而且直接修复。
- AI不会一次性报告所有问题，因此我需要多次运行它。

而且，这里还有一个AI搞砸的例子：

- [将 MySQL 版本从 9.0 降级回 8.0（看来gpt4o-mini所知道的 MySQL 最新版本是 8.0）](https://github.com/qiangyt/spring-petclinic/commit/6f42f16a249b3fffa8b95ac625c824210bbb2712#diff-7bc3b8001f97e9913dec25d48040a4a71b2ff4fcf915b49325602b4facad5979)

<p align="center">
  <img src="doc/batchai-demo-3.png" width="800">
</p>

LLM的幻觉问题无法避免，为了避免AI的错误导致覆盖我们自己原有的修改，我把`batchai`设计成只允许在干净的 Git 仓库目录中工作：如果发现有还没stage的文件，`batchai`会直接拒绝执行，于是我们就能通过git diff来确认AI做出的修改的准确性，如果发现错误，就revert，这一步还是必不可少的。

## 功能

- [x] 批量检查代码: 在控制台输出检查报告并保存下来，然后直接修复代码（可选）。
- [x] 批量生成单元测试代码。
- [x] 自定义提示词。
- [x] 忽略指定的文件，支持`.gitignore`和额外的`.batchai_ignore`文件。
- [x] 指定额外的目标路径: 允许指定 Git 仓库中的部分目录和文件。
- [x] 使用 Go 实现: 生成一个可在 Mac OSX、Linux 和 Windows 上运行的单一可执行文件。
- [x] diff显示 : 在控制台中显示彩色差异。
- [x] LLM 支持 : 支持与 OpenAI 兼容的 LLM，包括 Ollama。
- [x] I18N : 支持国际化注释/解释生成。

## 计划的功能

目前，`batchai`还仅仅是支持批量代码检查和批量生成单元测试代码，但计划的功能包括代码解释和注释生成、重构等 —— 所有这些都将被批量处理。还有就是，尝试让`batchai`能对项目代码有整体的视角，譬如建立跨文件的代码符号索引表，这应该有助于AI工作得更好。

## 开始使用

1. 从[这里](https://github.com/qiangyt/batchai/releases/latest)下载最新的可执行二进制文件并将其添加到您的 $PATH 中。对于 Linux 和 Mac OSX，请记得运行`chmod +x ...`使下载的二进制文件可执行。

2. 克隆演示项目。以下步骤假设克隆的项目目录为 `/data/spring-petclinic`

   ```shell
   cd /data
   git clone https://github.com/spring-projects/spring-petclinic
   cd spring-petclinic
   ```

   在此目录中，创建一个.env文件。在.env文件中设置OPENAI_API_KEY。以下是一个示例(默认使用Open AI的`gpt-4o-mini`模型)：
  
   ```shell
   # OpenAI
   OPENAI_API_KEY=change-it
   #OPENAI_PROXY_URL= 对于国内用户，需要在这里设置代理的URL和用户名密码等等
   #OPENAI_PROXY_USER=
   #OPENAI_PROXY_PASS=

   ```

   对于 Ollama，您可以参考我的示例[docker-compose.yml](./docker-compose.yml)

3. CLI 示例:

   - 将审核问题报告输出到控制台（也会保存到 `build/batchai`）:

   ```shell
   cd /data/spring-petclinic
   batchai check . src/main/java/org/springframework/samples/petclinic/vet/Vets.java
   ```

   - 通过`--fix`选项直接修复目标文件:

   ```shell
   cd /data/spring-petclinic
   batchai check --fix . src/main/java/org/springframework/samples/petclinic/vet/Vets.java
   ```

   - 仅对 src/main/java 运行 `batchai`:

   ```shell
   cd /data/spring-petclinic
   batchai check . src/main/java/
   ```

   - 在整个项目中运行`batchai`:

   ```shell
   cd /data/spring-petclinic
   batchai check .
   ```

   - 为整个代码库生成单元测试代码:

   ```shell
   cd /data/spring-petclinic
   batchai test .
   ```

## 支持的 LLMs

已测试和支持的模型：

- OpenAI 系列:
  
  - `openai/gpt-4o`
  
  - `openai/gpt-4o-mini`

  其他OpenAI模型也应该可以正常工作。

- 阿里通义千问系列 (也可通过 Ollama 使用):
  
  - `qwen2.5-coder-7b-instruct`

  - `qwen2.5-coder:7b-instruct-fp16`

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
  请查看 [res/static/batchai.yaml]里的`BATCHAI_CHECK_RULE_*`和`MY_CHECK_RULE_*`

## 许可证

MIT

## NA

[![GitHub Releases Download](https://img.shields.io/github/downloads/qiangyt/batchai/total.svg?logo=github)](https://somsubhra.github.io/github-release-stats/?username=qiangyt&repository=batchai)

