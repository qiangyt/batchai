
# batchai - utilizes AI for batch processing of project codes

[中文](./README_cn.md)

I often rely on ChatGPT and GitHub Copilot, but feel a bit tired of:

- Have to repeatedly copy and paste between the chat window and opened code files. Why can't AI update the files directly?

- When there are many files to process, I have to open each one individually for the AI to "review." Why can't AI handle everything in batches at once?

Thus I created this `batchai`. The philosophy behind it is simple: no more copy-pasting, as it will traverse the targeted directories and files. It only runs within a Git repository, so we need to confirm all changes made by `batchai` (since AI actually often makes mistakes).

Currently, `batchai` only supports code review and fixing general issues (think of it as an AI-powered local SonarQube). I'm still working on adding more features, including explanation and comment generation, test code generation, as well as refactoring — all will be handled in batches.

Over the past two weeks, I’ve been trying out `batchai` on some of my own projects and have made some interesting findings:

- AI can identify issues that traditional tools, such as SonarQube, tend to miss.
- AI may not report all issues in one go, so I need to run it multiple times.
- Due to outdated LLM training data and hallucinations, it's crucial to confirm the changes for accuracy by myself - That's why I make `batchai` work only on clean Git repository directories.

I used the [spring-petclinic (cloned from https://github.com/spring-projects/spring-petclinic)](https://github.com/qiangyt/spring-petclinic) for demonstration.

Here are some examples of correct review:

- [Adds a check to ensure birthday not be in the future](https://github.com/qiangyt/spring-petclinic/commit/6f42f16a249b3fffa8b95ac625c824210bbb2712#diff-7ba90c8df45063ea6569e3ea29850f6dbd777bc14f76b1115f556ade61441207)

<p align="center">
  <img src="doc/batchai-demo-1.png" width="800">
</p>

- [Renamed method to adhere to JavaBeans naming conventions](https://github.com/qiangyt/spring-petclinic/commit/6f42f16a249b3fffa8b95ac625c824210bbb2712#diff-4788251011337c19f735f2061cf599b8dbc0394a92ba86447b0db9b386f869cd)

<p align="center">
  <img src="doc/batchai-demo-2.png" width="800">
</p>

And also a wrong fix:

- [Downgraded MySQL version from 9.0 back to 8.0 (gpt4o-mini think latest MySQL version is 8.0)](https://github.com/qiangyt/spring-petclinic/commit/6f42f16a249b3fffa8b95ac625c824210bbb2712#diff-7bc3b8001f97e9913dec25d48040a4a71b2ff4fcf915b49325602b4facad5979)

<p align="center">
  <img src="doc/batchai-demo-3.png" width="800">
</p>

More detail:

- [Code Review report](https://github.com/qiangyt/spring-petclinic/commit/5f2770f2fc0ce4e5d59e2ae348ce0b14c8767e75)

- [Fix following the review report](https://github.com/qiangyt/spring-petclinic/commit/6f42f16a249b3fffa8b95ac625c824210bbb2712)

## Features

- [x] Code Review : Reports issues to the console, saves as a review report, and then fixes code directly.
- [x] Customized Prompts.
- [x] File Ignoring : Specifies files to ignore, respecting both `.gitignore` and an additional `.batchai_ignore` file.
- [x] Target Specification : Allows specifying target directories and files within the Git repository.
- [x] Implemented using Go: Resulting in a single executable binary that works on Mac OSX, Linux, and Windows.
- [x] Diff: Displays colorized diffs in the console.
- [x] LLM Support : Supports OpenAI-compatible LLMs, including Ollama.
- [x] I18N : Supports internationalization comment/explaination generation.

## Planned features

- Explain, Comment Generation, Test Generation, Refactoring.
- Rejected Changes Tracking : Tracks rejected changes to avoid redundant modifications.
- Language-Specific Prompts : Different prompts for various programming languages.
- LLM Usage Metrics : Implements metrics for tracking LLM usage.

## Getting Started

1. Download the latest executable binary from [here](https://github.com/qiangyt/batchai/releases/latest) and add it to your $PATH. For Linux and Mac OSX, remember to run `chmod +x ...` to make the binary executable.

2. Clone the demo project. The following steps assume the cloned project directory is `/data/spring-petclinic`

   ```shell
   cd /data
   git clone https://github.com/spring-projects/spring-petclinic
   cd spring-petclinic
   ```

   In this directory, create a .env file. In the .env file, set the OPENAI_API_KEY. Below is an example:
  
   ```shell
   # OpenAI
   OPENAI_API_KEY=change-it
   #OPENAI_PROXY_URL=
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

   For Ollama, you can refer to my example [docker-compose.yml](./docker-compose.yml)

3. CLI Examples:

   - Report issues to the console (also saved to `build/batchai`):

   ```shell
   cd /data/spring-petclinic
   batchai review . src/main/java/org/springframework/samples/petclinic/vet/Vets.java
   ```

   - Directly fix the target files via option `--fix`:

   ```shell
   cd /data/spring-petclinic
   batchai review --fix . src/main/java/org/springframework/samples/petclinic/vet/Vets.java
   ```

   - Run `batchai` in main Java code only:

   ```shell
   cd /data/spring-petclinic
   batchai review . src/main/java/
   ```

   - Run `batchai` on the entire project:

   ```shell
   cd /data/spring-petclinic
   batchai review .
   ```

## CLI Usage

- To view the global help menu and available commands, run:

  ```shell
  batchai -h
  ```

  ```shell
  NAME:
  batchai - utilizes AI for batch processing of project codes

  USAGE:
    batchai [global options] command [command options] <repository directory>  [target files/directories in the repository]

  VERSION:
    0.1.0 (5eeb081)

  COMMANDS:
    review           Report issues to console, also saved to 'build/batchai'
    list             Lists files to process
    explain (TODO)   Explains the code, output result to console or as comment
    comment (TODO)   Comments the code
    refactor (TODO)  Refactors the code
    help, h          Shows a list of commands or help for one command

  GLOBAL OPTIONS:
    --enable-symbol-reference  Enables symbol collection to examine code references across the entire project (default: false)
    --force                    Ignores the cache (default: false)
    --lang value, -l value     language for generated text (default: en_US.UTF-8) [$LANG]
    --help, -h                 show help
    --version, -v              print the version
  ```

- To see detailed help for the `review` command, run:

  ```shell
  batchai review -h
  ```

  ```shell
  NAME:
    batchai review - Report issues to console, also saved to 'build/batchai'

  USAGE:
    batchai review [command options]

  OPTIONS:
    --fix, -f   Replaces the target files (default: false)
    --help, -h  show help
  ```

## Supported LLMs

Tested and supported models:

- OpenAI series: 
  
  - `openai/gpt-4o`
  
  - `openai/gpt-4o-mini`

  Other OpenAI models should work too.

- Ali TONYI Qwen series: 
  
  - `qwen2.5-coder-7b-instruct` (also available via Ollama)

  Other Qwen models should work too.
  
To add more LLMs, simply follow the configuration in [res/static/batchai.yaml](res/static/batchai.yaml), as long as the LLM exposes an OpenAI-compatible API.

## Configuration

- Optional configuration file:

  You can provide an optional configuration file: `${HOME}/batchai/batchai.yaml`. For a full example, refer to [res/static/batchai.yaml](res/static/batchai.yaml)

- Environment file:

  You can also configure `batchai` via an environment file `.env` located in the target Git repository directory. Refer to [res/static/batchai.yaml](res/static/batchai.yaml) for all available environment variables, and [res/static/batchai.env](res/static/batchai.env) for their default values.

- Ignore specific files:

  `batchai` ignores the directories and files following `.gitignore` files. This is usually sufficient, but if there are additional files or directories that cannot be ignored by Git but should not be processed by batchai, we can specify them in the `.batchai_ignore` files. The rules are written in the same way as in `.gitignore`.
  
- Customized Prompts
  Refer to `BATCHAI_REVIEW_RULE_*` and `MY_REVIEW_RULE_*` in [res/static/batchai.yaml]

## License

MIT

## NA

[![GitHub release](https://img.shields.io/github/v/release/qiangyt/batchai.svg)](https://github.com/qiangyt/batchai/releases/latest)
[![GitHub Releases Download](https://img.shields.io/github/downloads/qiangyt/batchai/total.svg?logo=github)](https://somsubhra.github.io/github-release-stats/?username=qiangyt&repository=batchai)
